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
    .eq('student_id', student_id);
  if (error) throw error;
  return data;
};

const findById = async (id) => {
  const { data, error } = await supabase
    .from('portfolios')
    .select(`
      *,
      projects (*),
      skills (*),
      certifications (*),
      experiences (*),
      achievements (*)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

const updateStatus = async (id, status) => {
  const { data, error } = await supabase
    .from('portfolios')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const submit = async (id) => {
  const { data, error } = await supabase
    .from('portfolios')
    .update({ status: 'submitted', submitted_at: new Date() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

module.exports = { create, findByStudentId, findById, updateStatus, submit };