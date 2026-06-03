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

    // If no profile yet, return empty object instead of throwing
    if (error && error.code === 'PGRST116') {
      return res.json({ success: true, data: null });
    }
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Upsert student profile (create if not exists, update if exists)
router.patch('/profile', authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('student_profiles')
      .upsert(
        { user_id: req.user.id, ...req.body },
        { onConflict: 'user_id' }
      )
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;