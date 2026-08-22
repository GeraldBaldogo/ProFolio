const adminRepo = require('../repositories/admin.repo');

const getAllUsers = async () => {
  return await adminRepo.getAllUsers();
};

const updateUserRole = async (id, role) => {
  const validRoles = ['student', 'evaluator', 'admin'];
  if (!validRoles.includes(role)) throw { status: 400, message: 'Invalid role.' };
  return await adminRepo.updateUserRole(id, role);
};

const toggleUserStatus = async (id, is_active) => {
  return await adminRepo.toggleUserStatus(id, is_active);
};

const approveUser = async  (id) => {
  return await adminRepo.approveUser(id);
}

const assignEvaluator = async (portfolio_id, evaluator_id, assigned_by) => {
  return await adminRepo.assignEvaluator(portfolio_id, evaluator_id, assigned_by);
};

const getPortfolios = async () => {
  return await adminRepo.getPortfolios();
};

const getAnalytics = async () => {
  return await adminRepo.getAnalytics();
};

module.exports = { getAllUsers, updateUserRole, toggleUserStatus, assignEvaluator, getPortfolios, getAnalytics, approveUser };