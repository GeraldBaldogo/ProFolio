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

const create = async ({ full_name, email, password_hash, role }) => {
  const { data, error } = await supabase
    .from('users')
    .insert([{ full_name, email, password_hash, role }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

module.exports = { findByEmail, findById, create };