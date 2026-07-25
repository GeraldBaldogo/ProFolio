const proctoringService = require('../services/proctoring.service');

const logEvent = async (req, res, next) => {
  try {
    const event = await proctoringService.logEvent(req.user.id, req.body);
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

const getSessionReport = async (req, res, next) => {
  try {
    const report = await proctoringService.getSessionReport(req.params.session_id);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

const getStudentFlagHistory = async (req, res, next) => {
  try {
    const history = await proctoringService.getStudentFlagHistory(req.params.user_id);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

module.exports = { logEvent, getSessionReport, getStudentFlagHistory };