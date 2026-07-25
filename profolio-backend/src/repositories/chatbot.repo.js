const supabase = require('../config/db');

const saveMessages = async (user_id, messages) => {
  // messages: [{ role: 'user'|'assistant', content: string }, ...]
  const rows = messages.map((m) => ({ user_id, role: m.role, content: m.content }));

  const { data, error } = await supabase
    .from('chatbot_messages')
    .insert(rows)
    .select();

  if (error) throw { status: 500, message: error.message };
  return data;
};

const getHistoryByUser = async (user_id, limit = 20) => {
  const { data, error } = await supabase
    .from('chatbot_messages')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw { status: 500, message: error.message };
  return (data || []).reverse(); // return oldest -> newest
};

const deleteByUser = async (user_id) => {
  const { error } = await supabase
    .from('chatbot_messages')
    .delete()
    .eq('user_id', user_id);

  if (error) throw { status: 500, message: error.message };
  return true;
};

module.exports = { saveMessages, getHistoryByUser, deleteByUser };