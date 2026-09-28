const assessmentService = require('../services/assessment.service');
const progressService = require('../services/progress.service');
const titlesService = require('../services/titles.service');

const submitTyping = async (req, res, next) => {
  try {
    const result = await assessmentService.submitTypingResult(req.user.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const getTypingText = async (req, res, next) => {
  try {
    const text = assessmentService.getTypingText(req.query);
    res.json({ success: true, data: { text } });
  } catch (err) { next(err); }
};

const generateChallenge = async (req, res, next) => {
  try {
    const challenge = await assessmentService.generateChallenge(req.user.id, req.body);
    res.json({ success: true, data: challenge });
  } catch (err) { next(err); }
};

const submitCoding = async (req, res, next) => {
  try {
    const result = await assessmentService.submitCodingResult(req.user.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const generateFlowchartProblem = async (req, res, next) => {
  try {
    const problem = await assessmentService.generateFlowchartProblem(req.user.id, req.query);
    res.json({ success: true, data: problem });
  } catch (err) { next(err); }
};

const submitFlowchart = async (req, res, next) => {
  try {
    const result = await assessmentService.submitFlowchartResult(req.user.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const generateSQLChallenge = async (req, res, next) => {
  try {
    const challenge = await assessmentService.generateSQLChallenge(req.user.id, req.body);
    res.json({ success: true, data: challenge });
  } catch (err) { next(err); }
};

const submitSQL = async (req, res, next) => {
  try {
    const result = await assessmentService.submitSQLResult(req.user.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const generateBugFixChallenge = async (req, res, next) => {
  try {
    const challenge = await assessmentService.generateBugFixChallenge(req.user.id, req.body);
    res.json({ success: true, data: challenge });
  } catch (err) { next(err); }
};

const submitBugFix = async (req, res, next) => {
  try {
    const result = await assessmentService.submitBugFixResult(req.user.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const submitCommunication = async (req, res, next) => {
  try {
    const result = await assessmentService.submitCommunicationResult(req.user.id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const summary = await assessmentService.getAssessmentSummary(req.user.id);
    res.json({ success: true, data: summary });
  } catch (err) { next(err); }
};

const getMyResults = async (req, res, next) => {
  try {
    const results = await assessmentService.getMyResults(req.user.id);
    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

const resetScores = async (req, res, next) => {
  try {
    const supabase = require('../config/db');
    await supabase.from('assessment_results').delete().eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) { next(err); }
};

// Which practice levels and topics this student has opened and passed.
// /progress for every type at once, /progress/:type for one.
const getProgress = async (req, res, next) => {
  try {
    const data = req.params.type
      ? await progressService.getProgress(req.user.id, req.params.type)
      : await progressService.getAllProgress(req.user.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// Practice ranks and verified titles, with the history behind each.
const getTitles = async (req, res, next) => {
  try {
    res.json({ success: true, data: await titlesService.getTitles(req.user.id) });
  } catch (err) { next(err); }
};

module.exports = {
  getProgress, getTitles,
  submitTyping, getTypingText,
  generateChallenge, submitCoding,
  generateFlowchartProblem, submitFlowchart,
  generateSQLChallenge, submitSQL,
  generateBugFixChallenge, submitBugFix,
  getSummary, getMyResults, resetScores, submitCommunication
};