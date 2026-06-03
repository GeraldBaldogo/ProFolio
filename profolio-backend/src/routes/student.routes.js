const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const supabase = require('../config/db');

// Get student profile
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Update student profile
router.patch('/profile', authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('student_profiles')
      .update(req.body)
      .eq('user_id', req.user.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;