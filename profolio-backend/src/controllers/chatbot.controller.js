const chatbotService = require('../services/chatbot.service');

const sendMessage = async (req, res, next) => {
  try {
    const result = await chatbotService.sendMessage(req.user.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const getHistory = async (req, res, next) => {
  try {
    const history = await chatbotService.getHistory(req.user.id);
    res.json({ success: true, data: history });
  } catch (err) { next(err); }
};

const clearHistory = async (req, res, next) => {
  try {
    await chatbotService.clearHistory(req.user.id);
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = { sendMessage, getHistory, clearHistory };