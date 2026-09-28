const projectRepo = require('../repositories/project.repo');
const { assertOwnsPortfolio, assertCanReadPortfolio, assertOwnsRow, pickFields } = require('../utils/ownership');

// Only the student who owns the portfolio can add/edit/delete its projects.
// (Evaluators/admins can view via getProjects, but shouldn't modify someone
// else's submitted work.) The check itself lives in utils/ownership.js so the
// skills/certifications/experiences/achievements routes use the same one.

const PROJECT_FIELDS = ['title', 'description', 'tech_stack', 'github_url', 'live_url', 'thumbnail_url'];

const addProject = async (portfolio_id, projectData, requestingUser) => {
  await assertOwnsPortfolio(portfolio_id, requestingUser);
  return projectRepo.create({ ...pickFields(projectData, PROJECT_FIELDS), portfolio_id });
};

const getProjects = async (portfolio_id, requestingUser) => {
  await assertCanReadPortfolio(portfolio_id, requestingUser);
  return projectRepo.findByPortfolioId(portfolio_id);
};

const updateProject = async (id, updates, requestingUser) => {
  await assertOwnsRow('projects', id, requestingUser);
  return projectRepo.update(id, pickFields(updates, PROJECT_FIELDS));
};

const deleteProject = async (id, requestingUser) => {
  await assertOwnsRow('projects', id, requestingUser);
  await projectRepo.remove(id);
  return { message: 'Project deleted successfully.' };
};

module.exports = { addProject, getProjects, updateProject, deleteProject };