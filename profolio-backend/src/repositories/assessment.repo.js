const supabase = require('../config/db');

const saveResult = async ({ user_id, type, score, metadata, session_id = null, test_id = null }) => {
  const { data, error } = await supabase
    .from('assessment_results')
    .insert({ user_id, type, score, metadata, session_id, test_id })
    .select()
    .single();

  if (error) throw { status: 500, message: error.message };
  return data;
};

const getResultsByUser = async (user_id) => {
  const { data, error } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) throw { status: 500, message: error.message };
  return data;
};

const getLatestByType = async (user_id, type) => {
  const { data, error } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('user_id', user_id)
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw { status: 500, message: error.message };
  return data || null;
};

module.exports = { saveResult, getResultsByUser, getLatestByType };