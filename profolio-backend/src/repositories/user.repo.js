const supabase = require('../config/db');

const findByEmail = async (email) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  if (error) return null;
  return data;
};

const findById = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
};

// is_approved has to be listed explicitly — anything not named here is
// silently dropped, and the column's own default takes over instead.
const create = async ({ full_name, email, password_hash, role, is_approved = true }) => {
  const { data, error } = await supabase
    .from('users')
    .insert([{ full_name, email, password_hash, role, is_approved }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

const updateStudentProfile = async (user_id, updates) => {
  const { data, error } = await supabase
    .from('student_profiles')
    .update(updates)
    .eq('user_id', user_id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

module.exports = { findByEmail, findById, create, updateStudentProfile };