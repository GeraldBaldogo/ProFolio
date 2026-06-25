const cvService = require('../services/cv.service');

const generate = async (req, res) => {
  try {
    const user_id = req.user.id;
    const data = await cvService.generateCV(user_id);
    res.status(201).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to generate CV.' });
  }
};

const getLatest = async (req, res) => {
  try {
    const user_id = req.user.id;
    const data = await cvService.getLatestCV(user_id);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'No generated CV found.' });
  }
};

const getHistory = async (req, res) => {
  try {
    const user_id = req.user.id;
    const data = await cvService.getCVHistory(user_id);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to retrieve CV history.' });
  }
};

module.exports = { generate, getLatest, getHistory };