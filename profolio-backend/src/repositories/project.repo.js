const supabase = require('../config/db');

const create = async ({ portfolio_id, title, description, tech_stack, github_url, live_url, thumbnail_url }) => {
  const { data, error } = await supabase
    .from('projects')
    .insert([{ portfolio_id, title, description, tech_stack, github_url, live_url, thumbnail_url }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

const findByPortfolioId = async (portfolio_id) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('portfolio_id', portfolio_id);
  if (error) throw error;
  return data;
};

const findById = async (id) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

const update = async (id, updates) => {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const remove = async (id) => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};

module.exports = { create, findByPortfolioId, findById, update, remove };