const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolio.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.post('/', authenticate, requireRole('student'), portfolioController.create);
router.get('/my', authenticate, requireRole('student'), portfolioController.getMyPortfolios);
router.get('/:id', authenticate, portfolioController.getById);
router.patch('/:id/submit', authenticate, requireRole('student'), portfolioController.submit);

module.exports = router;