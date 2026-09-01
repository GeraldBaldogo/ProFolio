const express = require('express');
const router = express.Router();
const c = require('../controllers/messaging.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Everything below needs a signed-in user — the service works out which side
// of a conversation you are from your own role, so req.user has to exist.
router.use(authenticate);

router.post('/conversations', c.startConversation);
router.get('/conversations', c.listConversations);
router.get('/conversations/:id/messages', c.getMessages);
router.post('/conversations/:id/messages', c.sendMessage);

module.exports = router;