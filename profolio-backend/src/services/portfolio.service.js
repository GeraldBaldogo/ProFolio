const portfolioRepo = require('../repositories/portfolio.repo');
const projectRepo = require('../repositories/project.repo');
const skillRepo = require('../repositories/skill.repo');
const certificationRepo = require('../repositories/certification.repo');
const experienceRepo = require('../repositories/experience.repo');
const achievementRepo = require('../repositories/achievement.repo');
const supabase = require('../config/db');

const SUBMITTABLE = ['draft', 'revision_requested', 'completed'];
const WITHDRAWABLE = ['submitted', 'ai_reviewed'];

const createPortfolio = async (user_id) => {
  const { data: profile, error } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user_id)
    .single();
  if (error || !profile) throw { status: 404, message: 'Student profile not found. Please complete your profile first.' };

  // One portfolio per student. The Portfolio Builder and the CV both read the
  // newest one, so a second, empty portfolio would make everything the
  // student had saved look deleted. Hand back the existing one instead.
  const existing = await portfolioRepo.findByStudentId(profile.id);
  if (existing?.length) return existing[0];

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

// Checks whether requestingUser is allowed to view/modify this portfolio:
// - admin: always allowed
// - student: only their own portfolio
// - evaluator: only portfolios they're assigned to review
const assertCanAccessPortfolio = async (portfolio, requestingUser) => {
  if (requestingUser.role === 'admin') return;

  if (requestingUser.role === 'student') {
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', requestingUser.id)
      .single();
    if (!profile || profile.id !== portfolio.student_id) {
      throw { status: 403, message: 'You do not have permission to access this portfolio.' };
    }
    return;
  }

  if (requestingUser.role === 'evaluator') {
    const { data: assignment } = await supabase
      .from('evaluator_assignments')
      .select('id')
      .eq('portfolio_id', portfolio.id)
      .eq('evaluator_id', requestingUser.id)
      .single();
    if (!assignment) {
      throw { status: 403, message: 'You are not assigned to review this portfolio.' };
    }
    return;
  }

  throw { status: 403, message: 'Forbidden.' };
};

// Fetches the student_profiles row for a portfolio, joined with the user's
// name/email. Falls back to a plain (unjoined) query if the FK-based
// embedded select isn't supported by the current schema setup.
const getStudentProfileWithUser = async (student_profile_id) => {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('*, users (full_name, email)')
    .eq('id', student_profile_id)
    .single();

  if (!error) return data;

  const { data: fallback } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('id', student_profile_id)
    .single();
  return fallback || null;
};

const getPortfolioById = async (id, requestingUser) => {
  const portfolio = await portfolioRepo.findById(id);
  if (!portfolio) throw { status: 404, message: 'Portfolio not found.' };

  await assertCanAccessPortfolio(portfolio, requestingUser);

  // Bug fix: this previously returned only the bare portfolios row.
  // Evaluator/student pages expect student_profiles.users, projects,
  // skills, certifications, achievements, experiences nested in - none of
  // which were ever included, so the whole review UI showed blank sections.
  const [studentProfile, projects, skills, certifications, achievements, experiences] = await Promise.all([
    getStudentProfileWithUser(portfolio.student_id),
    projectRepo.findByPortfolioId(id),
    skillRepo.findByPortfolioId(id),
    certificationRepo.findByPortfolioId(id),
    achievementRepo.findByPortfolioId(id),
    experienceRepo.findByPortfolioId(id),
  ]);

  return {
    ...portfolio,
    student_profiles: studentProfile,
    projects,
    skills,
    certifications,
    achievements,
    experiences,
  };
};

const submitPortfolio = async (id, requestingUser) => {
  const portfolio = await portfolioRepo.findById(id);
  if (!portfolio) throw { status: 404, message: 'Portfolio not found.' };

  await assertCanAccessPortfolio(portfolio, requestingUser);

  // A draft goes in for the first time; a revision_requested one goes back
  // after the student made the changes asked for; a completed one can go in
  // again for a fresh review.
  if (!SUBMITTABLE.includes(portfolio.status)) {
    throw { status: 400, message: 'This portfolio is already waiting for review.' };
  }
  const updated = await portfolioRepo.submit(id);
  return updated;
};

// Takes a submission back before any professor has picked it up, so the
// student can keep editing. Once it's under_review it stays put — changing
// work while someone is marking it isn't fair to either of them.
const withdrawPortfolio = async (id, requestingUser) => {
  const portfolio = await portfolioRepo.findById(id);
  if (!portfolio) throw { status: 404, message: 'Portfolio not found.' };

  await assertCanAccessPortfolio(portfolio, requestingUser);

  if (requestingUser.role !== 'student') {
    throw { status: 403, message: 'Only the owning student can withdraw a portfolio.' };
  }
  if (!WITHDRAWABLE.includes(portfolio.status)) {
    throw {
      status: 400,
      message: portfolio.status === 'under_review'
        ? 'A professor is already reviewing this portfolio. You can edit it again once they finish.'
        : 'Only a submitted portfolio can be withdrawn.',
    };
  }
  return portfolioRepo.setStatus(id, 'draft');
};

module.exports = { createPortfolio, getMyPortfolios, getPortfolioById, submitPortfolio, withdrawPortfolio, assertCanAccessPortfolio };