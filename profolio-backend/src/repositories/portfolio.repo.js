const supabase = require('../config/db');

const create = async (student_id) => {
  const { data, error } = await supabase
    .from('portfolios')
    .insert([{ student_id, status: 'draft' }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

const findByStudentId = async (student_id) => {
  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('student_id', student_id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

const findById = async (id) => {
  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

const submit = async (id) => {
  const { data, error } = await supabase
    .from('portfolios')
    .update({ status: 'submitted' })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

module.exports = { create, findByStudentId, findById, submit };