const supabase = require('../config/db');

const create = async ({ portfolio_id, title, issuer, credential_url, issued_date, expiry_date }) => {
  const { data, error } = await supabase
    .from('certifications')
    .insert([{ portfolio_id, title, issuer, credential_url, issued_date, expiry_date }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

const findByPortfolioId = async (portfolio_id) => {
  const { data, error } = await supabase
    .from('certifications')
    .select('*')
    .eq('portfolio_id', portfolio_id);
  if (error) throw error;
  return data;
};

const update = async (id, updates) => {
  const { data, error } = await supabase
    .from('certifications')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const remove = async (id) => {
  const { error } = await supabase
    .from('certifications')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};

module.exports = { create, findByPortfolioId, update, remove };