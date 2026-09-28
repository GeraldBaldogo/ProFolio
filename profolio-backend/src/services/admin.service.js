const adminRepo = require('../repositories/admin.repo');
const analyticsService = require('./analytics.service');

const bad = (message) => ({ status: 400, message });

const getAllUsers = async () => {
  return await adminRepo.getAllUsers();
};

// Both guards below live here, not only in the page: the Users page had none,
// so one wrong pick in a dropdown could leave the system with no admin at all.
const updateUserRole = async (id, role, actor) => {
  const validRoles = ['student', 'evaluator', 'admin'];
  if (!validRoles.includes(role)) throw bad('Invalid role.');

  const target = await adminRepo.findUser(id);
  if (!target) throw { status: 404, message: 'User not found.' };
  if (target.role === role) return target;

  if (target.role === 'admin') {
    if (target.id === actor?.id) throw bad('You can\u2019t remove your own admin access.');
    if (target.is_active && (await adminRepo.countActiveAdmins()) <= 1) {
      throw bad('This is the only active admin. Make someone else an admin first.');
    }
  }

  await adminRepo.ensureRoleProfile(id, role);
  return await adminRepo.updateUserRole(id, role);
};

const toggleUserStatus = async (id, is_active, actor) => {
  if (typeof is_active !== 'boolean') throw bad('is_active must be true or false.');

  const target = await adminRepo.findUser(id);
  if (!target) throw { status: 404, message: 'User not found.' };

  if (!is_active && target.role === 'admin') {
    if (target.id === actor?.id) throw bad('You can\u2019t deactivate your own account.');
    if (target.is_active && (await adminRepo.countActiveAdmins()) <= 1) {
      throw bad('This is the only active admin and can\u2019t be deactivated.');
    }
  }
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

const getAnalytics = async (weeks) => {
  return await analyticsService.getAnalytics({ weeks });
};

module.exports = { getAllUsers, updateUserRole, toggleUserStatus, assignEvaluator, getPortfolios, getAnalytics, approveUser };