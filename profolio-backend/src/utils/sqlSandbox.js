// ─────────────────────────────────────────────────────────────────────────────
// src/utils/sqlSandbox.js
//
// Runs SQL for the SQL assessment and decides whether two runs produced the
// same answer.
//
// Marking used to mean sending the student's query text to the AI and asking
// whether it looked right. Nothing was ever executed. Now the student's query
// and the reference answer both run against the same data, and the results are
// compared. The AI still writes the feedback, but it no longer decides whether
// the answer is correct — the data does.
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
const crypto = require('crypto');
const { Worker } = require('worker_threads');

const TIMEOUT_MS = 3000;

const runSql = (schemaSql, querySql) => new Promise((resolve) => {
  let settled = false;
  const done = (msg) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    worker.terminate().catch(() => {});
    resolve(msg);
  };

  const worker = new Worker(path.join(__dirname, 'sqlSandbox.worker.js'), {
    workerData: { schemaSql, querySql },
    // Bounds the JavaScript heap. sql.js keeps its data in WebAssembly memory,
    // which the timeout below covers instead.
    resourceLimits: { maxOldGenerationSizeMb: 96 },
  });

  const timer = setTimeout(() => done({
    ok: false, stage: 'timeout',
    error: `The query took longer than ${TIMEOUT_MS / 1000} seconds and was stopped.`,
  }), TIMEOUT_MS);

  worker.once('message', done);
  worker.once('error', (err) => done({ ok: false, stage: 'engine', error: err.message }));
  worker.once('exit', (code) => {
    if (code !== 0) done({ ok: false, stage: 'engine', error: 'The query could not be run.' });
  });
});

// ─── Comparing answers ───────────────────────────────────────────────────────
// Two queries are judged equal if they return the same values. Column names
// are ignored — `AVG(salary)` and `AS average_salary` are the same answer.
// Numbers are compared to two decimal places, so 20000 and 20000.0 match.
// Row order only counts when the reference answer itself uses ORDER BY.

const normValue = (v) => {
  if (v === null || v === undefined) return 'NULL';
  const s = typeof v === 'number' ? v : String(v).trim();
  const n = typeof s === 'number' ? s : (/^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null);
  if (n !== null && Number.isFinite(n)) {
    return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
  }
  return String(s);
};

const rowsKey = (rows, ordered) => {
  const lines = rows.map((r) => r.map(normValue).join('\u241F'));
  if (!ordered) lines.sort();
  return lines.join('\u241E');
};

const isOrdered = (sql) => /\border\s+by\b/i.test(sql || '');

// A SELECT is judged by what it returned. An INSERT, UPDATE or DELETE returns
// nothing, so it's judged by the state it left every table in.
const signatureOf = (run, ordered) => {
  if (run.result) {
    return `R|${run.result.columns.length}|${rowsKey(run.result.rows, ordered)}`;
  }
  return 'T|' + Object.keys(run.tables || {}).sort()
    .map((name) => `${name}:${rowsKey(run.tables[name].rows, false)}`)
    .join('|');
};

// Sent to the browser for practice attempts, so the Run button can say "that
// matches" without the reference query ever leaving the server. A hash can be
// checked against but not read back.
const signatureHash = (signature) =>
  crypto.createHash('sha256').update(signature).digest('hex');

// ─── Practice challenge tokens ───────────────────────────────────────────────
// A practice challenge is generated, sent to the browser, and marked later.
// The reference answer has to survive that round trip without the student
// being able to read it, so it travels encrypted and only the server can open
// it. No database table needed.

const TOKEN_TTL_MS = 6 * 60 * 60 * 1000;

const tokenKey = () => crypto.createHash('sha256')
  .update(process.env.CHALLENGE_SECRET || process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'profolio-dev-only')
  .digest();

const sealChallenge = (payload) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', tokenKey(), iv);
  const body = Buffer.concat([
    cipher.update(JSON.stringify({ ...payload, iat: Date.now() }), 'utf8'),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64url');
};

const openChallenge = (token) => {
  const buf = Buffer.from(String(token || ''), 'base64url');
  const decipher = crypto.createDecipheriv('aes-256-gcm', tokenKey(), buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  const json = Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
  const payload = JSON.parse(json);
  if (Date.now() - payload.iat > TOKEN_TTL_MS) throw new Error('Challenge expired.');
  return payload;
};

// A short, readable excerpt of a run, for the AI prompt and for the stored
// result. Kept small so a large result doesn't bloat either.
const preview = (run, limit = 10) => {
  if (!run || !run.ok) return null;
  if (run.result) {
    return { kind: 'rows', columns: run.result.columns, rows: run.result.rows.slice(0, limit), total: run.result.rows.length };
  }
  return { kind: 'changes', changes: run.changes };
};

module.exports = {
  runSql, signatureOf, signatureHash, isOrdered,
  sealChallenge, openChallenge, preview,
};