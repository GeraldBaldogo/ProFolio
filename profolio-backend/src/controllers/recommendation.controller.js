const recommendationService = require('../services/recommendation.service');

const generate = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const data = await recommendationService.generateRecommendations(user_id);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

const getLatest = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const data = await recommendationService.getLatestRecommendations(user_id);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const data = await recommendationService.getAllRecommendations(user_id);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = { generate, getLatest, getAll };