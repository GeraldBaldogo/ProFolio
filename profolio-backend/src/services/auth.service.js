const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/user.repo');
const supabase = require('../config/db');

// Only these two can be self-selected at sign-up. Admin accounts are made by
// hand in the database — never through a public endpoint.
const SELF_SIGNUP_ROLES = ['student', 'evaluator'];

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const publicUser = (user) => ({
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  role: user.role,
});

const register = async ({ full_name, email, password, role = 'student' }) => {
  if (!SELF_SIGNUP_ROLES.includes(role)) {
    throw { status: 400, message: 'Invalid account type' };
  }

  const existing = await userRepo.findByEmail(email);
  if (existing) throw { status: 400, message: 'Email already in use' };

  // Professors wait for an admin to let them in; students are live immediately.
  const isProfessor = role === 'evaluator';

  const password_hash = await bcrypt.hash(password.toString(), 10);
  const user = await userRepo.create({
    full_name,
    email,
    password_hash,
    role,
    is_approved: !isProfessor,
  });

  if (role === 'student') {
    await supabase.from('student_profiles').insert({ user_id: user.id });
  } else {
    await supabase.from('professor_profiles').insert({ user_id: user.id });
  }

  // No token for an unapproved professor — the account exists but can't be used.
  if (isProfessor) {
    return {
      pending: true,
      user: publicUser(user),
      message: 'Your professor account is waiting for admin approval.',
    };
  }

  return { user: publicUser(user), token: signToken(user) };
};

const login = async ({ email, password }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) throw { status: 401, message: 'Invalid email or password' };

  const valid = await bcrypt.compare(password.toString(), user.password_hash);
  if (!valid) throw { status: 401, message: 'Invalid email or password' };

  // Checked after the password, so this can't be used to guess which emails exist.
  if (user.role === 'evaluator' && user.is_approved === false) {
    throw { status: 403, message: 'Your professor account is still waiting for approval.' };
  }

  return { user: publicUser(user), token: signToken(user) };
};

module.exports = { register, login };