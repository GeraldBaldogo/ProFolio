const projectService = require('../services/project.service');

// Every write passes req.user through: the service checks that the logged-in
// student owns the portfolio. Before, the user wasn't passed, the ownership
// check read .role off undefined, and every add, edit and delete of a project
// failed with a 500.

const add = async (req, res, next) => {
  try {
    const project = await projectService.addProject(req.params.portfolio_id, req.body, req.user);
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const projects = await projectService.getProjects(req.params.portfolio_id, req.user);
    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body, req.user);
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.params.id, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { add, getAll, update, remove };