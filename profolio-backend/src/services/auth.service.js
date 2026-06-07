const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/user.repo');
const supabase = require('../config/db'); // idagdag ito

const register = async ({ full_name, email, password, role = 'student' }) => {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw { status: 400, message: 'Email already in use' };

  const password_hash = await bcrypt.hash(password.toString(), 10);
  const user = await userRepo.create({ full_name, email, password_hash, role });

  // Idagdag ito — auto-create student profile
  if (role === 'student') {
    await supabase
      .from('student_profiles')
      .insert({ user_id: user.id });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role }, token };
};

const login = async ({ email, password }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) throw { status: 401, message: 'Invalid email or password' };

  const valid = await bcrypt.compare(password.toString(), user.password_hash);
  if (!valid) throw { status: 401, message: 'Invalid email or password' };

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role }, token };
};

module.exports = { register, login };