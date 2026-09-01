const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/user.repo');
const messagingRepo = require('../repositories/messaging.repo');

const allowedOrigins = [
  'http://localhost:5173',
  'https://pro-folio-development.vercel.app'
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

    socket.join(`user:${socket.user.id}`);

    // Join a conversation room, after verifying the user actually belongs
    // to it (either as the student or the professor/evaluator).
    socket.on('join_conversation', async (conversationId, callback) => {
      try {
        const conversation = await messagingRepo.getConversationById(conversationId);
        if (!conversation) {
          return callback?.({ success: false, message: 'Conversation not found' });
        }

        const isParticipant =
          conversation.student_id === socket.user.id ||
          conversation.professor_id === socket.user.id;

        if (!isParticipant) {
          return callback?.({ success: false, message: 'Not authorized for this conversation' });
        }

        socket.join(`conversation:${conversationId}`);
        callback?.({ success: true });
      } catch (err) {
        console.error('join_conversation error:', err.message);
        callback?.({ success: false, message: 'Failed to join conversation' });
      }
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Save the message to the DB, then broadcast it to everyone in the room
    // (including the sender, so all open tabs stay in sync).
    socket.on('send_message', async ({ conversation_id, content }, callback) => {
      try {
        if (!content || !content.trim()) {
          return callback?.({ success: false, message: 'Message cannot be empty' });
        }

        const conversation = await messagingRepo.getConversationById(conversation_id);
        if (!conversation) {
          return callback?.({ success: false, message: 'Conversation not found' });
        }

        const isParticipant =
          conversation.student_id === socket.user.id ||
          conversation.professor_id === socket.user.id;

        if (!isParticipant) {
          return callback?.({ success: false, message: 'Not authorized for this conversation' });
        }

        const message = await messagingRepo.createMessage(
          conversation_id,
          socket.user.id,
          content.trim()
        );

        io.to(`conversation:${conversation_id}`).emit('new_message', message);
        const recipientId = conversation.student_id === socket.user.id
          ? conversation.professor_id
          : conversation.student_id;
 
        // Sent separately from new_message on purpose. A page showing the
        // conversation already has the message; this is only for the badge and
        // the sound, and carries just enough to render a toast.
        io.to(`user:${recipientId}`).emit('message_notification', {
          conversation_id,
          message_id: message.id,
          content: message.content,
          sender_id: socket.user.id,
          sender_name: socket.user.full_name || 'New message',
          created_at: message.created_at,
        });
        callback?.({ success: true, data: message });
      } catch (err) {
        console.error('send_message error:', err.message);
        callback?.({ success: false, message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  return io;
}

module.exports = initSocket;