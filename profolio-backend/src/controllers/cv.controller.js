const cvService = require('../services/cv.service');

const generate = async (req, res) => {
  try {
    const user_id = req.user.id;
    // Optional: { exclude: { projects: [ids], skills: [ids], ... } } — the
    // items the student unticked before generating. Missing means use all.
    const data = await cvService.generateCV(user_id, req.body?.exclude);
    res.status(201).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to generate CV.' });
  }
};

// Everything the student can choose to put on the CV, for the step before
// generating.
const getSources = async (req, res) => {
  try {
    const data = await cvService.getCVSources(req.user.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to load your portfolio.' });
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

module.exports = { generate, getSources, getLatest, getHistory };