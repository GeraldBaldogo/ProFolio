const messagingService = require('../services/messaging.service');

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
    }

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
};

module.exports = { startConversation, listConversations, getMessages, sendMessage };