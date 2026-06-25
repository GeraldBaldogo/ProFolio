const recommendationService = require('../services/recommendation.service');

const generate = async (req, res) => {
  try {
    const user_id = req.user.id;
    const data = await recommendationService.generateRecommendations(user_id);
    res.status(201).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to generate recommendations.' });
  }
};

const getLatest = async (req, res) => {
  try {
    const user_id = req.user.id;
    const data = await recommendationService.getLatestRecommendations(user_id);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'No recommendations found.' });
  }
};

const getAll = async (req, res) => {
  try {
    const user_id = req.user.id;
    const data = await recommendationService.getAllRecommendations(user_id);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to retrieve recommendations.' });
  }
};

module.exports = { generate, getLatest, getAll };