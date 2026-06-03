const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.get('/users', authenticate, requireRole('admin'), adminController.getAllUsers);
router.patch('/users/:id/role', authenticate, requireRole('admin'), adminController.updateUserRole);
router.patch('/users/:id/status', authenticate, requireRole('admin'), adminController.toggleUserStatus);
router.post('/assign-evaluator', authenticate, requireRole('admin'), adminController.assignEvaluator);
router.get('/portfolios', authenticate, requireRole('admin'), adminController.getPortfolios);
router.get('/analytics', authenticate, requireRole('admin'), adminController.getAnalytics);

module.exports = router;