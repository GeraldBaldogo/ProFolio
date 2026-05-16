const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected route — test ng middleware
router.get('/me', authenticate, (req, res) => {
  res.json({ 
    success: true, 
    data: {
      id: req.user.id,
      full_name: req.user.full_name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;