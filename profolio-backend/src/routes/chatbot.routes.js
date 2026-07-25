const express = require('express');
const router = express.Router();
const c = require('../controllers/chatbot.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/message', c.sendMessage);
router.get('/history', c.getHistory);
router.delete('/history', c.clearHistory);

module.exports = router;