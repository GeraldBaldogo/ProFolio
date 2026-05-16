const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.post('/:portfolio_id', authenticate, requireRole('student'), projectController.add);
router.get('/:portfolio_id', authenticate, projectController.getAll);
router.patch('/:id', authenticate, requireRole('student'), projectController.update);
router.delete('/:id', authenticate, requireRole('student'), projectController.remove);

module.exports = router;