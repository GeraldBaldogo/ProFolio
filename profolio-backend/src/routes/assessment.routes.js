const express = require('express');
const router = express.Router();
const c = require('../controllers/assessment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { publicRubric } = require('../utils/rubrics');

// How every assessment is scored — public, so it can be read before signing
// up (and shown to a panel). Served from utils/rubrics.js, the same file the
// graders use, so the page can't drift from what's actually applied.
router.get('/rubric', (req, res) => res.json({ success: true, data: publicRubric() }));

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

router.post('/communication/submit', c.submitCommunication);

// Practice progress — which levels are unlocked, which topics are passed
router.get('/progress', c.getProgress);
router.get('/progress/:type', c.getProgress);

// Practice ranks and verified titles
router.get('/titles', c.getTitles);

// Summary & Reset
router.get('/summary', c.getSummary);
router.delete('/reset', c.resetScores);

router.get('/history', c.getMyResults);

module.exports = router;