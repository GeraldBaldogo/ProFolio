const express = require('express');
const router = express.Router();
const { generate, getSources, getLatest, getHistory } = require('../controllers/cv.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.get('/sources', verifyToken, requireRole('student'), getSources);
router.post('/generate', verifyToken, requireRole('student'), generate);
router.get('/latest', verifyToken, requireRole('student'), getLatest);
router.get('/history', verifyToken, requireRole('student'), getHistory);

module.exports = router;