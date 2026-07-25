const aiService = require('../services/ai.service');
const evaluationService = require('../services/evaluation.service');

const triggerAIEvaluation = async (req, res, next) => {
  try {
    const result = await aiService.evaluatePortfolio(req.params.portfolio_id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getAIEvaluation = async (req, res, next) => {
  try {
    const result = await aiService.getEvaluation(req.params.portfolio_id, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const submitHumanEvaluation = async (req, res, next) => {
  try {
    const result = await evaluationService.submitHumanEvaluation(
      req.user.id,
      req.params.portfolio_id,
      req.body
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getHumanEvaluation = async (req, res, next) => {
  try {
    const result = await evaluationService.getHumanEvaluation(req.params.portfolio_id, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getAssignedPortfolios = async (req, res, next) => {
  try {
    const result = await evaluationService.getAssignedPortfolios(req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { triggerAIEvaluation, getAIEvaluation, submitHumanEvaluation, getHumanEvaluation, getAssignedPortfolios };