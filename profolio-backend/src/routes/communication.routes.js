const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getPrompt, submitResult } = require('../controllers/communication.controller');

// GET /api/communication/prompt?difficulty=easy|medium|hard
router.get('/prompt', authenticate, getPrompt);

// POST /api/communication/submit
router.post('/submit', authenticate, submitResult);

module.exports = router;