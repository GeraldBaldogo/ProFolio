const supabase = require('../config/db');

const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, is_active, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

const updateUserRole = async (id, role) => {
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', id)
    .select('id, full_name, email, role')
    .single();
  if (error) throw error;
  return data;
};

const toggleUserStatus = async (id, is_active) => {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active })
    .eq('id', id)
    .select('id, full_name, email, is_active')
    .single();
  if (error) throw error;
  return data;
};

const assignEvaluator = async (portfolio_id, evaluator_id, assigned_by) => {
  const { data, error } = await supabase
    .from('evaluator_assignments')
    .insert([{ portfolio_id, evaluator_id, assigned_by }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

const getAnalytics = async () => {
  const [users, portfolios, evaluations] = await Promise.all([
    supabase.from('users').select('role'),
    supabase.from('portfolios').select('status'),
    supabase.from('human_evaluations').select('verdict, final_score'),
  ]);

  const totalUsers = users.data?.length || 0;
  const totalStudents = users.data?.filter(u => u.role === 'student').length || 0;
  const totalEvaluators = users.data?.filter(u => u.role === 'evaluator').length || 0;

  const totalPortfolios = portfolios.data?.length || 0;
  const submittedPortfolios = portfolios.data?.filter(p => p.status !== 'draft').length || 0;
  const completedPortfolios = portfolios.data?.filter(p => p.status === 'completed').length || 0;

  const totalEvaluations = evaluations.data?.length || 0;
  const passedEvaluations = evaluations.data?.filter(e => e.verdict === 'passed').length || 0;
  const avgScore = evaluations.data?.length
    ? (evaluations.data.reduce((sum, e) => sum + e.final_score, 0) / evaluations.data.length).toFixed(2)
    : 0;

  return {
    users: { total: totalUsers, students: totalStudents, evaluators: totalEvaluators },
    portfolios: { total: totalPortfolios, submitted: submittedPortfolios, completed: completedPortfolios },
    evaluations: { total: totalEvaluations, passed: passedEvaluations, average_score: avgScore }
  };
};

module.exports = { getAllUsers, updateUserRole, toggleUserStatus, assignEvaluator, getAnalytics };