const evaluationRepo = require('../repositories/evaluation.repo');
const portfolioRepo = require('../repositories/portfolio.repo');
const supabase = require('../config/db');

const submitHumanEvaluation = async (evaluator_id, portfolio_id, evaluationData) => {
  const portfolio = await portfolioRepo.findById(portfolio_id);
  if (!portfolio) throw { status: 404, message: 'Portfolio not found.' };

  if (portfolio.status !== 'ai_reviewed' && portfolio.status !== 'submitted') {
    throw { status: 400, message: 'Portfolio is not ready for human evaluation.' };
  }

  const evaluation = await evaluationRepo.createHumanEvaluation({
    portfolio_id,
    evaluator_id,
    ...evaluationData
  });

  // I-update ang portfolio status
  const newStatus = evaluationData.verdict === 'needs_revision' ? 'revision_requested' : 'completed';
  await supabase
    .from('portfolios')
    .update({ status: newStatus })
    .eq('id', portfolio_id);

  return evaluation;
};

const getHumanEvaluation = async (portfolio_id) => {
  const evaluation = await evaluationRepo.findByPortfolioId(portfolio_id);

  if (!evaluation) {
    return null;
  }

  return evaluation;
};

const getAssignedPortfolios = async (evaluator_id) => {
  const assignments = await evaluationRepo.findAssignedPortfolios(evaluator_id);
  return assignments;
};

module.exports = { submitHumanEvaluation, getHumanEvaluation, getAssignedPortfolios };