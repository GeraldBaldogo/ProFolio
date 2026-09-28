// ─────────────────────────────────────────────────────────────────────────────
// src/utils/sqlDialect.js
//
// The sandbox runs SQLite. Professors tend to write MySQL-flavoured DDL, and a
// handful of MySQL-only keywords would make perfectly good schemas fail to
// load. These are stripped or translated before anything runs. Queries —
// SELECT, WHERE, JOIN, GROUP BY, INSERT, UPDATE, DELETE — are standard SQL and
// pass through untouched.
// ─────────────────────────────────────────────────────────────────────────────

const normaliseDialect = (sql) => String(sql || '')
  .replace(/\bAUTO_INCREMENT\b(\s*=\s*\d+)?/gi, '')
  .replace(/\bUNSIGNED\b/gi, '')
  .replace(/\bENUM\s*\([^)]*\)/gi, 'TEXT')
  .replace(/\)\s*ENGINE\s*=\s*\w+/gi, ')')
  .replace(/\bDEFAULT\s+CHARSET\s*=\s*\w+/gi, '')
  .replace(/\bCHARACTER\s+SET\s+\w+/gi, '')
  .replace(/\bCOLLATE\s*=?\s*\w+/gi, '')
  .replace(/\bON\s+UPDATE\s+CURRENT_TIMESTAMP\b/gi, '');

module.exports = { normaliseDialect };