const cvService = require('../services/cv.service');

const generate = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    // Optional: { exclude: { projects: [ids], skills: [ids], ... } } — the
    // items the student unticked before generating. Missing means use all.
    const data = await cvService.generateCV(user_id, req.body?.exclude);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

// Everything the student can choose to put on the CV, for the step before
// generating.
const getSources = async (req, res, next) => {
  try {
    const data = await cvService.getCVSources(req.user.id);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

const getLatest = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const data = await cvService.getLatestCV(user_id);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const data = await cvService.getCVHistory(user_id);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = { generate, getSources, getLatest, getHistory };