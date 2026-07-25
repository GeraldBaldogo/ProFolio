const evaluationRepo = require('../repositories/evaluation.repo');
const portfolioRepo = require('../repositories/portfolio.repo');
const portfolioService = require('./portfolio.service');
const supabase = require('../config/db');

const submitHumanEvaluation = async (evaluator_id, portfolio_id, evaluationData) => {
  const portfolio = await portfolioRepo.findById(portfolio_id);
  if (!portfolio) throw { status: 404, message: 'Portfolio not found.' };

  const allowedStatuses = ['submitted', 'ai_reviewed', 'under_review'];
  if (!allowedStatuses.includes(portfolio.status)) {
    throw { status: 400, message: 'Portfolio is not ready for human evaluation.' };
  }

  const { data: assignment } = await supabase
    .from('evaluator_assignments')
    .select('id')
    .eq('portfolio_id', portfolio_id)
    .eq('evaluator_id', evaluator_id)
    .single();

  if (!assignment) {
    throw { status: 403, message: 'You are not assigned to evaluate this portfolio.' };
  }

  const evaluation = await evaluationRepo.createHumanEvaluation({
    portfolio_id,
    evaluator_id,
    ...evaluationData
  });

  const newStatus = evaluationData.verdict === 'needs_revision' ? 'revision_requested' : 'completed';
  await supabase
    .from('portfolios')
    .update({ status: newStatus })
    .eq('id', portfolio_id);

  return evaluation;
};

// Fix: previously had no ownership check at all - any authenticated user
// could view any portfolio's human evaluation (professor's grading
// comments/verdict) just by knowing the portfolio_id.
const getHumanEvaluation = async (portfolio_id, requestingUser) => {
  const portfolio = await portfolioRepo.findById(portfolio_id);
  if (!portfolio) throw { status: 404, message: 'Portfolio not found.' };
  await portfolioService.assertCanAccessPortfolio(portfolio, requestingUser);

  const evaluation = await evaluationRepo.findByPortfolioId(portfolio_id);
  if (!evaluation) throw { status: 404, message: 'No human evaluation found for this portfolio.' };
  return evaluation;
};

const getAssignedPortfolios = async (evaluator_id) => {
  const assignments = await evaluationRepo.findAssignedPortfolios(evaluator_id);
  return assignments;
};

module.exports = { submitHumanEvaluation, getHumanEvaluation, getAssignedPortfolios };