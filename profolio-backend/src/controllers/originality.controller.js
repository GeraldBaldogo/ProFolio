const originalityService = require('../services/originality.service');

const checkOriginality = async (req, res) => {
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
    res.status(err.status || 500).json({ message: err.message || 'Failed to check originality.' });
  }
};

const getHistory = async (req, res) => {
  try {
    const user_id = req.user.id;
    const data = await originalityService.getOriginalityHistory(user_id);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to retrieve originality history.' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await originalityService.getOriginalityById(id, req.user);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Originality check not found.' });
  }
};

module.exports = { checkOriginality, getHistory, getById };