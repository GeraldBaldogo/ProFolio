// ─────────────────────────────────────────────────────────────────────────────
// src/utils/sqlBrowser.js
//
// The page's side of the SQL runner: sends a query to the worker, gives up
// after a few seconds, and — for practice attempts — checks the result against
// a hash of the correct answer sent by the server.
// ─────────────────────────────────────────────────────────────────────────────

const RUN_TIMEOUT_MS = 3000
// Loading the engine the first time can take a moment on a slow connection;
// that shouldn't count against the student's query.
const WARMUP_TIMEOUT_MS = 20000

let worker = null
let readyPromise = null

const spawn = () => {
  worker = new Worker(new URL('./sqlWorker.js', import.meta.url), { type: 'module' })
  readyPromise = null
  return worker
}

const post = (w, schemaSql, querySql, timeoutMs, timeoutMessage) => new Promise((resolve) => {
  const id = Math.random().toString(36).slice(2)
  let settled = false
  const finish = (msg) => {
    if (settled) return
    settled = true
    clearTimeout(timer)
    w.removeEventListener('message', onMessage)
    w.removeEventListener('error', onError)
    resolve(msg)
  }
  const onMessage = (e) => { if (e.data?.id === id) finish(e.data) }
  const onError = (e) => finish({ ok: false, stage: 'engine', error: e?.message || 'The SQL engine failed to start.' })
  const timer = setTimeout(() => {
    // The only way to stop a runaway query is to end the thread. A fresh one
    // is made for the next run.
    w.terminate()
    if (worker === w) { worker = null; readyPromise = null }
    finish({ ok: false, stage: 'timeout', error: timeoutMessage })
  }, timeoutMs)
  w.addEventListener('message', onMessage)
  w.addEventListener('error', onError)
  w.postMessage({ id, schemaSql, querySql })
})

// Starts the engine ahead of time so the first real Run is quick. Safe to
// call repeatedly.
export const warmUpSql = () => {
  const w = worker || spawn()
  if (!readyPromise) {
    readyPromise = post(w, '', 'SELECT 1', WARMUP_TIMEOUT_MS, 'The SQL engine took too long to load. Check your connection and try again.')
  }
  return readyPromise
}

export const runSqlInBrowser = async (schemaSql, querySql) => {
  const warm = await warmUpSql()
  if (!warm.ok) return warm
  return post(worker, schemaSql, querySql, RUN_TIMEOUT_MS,
    `Your query took longer than ${RUN_TIMEOUT_MS / 1000} seconds and was stopped. Check for a join or a recursive query that never ends.`)
}

// ─── Checking a practice answer ──────────────────────────────────────────────
// Must stay identical to signatureOf / signatureHash in the backend's
// sqlSandbox.js, or a correct answer here would be marked wrong there.

const normValue = (v) => {
  if (v === null || v === undefined) return 'NULL'
  const s = typeof v === 'number' ? v : String(v).trim()
  const n = typeof s === 'number' ? s : (/^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null)
  if (n !== null && Number.isFinite(n)) {
    return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100)
  }
  return String(s)
}

const rowsKey = (rows, ordered) => {
  const lines = rows.map((r) => r.map(normValue).join('\u241F'))
  if (!ordered) lines.sort()
  return lines.join('\u241E')
}

export const signatureOf = (run, ordered) => {
  if (run.result) return `R|${run.result.columns.length}|${rowsKey(run.result.rows, ordered)}`
  return 'T|' + Object.keys(run.tables || {}).sort()
    .map((name) => `${name}:${rowsKey(run.tables[name].rows, false)}`)
    .join('|')
}

export const signatureHash = async (signature) => {
  const bytes = new TextEncoder().encode(signature)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}