// ─────────────────────────────────────────────────────────────────────────────
// src/utils/sqlWorker.js
//
// Runs a student's SQL in the browser, in its own thread, against a fresh
// in-memory copy of the challenge's tables. Mirrors the backend's
// sqlSandbox.worker.js so what the student sees when they press Run is what
// the marker sees when they submit.
//
// Being a separate thread is the point: a query that never finishes can be
// killed without freezing the page — and with it the exam timer, the camera
// and the rest of the proctoring.
// ─────────────────────────────────────────────────────────────────────────────

import initSqlJs from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'

const MAX_ROWS = 500

// Same translations as the backend's sqlDialect.js, so a professor's
// MySQL-flavoured schema loads identically in both places.
const normaliseDialect = (sql) => String(sql || '')
  .replace(/\bAUTO_INCREMENT\b(\s*=\s*\d+)?/gi, '')
  .replace(/\bUNSIGNED\b/gi, '')
  .replace(/\bENUM\s*\([^)]*\)/gi, 'TEXT')
  .replace(/\)\s*ENGINE\s*=\s*\w+/gi, ')')
  .replace(/\bDEFAULT\s+CHARSET\s*=\s*\w+/gi, '')
  .replace(/\bCHARACTER\s+SET\s+\w+/gi, '')
  .replace(/\bCOLLATE\s*=?\s*\w+/gi, '')
  .replace(/\bON\s+UPDATE\s+CURRENT_TIMESTAMP\b/gi, '')

let enginePromise = null
const engine = () => (enginePromise ||= initSqlJs({ locateFile: () => wasmUrl }))

const cap = (values) => ({ rows: values.slice(0, MAX_ROWS), truncated: values.length > MAX_ROWS })

const run = async (schemaSql, querySql) => {
  const SQL = await engine()
  const db = new SQL.Database()
  try {
    try {
      db.exec(normaliseDialect(schemaSql))
    } catch (e) {
      return { ok: false, stage: 'schema', error: e.message }
    }

    const totalChanges = () => db.exec('SELECT total_changes()')[0].values[0][0]
    const before = totalChanges()
    const started = performance.now()

    let results
    try {
      results = db.exec(querySql || '')
    } catch (e) {
      return { ok: false, stage: 'query', error: e.message }
    }
    const elapsedMs = Math.round(performance.now() - started)
    const changes = totalChanges() - before

    let last = results.length ? results[results.length - 1] : null

    // A SELECT matching nothing produces no entry; report it as an empty table.
    const statements = String(querySql || '').split(';').map((x) => x.trim()).filter(Boolean)
    const finalStatement = statements[statements.length - 1] || ''
    if (!last && /^(select|with)\b/i.test(finalStatement)) {
      let columns = []
      try {
        const stmt = db.prepare(finalStatement)
        columns = stmt.getColumnNames()
        stmt.free()
      } catch { /* headings are a nicety */ }
      last = { columns, values: [] }
    }

    const tables = {}
    const names = db.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    for (const [name] of names[0]?.values || []) {
      const dump = db.exec(`SELECT * FROM "${String(name).replace(/"/g, '""')}"`)
      tables[name] = dump.length
        ? { columns: dump[0].columns, ...cap(dump[0].values) }
        : { columns: [], rows: [], truncated: false }
    }

    return {
      ok: true,
      result: last ? { columns: last.columns, ...cap(last.values) } : null,
      changes,
      tables,
      elapsedMs,
    }
  } finally {
    db.close()
  }
}

self.onmessage = async (e) => {
  const { id, schemaSql, querySql } = e.data || {}
  try {
    self.postMessage({ id, ...(await run(schemaSql, querySql)) })
  } catch (err) {
    self.postMessage({ id, ok: false, stage: 'engine', error: err?.message || 'The SQL engine failed to start.' })
  }
}