const communicationService = require('../services/communication.service');

// Async now, and told who's asking: the service checks which levels this
// student has opened before handing out a prompt from one.
const getPrompt = async (req, res, next) => {
  try {
    const { difficulty = 'easy', topic = null } = req.query;
    const prompt = await communicationService.getCommunicationPrompt(req.user.id, { difficulty, topic });
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