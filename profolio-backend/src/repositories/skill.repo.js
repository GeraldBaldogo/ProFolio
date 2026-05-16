const supabase = require('../config/db');

const create = async ({ portfolio_id, skill_name, category, self_rating }) => {
  const { data, error } = await supabase
    .from('skills')
    .insert([{ portfolio_id, skill_name, category, self_rating }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

const findByPortfolioId = async (portfolio_id) => {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('portfolio_id', portfolio_id);
  if (error) throw error;
  return data;
};

const update = async (id, updates) => {
  const { data, error } = await supabase
    .from('skills')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const remove = async (id) => {
  const { error } = await supabase
    .from('skills')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};

module.exports = { create, findByPortfolioId, update, remove };