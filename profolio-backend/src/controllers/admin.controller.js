const adminService = require('../services/admin.service');

const getAllUsers = async (req, res, next) => {
  try {
    const users = await adminService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

const approveUser = async (req, res, next) => {
  try {
    const user = await adminService.approveUser(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const user = await adminService.updateUserRole(req.params.id, req.body.role);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await adminService.toggleUserStatus(req.params.id, req.body.is_active);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const assignEvaluator = async (req, res, next) => {
  try {
    const result = await adminService.assignEvaluator(
      req.body.portfolio_id,
      req.body.evaluator_id,
      req.user.id
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getPortfolios = async (req, res, next) => {
  try {
    const portfolios = await adminService.getPortfolios();
    res.json({ success: true, data: portfolios });
  } catch (err) {
    next(err);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await adminService.getAnalytics();
    res.json({ success: true, data: analytics });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, updateUserRole, toggleUserStatus, assignEvaluator, getPortfolios, getAnalytics, approveUser };