const projectRepo = require('../repositories/project.repo');
const portfolioRepo = require('../repositories/portfolio.repo');
const supabase = require('../config/db');

// Only the student who owns the portfolio can add/edit/delete its projects.
// (Evaluators/admins can view via getProjects, but shouldn't modify someone
// else's submitted work.)
const assertOwnsPortfolioAsStudent = async (portfolio, requestingUser) => {
  if (requestingUser.role !== 'student') {
    throw { status: 403, message: 'Only the owning student can modify projects.' };
  }

  const { data: profile } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', requestingUser.id)
    .single();

  if (!profile || profile.id !== portfolio.student_id) {
    throw { status: 403, message: 'You do not have permission to modify this portfolio.' };
  }
};

const addProject = async (portfolio_id, projectData, requestingUser) => {
  const portfolio = await portfolioRepo.findById(portfolio_id);
  if (!portfolio) throw { status: 404, message: 'Portfolio not found.' };

  await assertOwnsPortfolioAsStudent(portfolio, requestingUser);

  const project = await projectRepo.create({ portfolio_id, ...projectData });
  return project;
};

const getProjects = async (portfolio_id) => {
  const projects = await projectRepo.findByPortfolioId(portfolio_id);
  return projects;
};

const updateProject = async (id, updates, requestingUser) => {
  const project = await projectRepo.findById(id);
  if (!project) throw { status: 404, message: 'Project not found.' };

  const portfolio = await portfolioRepo.findById(project.portfolio_id);
  if (!portfolio) throw { status: 404, message: 'Portfolio not found.' };

  await assertOwnsPortfolioAsStudent(portfolio, requestingUser);

  const updated = await projectRepo.update(id, updates);
  return updated;
};

const deleteProject = async (id, requestingUser) => {
  const project = await projectRepo.findById(id);
  if (!project) throw { status: 404, message: 'Project not found.' };

  const portfolio = await portfolioRepo.findById(project.portfolio_id);
  if (!portfolio) throw { status: 404, message: 'Portfolio not found.' };

  await assertOwnsPortfolioAsStudent(portfolio, requestingUser);

  await projectRepo.remove(id);
  return { message: 'Project deleted successfully.' };
};

module.exports = { addProject, getProjects, updateProject, deleteProject };