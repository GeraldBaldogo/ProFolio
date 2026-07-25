const express = require('express');
const router = express.Router();
const proctoringController = require('../controllers/proctoring.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// Student (or anyone taking a test) logs a proctoring event during an attempt
router.post('/events', authenticate, proctoringController.logEvent);

// Professor/admin reviews flags for a specific test session
router.get(
  '/sessions/:session_id',
  authenticate,
  requireRole('evaluator', 'admin'),
  proctoringController.getSessionReport
);

// Professor/admin reviews a student's overall flag history across attempts
router.get(
  '/students/:user_id/history',
  authenticate,
  requireRole('evaluator', 'admin'),
  proctoringController.getStudentFlagHistory
);

module.exports = router;