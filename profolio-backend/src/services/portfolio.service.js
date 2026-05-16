const portfolioRepo = require('../repositories/portfolio.repo');
const supabase = require('../config/db');

const createPortfolio = async (user_id) => {
  const { data: profile, error } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user_id)
    .single();

  if (error || !profile) throw { status: 404, message: 'Student profile not found. Please complete your profile first.' };

  const portfolio = await portfolioRepo.create(profile.id);
  return portfolio;
};

const getMyPortfolios = async (user_id) => {
  const { data: profile, error } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user_id)
    .single();

  if (error || !profile) throw { status: 404, message: 'Student profile not found.' };

  const portfolios = await portfolioRepo.findByStudentId(profile.id);
  return portfolios;
};

const getPortfolioById = async (id) => {
  const portfolio = await portfolioRepo.findById(id);
  if (!portfolio) throw { status: 404, message: 'Portfolio not found.' };
  return portfolio;
};

const submitPortfolio = async (id) => {
  const portfolio = await portfolioRepo.findById(id);
  if (!portfolio) throw { status: 404, message: 'Portfolio not found.' };
  if (portfolio.status !== 'draft') throw { status: 400, message: 'Only draft portfolios can be submitted.' };

  const updated = await portfolioRepo.submit(id);
  return updated;
};

module.exports = { createPortfolio, getMyPortfolios, getPortfolioById, submitPortfolio };