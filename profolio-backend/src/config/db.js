const { createClient } = require('@supabase/supabase-js');

// The backend does its own auth (JWT + requireRole), so it needs the key that
// bypasses RLS. The anon key can read but silently updates nothing.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;