const express = require('express');
const router = express.Router();
const { generate, getLatest, getAll } = require('../controllers/recommendation.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.post('/generate', verifyToken, requireRole('student'), generate);
router.get('/latest', verifyToken, requireRole('student'), getLatest);
router.get('/', verifyToken, requireRole('student'), getAll);

module.exports = router;