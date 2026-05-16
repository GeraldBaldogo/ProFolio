const supabase = require('../config/db');

const createHumanEvaluation = async ({ portfolio_id, evaluator_id, final_score, comments, recommendations, career_readiness, verdict }) => {
  const { data, error } = await supabase
    .from('human_evaluations')
    .insert([{ portfolio_id, evaluator_id, final_score, comments, recommendations, career_readiness, verdict }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

const findByPortfolioId = async (portfolio_id) => {
  const { data, error } = await supabase
    .from('human_evaluations')
    .select('*')
    .eq('portfolio_id', portfolio_id)
    .single();
  if (error) return null;
  return data;
};

const findAssignedPortfolios = async (evaluator_id) => {
  const { data, error } = await supabase
    .from('evaluator_assignments')
    .select(`
      *,
      portfolios (
        *,
        student_profiles (
          *,
          users (full_name, email)
        )
      )
    `)
    .eq('evaluator_id', evaluator_id);
  if (error) throw error;
  return data;
};

module.exports = { createHumanEvaluation, findByPortfolioId, findAssignedPortfolios };