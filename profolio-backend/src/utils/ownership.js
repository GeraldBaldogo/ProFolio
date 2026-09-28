const supabase = require('../config/db');

// Only the student who owns a portfolio may add to, edit or delete anything in
// it. Evaluators and admins can still read portfolios through the GET routes;
// they just can't change a student's submitted work.

const forbidden = (message) => ({ status: 403, message });
const notFound = (message) => ({ status: 404, message });

// Throws unless `user` is the student who owns portfolio `portfolioId`.
const assertOwnsPortfolio = async (portfolioId, user) => {
  if (!user || user.role !== 'student') {
    throw forbidden('Only the owning student can modify this portfolio.');
  }

  const [{ data: portfolio }, { data: profile }] = await Promise.all([
    supabase.from('portfolios').select('id, student_id').eq('id', portfolioId).maybeSingle(),
    supabase.from('student_profiles').select('id').eq('user_id', user.id).maybeSingle(),
  ]);

  if (!portfolio) throw notFound('Portfolio not found.');
  if (!profile || profile.id !== portfolio.student_id) {
    throw forbidden('You do not have permission to modify this portfolio.');
  }
  return portfolio;
};

// Reading is a little wider than writing: an admin may look at any portfolio,
// but students only ever see their own. Before this, any logged-in account
// could list another student's projects, skills and certifications by id.
const assertCanReadPortfolio = async (portfolioId, user) => {
  if (user?.role === 'admin') return;
  if (!user || user.role !== 'student') {
    throw forbidden('You do not have permission to view this portfolio.');
  }

  const [{ data: portfolio }, { data: profile }] = await Promise.all([
    supabase.from('portfolios').select('id, student_id').eq('id', portfolioId).maybeSingle(),
    supabase.from('student_profiles').select('id').eq('user_id', user.id).maybeSingle(),
  ]);

  if (!portfolio) throw notFound('Portfolio not found.');
  if (!profile || profile.id !== portfolio.student_id) {
    throw forbidden('You do not have permission to view this portfolio.');
  }
};

// Looks up which portfolio a row belongs to, then checks ownership of that.
// Used for edits and deletes, where the request only carries the row's id.
const assertOwnsRow = async (table, rowId, user) => {
  const { data: row } = await supabase
    .from(table)
    .select('id, portfolio_id')
    .eq('id', rowId)
    .maybeSingle();

  if (!row) throw notFound('Item not found.');
  await assertOwnsPortfolio(row.portfolio_id, user);
  return row;
};

// Keeps only the listed fields from a request body. Anything else — id,
// portfolio_id, created_at, or a column the form never shows — is dropped, so
// an edit can't move a row into someone else's portfolio.
//
// Blank strings become null: an empty date input sends '', which Postgres
// rejects for a date column, so an optional date left blank used to fail the
// whole save.
const pickFields = (body, fields) => Object.fromEntries(
  fields
    .filter((k) => body && body[k] !== undefined)
    .map((k) => [k, body[k] === '' ? null : body[k]])
);

module.exports = { assertOwnsPortfolio, assertCanReadPortfolio, assertOwnsRow, pickFields };