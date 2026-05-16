const projectService = require('../services/project.service');

const add = async (req, res, next) => {
  try {
    const project = await projectService.addProject(req.params.portfolio_id, req.body);
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const projects = await projectService.getProjects(req.params.portfolio_id);
    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body);
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { add, getAll, update, remove };