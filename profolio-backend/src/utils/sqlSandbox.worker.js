// ─────────────────────────────────────────────────────────────────────────────
// src/utils/sqlSandbox.worker.js
//
// Runs one piece of SQL against a fresh in-memory database, then reports what
// came back. Lives in its own thread so that a query which never finishes — a
// runaway recursive CTE, a cross join of cross joins — can be killed without
// freezing the whole backend for every other user.
//
// Nothing here touches Supabase or the disk. The database exists only in this
// thread's memory and disappears with it.
// ─────────────────────────────────────────────────────────────────────────────

const { parentPort, workerData } = require('worker_threads');
const initSqlJs = require('sql.js');
const { normaliseDialect } = require('./sqlDialect');

const MAX_ROWS = 500;

const cap = (values) => ({
  rows: values.slice(0, MAX_ROWS),
  truncated: values.length > MAX_ROWS,
});

(async () => {
  try {
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    try {
      db.exec(normaliseDialect(workerData.schemaSql || ''));
    } catch (e) {
      return parentPort.postMessage({ ok: false, stage: 'schema', error: e.message });
    }

    // Counted as a difference, because the schema's own INSERTs would
    // otherwise be reported as changes made by the student's query.
    const totalChanges = () => db.exec('SELECT total_changes()')[0].values[0][0];
    const before = totalChanges();

    const query = workerData.querySql || '';
    let results;
    try {
      results = db.exec(query);
    } catch (e) {
      return parentPort.postMessage({ ok: false, stage: 'query', error: e.message });
    }

    const changes = totalChanges() - before;

    // db.exec returns one entry per statement that produced rows. The last one
    // is what the student is asking to see.
    let last = results.length ? results[results.length - 1] : null;

    // A SELECT that matches nothing produces no entry at all, which would make
    // it look like an UPDATE. Recognise it and report an empty table instead,
    // with its column headings, so "no rows" is shown as exactly that.
    const statements = query.split(';').map((x) => x.trim()).filter(Boolean);
    const finalStatement = statements[statements.length - 1] || '';
    if (!last && /^(select|with)\b/i.test(finalStatement)) {
      let columns = [];
      try {
        const stmt = db.prepare(finalStatement);
        columns = stmt.getColumnNames();
        stmt.free();
      } catch { /* headings are a nicety */ }
      last = { columns, values: [] };
    }

    // The state of every table afterwards, so INSERT, UPDATE and DELETE can be
    // judged by what they actually did to the data.
    const tables = {};
    const names = db.exec(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    for (const [name] of names[0]?.values || []) {
      const dump = db.exec(`SELECT * FROM "${String(name).replace(/"/g, '""')}"`);
      tables[name] = dump.length
        ? { columns: dump[0].columns, ...cap(dump[0].values) }
        : { columns: [], rows: [], truncated: false };
    }

    parentPort.postMessage({
      ok: true,
      result: last ? { columns: last.columns, ...cap(last.values) } : null,
      changes,
      tables,
    });
  } catch (e) {
    parentPort.postMessage({ ok: false, stage: 'engine', error: e.message });
  }
})();