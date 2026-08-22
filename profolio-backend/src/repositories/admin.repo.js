const supabase = require('../config/db');

const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, is_active, is_approved, created_at')
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

const approveUser = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .update({ is_approved: true })
    .eq('id', id)
    .select()
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
  // Fix: previously no check that evaluator_id actually belongs to a user
  // with role 'evaluator' - an admin could accidentally assign a student
  // as the reviewer of a portfolio.
  const { data: evaluatorUser, error: evaluatorError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', evaluator_id)
    .single();
  if (evaluatorError || !evaluatorUser) {
    throw { status: 404, message: 'Evaluator not found.' };
  }
  if (evaluatorUser.role !== 'evaluator') {
    throw { status: 400, message: 'The selected user is not an evaluator/professor.' };
  }

  // Fix: previously no check on portfolio status - an admin could assign a
  // reviewer to a portfolio that's still a draft (student hasn't submitted).
  const { data: portfolio, error: portfolioError } = await supabase
    .from('portfolios')
    .select('id, status')
    .eq('id', portfolio_id)
    .single();
  if (portfolioError || !portfolio) {
    throw { status: 404, message: 'Portfolio not found.' };
  }
  if (!['submitted', 'ai_reviewed'].includes(portfolio.status)) {
    throw { status: 400, message: `Portfolio must be submitted before an evaluator can be assigned (current status: ${portfolio.status}).` };
  }

  // Check if already assigned
  const { data: existing } = await supabase
    .from('evaluator_assignments')
    .select('id')
    .eq('portfolio_id', portfolio_id)
    .single();
  if (existing) throw { status: 400, message: 'This portfolio already has an assigned evaluator.' };

  const { data, error } = await supabase
    .from('evaluator_assignments')
    .insert([{ portfolio_id, evaluator_id, assigned_by }])
    .select()
    .single();
  if (error) throw error;

  // Update portfolio status to under_review
  await supabase
    .from('portfolios')
    .update({ status: 'under_review' })
    .eq('id', portfolio_id);

  return data;
};

const getPortfolios = async () => {
  const { data, error } = await supabase
    .from('portfolios')
    .select(`
      id,
      status,
      created_at,
      student_profiles!portfolios_student_id_fkey (
        course,
        school,
        year_level,
        users!student_profiles_user_id_fkey (full_name, email)
      )
    `)
    .order('created_at', { ascending: false });
  if (error) {
    // Fallback: try without explicit FK hints
    const { data: data2, error: error2 } = await supabase
      .from('portfolios')
      .select('id, status, created_at, student_id')
      .order('created_at', { ascending: false });
    if (error2) throw error2;
    return data2;
  }
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
    ? (evaluations.data.reduce((sum, e) => sum + parseFloat(e.final_score), 0) / evaluations.data.length).toFixed(2)
    : 0;

  return {
    users: { total: totalUsers, students: totalStudents, evaluators: totalEvaluators },
    portfolios: { total: totalPortfolios, submitted: submittedPortfolios, completed: completedPortfolios },
    evaluations: { total: totalEvaluations, passed: passedEvaluations, average_score: avgScore }
  };
};

module.exports = { getAllUsers, updateUserRole, toggleUserStatus, assignEvaluator, getPortfolios, getAnalytics, approveUser };