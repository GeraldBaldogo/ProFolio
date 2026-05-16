const supabase = require('../config/db');

const create = async ({ portfolio_id, company, role, description, start_date, end_date, is_current }) => {
  const { data, error } = await supabase
    .from('experiences')
    .insert([{ portfolio_id, company, role, description, start_date, end_date, is_current }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

const findByPortfolioId = async (portfolio_id) => {
  const { data, error } = await supabase
    .from('experiences')
    .select('*')
    .eq('portfolio_id', portfolio_id);
  if (error) throw error;
  return data;
};

const update = async (id, updates) => {
  const { data, error } = await supabase
    .from('experiences')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const remove = async (id) => {
  const { error } = await supabase
    .from('experiences')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};

module.exports = { create, findByPortfolioId, update, remove };