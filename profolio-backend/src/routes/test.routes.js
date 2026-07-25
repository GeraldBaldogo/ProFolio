const express = require('express');
const router = express.Router();
const testController = require('../controllers/test.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// Professor: create/manage tests
router.post('/', authenticate, requireRole('evaluator'), testController.createTest);
router.get('/mine', authenticate, requireRole('evaluator'), testController.listMyTests);
router.patch('/:id', authenticate, requireRole('evaluator'), testController.updateTest);
router.delete('/:id', authenticate, requireRole('evaluator'), testController.deleteTest);

// Professor: assign a test to students, view who's been assigned
router.post('/:id/assign', authenticate, requireRole('evaluator'), testController.assignTest);
router.get('/:id/assignments', authenticate, requireRole('evaluator'), testController.getAssignmentsForTest);

// Student: view assigned tests, start an attempt
router.get('/assigned/mine', authenticate, requireRole('student'), testController.getMyAssignedTests);
router.post('/:id/start', authenticate, requireRole('student'), testController.startAssignment);

// Shared: view a single test (ownership/assignment checked in service layer)
router.get('/:id', authenticate, testController.getById);

module.exports = router;