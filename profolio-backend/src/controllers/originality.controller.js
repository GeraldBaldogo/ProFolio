const originalityService = require('../services/originality.service');

const checkOriginality = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { content, content_type } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Content is required.' });
    }

    if (content.trim().length < 50) {
      return res.status(400).json({ message: 'Content must be at least 50 characters for accurate analysis.' });
    }

    const result = await originalityService.checkOriginality(user_id, content, content_type);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const data = await originalityService.getOriginalityHistory(user_id);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await originalityService.getOriginalityById(id, req.user);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = { checkOriginality, getHistory, getById };