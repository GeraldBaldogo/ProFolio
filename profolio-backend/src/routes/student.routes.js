const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const supabase = require('../config/db');

// The only columns a student may write through PATCH /profile. Before this
// list existed the body was spread straight into the upsert, so a request
// carrying { user_id: <someone else's id> } overwrote that other student's
// profile. user_id now always comes from the token, never from the body.
const EDITABLE_FIELDS = [
  'professional_title', 'phone', 'location',
  'course', 'school', 'year_level', 'specialization',
  'expected_graduation', 'academic_honors',
  'bio', 'career_goal',
  'linkedin_url', 'github_url', 'portfolio_url',
  'work_experience',
];

const pick = (body) => Object.fromEntries(
  EDITABLE_FIELDS.filter((k) => body[k] !== undefined).map((k) => [k, body[k]])
);

// The name lives on the users table, not student_profiles — it's the one
// typed at registration, and it's what the CV prints at the top. Students can
// correct it here (a surname-only "BALDOGO" or a typo would otherwise be on
// every CV forever). Letters from any language, spaces, and . , ' - only.
const NAME_PATTERN = /^\p{L}[\p{L}\p{M} .,'\u2019-]*$/u;
const cleanName = (value) => {
  if (typeof value !== 'string') return { error: 'Please enter your full name.' };
  const name = value.replace(/\s+/g, ' ').trim();
  if (name.length < 2 || name.length > 80) return { error: 'Your name should be between 2 and 80 characters.' };
  if (!NAME_PATTERN.test(name)) return { error: 'Your name can only contain letters, spaces, and . , \' -' };
  return { name };
};

// The photo is stored as a small JPEG data URL in student_profiles.profile_photo.
// The browser resizes it to about 400px before sending, which lands well under
// express.json()'s default 100kb body limit — so server.js doesn't change.
const PHOTO_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const PHOTO_MAX_CHARS = 95 * 1024;

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
    // Checked before anything is written, so a bad name doesn't leave the
    // rest of the profile half-saved.
    let fullName;
    if (req.body?.full_name !== undefined) {
      const checked = cleanName(req.body.full_name);
      if (checked.error) return res.status(400).json({ success: false, message: checked.error });
      fullName = checked.name;
    }

    const { data, error } = await supabase
      .from('student_profiles')
      .upsert(
        { ...pick(req.body || {}), user_id: req.user.id },
        { onConflict: 'user_id' }
      )
      .select()
      .single();
    if (error) throw error;

    if (fullName !== undefined) {
      const { error: nameError } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', req.user.id);
      if (nameError) throw nameError;
    }

    res.json({ success: true, data: { ...data, full_name: fullName ?? req.user.full_name } });
  } catch (err) {
    next(err);
  }
});

// Set or replace the profile photo. Kept apart from PATCH /profile so saving
// the rest of the profile doesn't resend the image every time.
router.put('/profile/photo', authenticate, async (req, res, next) => {
  try {
    const photo = req.body?.photo;
    if (typeof photo !== 'string' || !PHOTO_PATTERN.test(photo)) {
      return res.status(400).json({ success: false, message: 'Photo must be a JPG, PNG or WebP image.' });
    }
    if (photo.length > PHOTO_MAX_CHARS) {
      return res.status(413).json({ success: false, message: 'Photo is too large. Please choose a smaller image.' });
    }

    const { data, error } = await supabase
      .from('student_profiles')
      .upsert({ user_id: req.user.id, profile_photo: photo }, { onConflict: 'user_id' })
      .select('profile_photo')
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Remove the profile photo.
router.delete('/profile/photo', authenticate, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('student_profiles')
      .update({ profile_photo: null })
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ success: true, data: { profile_photo: null } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;