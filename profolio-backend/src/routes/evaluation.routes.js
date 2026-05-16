const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluation.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// AI Evaluation
router.post('/ai/:portfolio_id', authenticate, requireRole('student'), evaluationController.triggerAIEvaluation);
router.get('/ai/:portfolio_id', authenticate, evaluationController.getAIEvaluation);

// Human Evaluation
router.post('/human/:portfolio_id', authenticate, requireRole('evaluator'), evaluationController.submitHumanEvaluation);
router.get('/human/:portfolio_id', authenticate, evaluationController.getHumanEvaluation);
router.get('/assigned', authenticate, requireRole('evaluator'), evaluationController.getAssignedPortfolios);

module.exports = router;