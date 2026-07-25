const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/user.repo');
const messagingRepo = require('../repositories/messaging.repo');
const messagingService = require('../services/messaging.service');

const allowedOrigins = [
  'http://localhost:5173',
  'https://pro-folio-lake.vercel.app'
];

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    },
  });

  // Authenticate every socket connection using the same JWT used by the
  // REST API (sent by the frontend as `auth: { token }` in getSocket()).
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userRepo.findById(decoded.id);

      if (!user || !user.is_active) {
        return next(new Error('Unauthorized'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id, '| user:', socket.user.id);

    // Join a conversation room, after verifying the user actually belongs
    // to it (either as the student or the professor/evaluator).
    socket.on('join_conversation', async (conversationId, callback) => {
      try {
        const conversation = await messagingRepo.getConversationById(conversationId);
        if (!conversation) {
          return callback?.({ success: false, message: 'Conversation not found' });
        }

        await messagingService.assertParticipant(conversation, socket.user);

        socket.join(`conversation:${conversationId}`);
        callback?.({ success: true });
      } catch (err) {
        console.error('join_conversation error:', err.message);
        callback?.({ success: false, message: err.message || 'Failed to join conversation' });
      }
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Save the message to the DB, then broadcast it to everyone in the room
    // (including the sender, so all open tabs stay in sync).
    socket.on('send_message', async ({ conversation_id, content }, callback) => {
      try {
        const message = await messagingService.sendMessage(conversation_id, socket.user, content);

        io.to(`conversation:${conversation_id}`).emit('new_message', message);
        callback?.({ success: true, data: message });
      } catch (err) {
        console.error('send_message error:', err.message);
        callback?.({ success: false, message: err.message || 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  return io;
}

module.exports = initSocket;