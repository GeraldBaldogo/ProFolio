const communicationService = require('../services/communication.service');

const getPrompt = (req, res, next) => {
  try {
    const { difficulty = 'easy' } = req.query;
    const prompt = communicationService.getCommunicationPrompt({ difficulty });
    res.json({ success: true, data: prompt });
  } catch (err) {
    next(err);
  }
};

const submitResult = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const result = await communicationService.submitCommunicationResult(user_id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPrompt, submitResult };