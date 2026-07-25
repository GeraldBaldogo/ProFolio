const supabase = require('../config/db');

const findOrCreateConversation = async (student_id, professor_id) => {
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('student_id', student_id)
    .eq('professor_id', professor_id)
    .single();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('conversations')
    .insert([{ student_id, professor_id }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

const getConversationById = async (id) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
};

const getConversationsForUser = async (user_id, role) => {
  const column = role === 'student' ? 'student_id' : 'professor_id';

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      student:users!conversations_student_id_fkey (id, full_name, email),
      professor:users!conversations_professor_id_fkey (id, full_name, email)
    `)
    .eq(column, user_id)
    .order('created_at', { ascending: false });

  if (error) {
    // Fallback if the FK relationship names differ from what Supabase expects
    const { data: data2, error: error2 } = await supabase
      .from('conversations')
      .select('*')
      .eq(column, user_id)
      .order('created_at', { ascending: false });
    if (error2) throw error2;
    return data2;
  }
  return data;
};

const getMessages = async (conversation_id, limit = 100) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversation_id)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data;
};

const createMessage = async (conversation_id, sender_id, content) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ conversation_id, sender_id, content }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

const markMessagesRead = async (conversation_id, reader_id) => {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversation_id)
    .neq('sender_id', reader_id)
    .is('read_at', null);
  if (error) throw error;
  return true;
};

module.exports = {
  findOrCreateConversation,
  getConversationById,
  getConversationsForUser,
  getMessages,
  createMessage,
  markMessagesRead,
};