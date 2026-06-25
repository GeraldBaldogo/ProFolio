const express = require('express');
const router = express.Router();
const c = require('../controllers/assessment.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// Typing
router.get('/typing/text', c.getTypingText);
router.post('/typing/submit', c.submitTyping);

// Programming
router.post('/coding/generate', c.generateChallenge);
router.post('/coding/submit', c.submitCoding);

// Flowchart
router.get('/flowchart/generate', c.generateFlowchartProblem);
router.post('/flowchart/submit', c.submitFlowchart);

// SQL
router.post('/sql/generate', c.generateSQLChallenge);
router.post('/sql/submit', c.submitSQL);

// Bug Fixing
router.post('/bugfix/generate', c.generateBugFixChallenge);
router.post('/bugfix/submit', c.submitBugFix);

// Summary & Reset
router.get('/summary', c.getSummary);
router.delete('/reset', c.resetScores);

module.exports = router;