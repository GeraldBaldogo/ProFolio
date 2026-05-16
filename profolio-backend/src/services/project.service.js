const projectRepo = require('../repositories/project.repo');
const portfolioRepo = require('../repositories/portfolio.repo');

const addProject = async (portfolio_id, projectData) => {
  const portfolio = await portfolioRepo.findById(portfolio_id);
  if (!portfolio) throw { status: 404, message: 'Portfolio not found.' };

  const project = await projectRepo.create({ portfolio_id, ...projectData });
  return project;
};

const getProjects = async (portfolio_id) => {
  const projects = await projectRepo.findByPortfolioId(portfolio_id);
  return projects;
};

const updateProject = async (id, updates) => {
  const project = await projectRepo.findById(id);
  if (!project) throw { status: 404, message: 'Project not found.' };

  const updated = await projectRepo.update(id, updates);
  return updated;
};

const deleteProject = async (id) => {
  const project = await projectRepo.findById(id);
  if (!project) throw { status: 404, message: 'Project not found.' };

  await projectRepo.remove(id);
  return { message: 'Project deleted successfully.' };
};

module.exports = { addProject, getProjects, updateProject, deleteProject };