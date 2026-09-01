const express = require('express');
const router = express.Router();
const testController = require('../controllers/test.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// Express checks these top to bottom, and '/:id' matches ANY single segment —
// so every fixed path has to sit above it or it gets swallowed as an id.
// That's what turned /tests/students into "Test not found".

// ── Fixed paths first ──
router.get('/mine', authenticate, requireRole('evaluator'), testController.listMyTests);
router.get('/students', authenticate, requireRole('evaluator'), testController.listStudents);
router.get('/my-students', authenticate, requireRole('evaluator'), testController.getMyStudents);
router.get('/assigned/mine', authenticate, requireRole('student'), testController.getMyAssignedTests);

// ── Professor: create and manage tests ──
router.post('/', authenticate, requireRole('evaluator'), testController.createTest);
router.patch('/:id', authenticate, requireRole('evaluator'), testController.updateTest);
router.delete('/:id', authenticate, requireRole('evaluator'), testController.deleteTest);

// ── Professor: assign, and see who was assigned ──
router.post('/:id/assign', authenticate, requireRole('evaluator'), testController.assignTest);
router.get('/:id/assignments', authenticate, requireRole('evaluator'), testController.getAssignmentsForTest);

// ── Student: start an attempt ──
router.post('/:id/start', authenticate, requireRole('student'), testController.startAssignment);

// ── Must stay last: '/:id' matches anything, so nothing can go below it ──
router.get('/:id', authenticate, testController.getById);

module.exports = router;