const messagingService = require('../services/messaging.service');
const messagingRepo = require('../repositories/messaging.repo');

const startConversation = async (req, res, next) => {
  try {
    const conversation = await messagingService.startConversation(req.user, req.body.other_user_id);
    res.status(201).json({ success: true, data: conversation });
  } catch (err) {
    next(err);
  }
};

const listConversations = async (req, res, next) => {
  try {
    const conversations = await messagingService.listConversations(req.user);
    res.json({ success: true, data: conversations });
  } catch (err) {
    next(err);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const messages = await messagingService.getConversationMessages(req.params.id, req.user);
    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
};

// REST fallback for sending (works even if the socket connection drops).
// Also emits via Socket.IO so the other participant sees it live, keeping
// both transports consistent instead of only pushing real-time via socket.
const sendMessage = async (req, res, next) => {
  try {
    const message = await messagingService.sendMessage(req.params.id, req.user, req.body.content);

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${req.params.id}`).emit('new_message', message);

      // The same notice the live connection sends, so the other person gets
      // the badge, toast and sound whichever way the message was sent. The
      // frontend now sends every message this way.
      const conversation = await messagingRepo.getConversationById(req.params.id);
      if (conversation) {
        const recipientId = conversation.student_id === req.user.id
          ? conversation.professor_id
          : conversation.student_id;
        io.to(`user:${recipientId}`).emit('message_notification', {
          conversation_id: req.params.id,
          message_id: message.id,
          content: message.content,
          sender_id: req.user.id,
          sender_name: req.user.full_name || 'New message',
          created_at: message.created_at,
        });
      }
    }

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
};

const setNickname = async (req, res, next) => {
  try {
    const conversation = await messagingService.setNickname(req.params.id, req.user, req.body || {});

    // Both people see the new name straight away, on whichever page they're on.
    const io = req.app.get('io');
    if (io) {
      const update = {
        id: conversation.id,
        student_nickname: conversation.student_nickname || null,
        professor_nickname: conversation.professor_nickname || null,
      };
      io.to(`user:${conversation.student_id}`).to(`user:${conversation.professor_id}`)
        .emit('conversation_updated', update);
    }

    res.json({ success: true, data: conversation });
  } catch (err) {
    next(err);
  }
};

module.exports = { startConversation, listConversations, getMessages, sendMessage, setNickname };