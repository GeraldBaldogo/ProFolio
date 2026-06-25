const express = require('express');
const router = express.Router();
const { checkOriginality, getHistory, getById } = require('../controllers/originality.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.post('/check', verifyToken, requireRole('student'), checkOriginality);
router.get('/history', verifyToken, requireRole('student'), getHistory);
router.get('/:id', verifyToken, requireRole('student'), getById);

module.exports = router;