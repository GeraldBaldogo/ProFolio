import { useState, useMemo, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTable, faKey, faLink, faExpand, faXmark, faDiagramProject, faCode,
} from '@fortawesome/free-solid-svg-icons'

/**
 * Shows a database schema three ways: an entity-relationship diagram, sample
 * rows, and the raw SQL.
 *
 * It accepts both shapes the SQL assessment produces:
 *   - `tables`     from the AI in practice mode
 *                  [{ name, columns: ["product_id (INT)", ...], sample_data, sample_rows? }]
 *   - `schemaSql`  written by a professor for an assigned test — CREATE TABLE
 *                  statements, optionally followed by INSERT statements
 *
 * INSERT statements in a professor's schema become the sample data, so no
 * change to the test-authoring form is needed to use it.
 *
 * Where keys aren't declared, they're inferred from naming — `customer_id` in
 * `orders` points at `customers` — which covers conventionally named schemas.
 * Nothing here suggests a query; it only draws what the schema already says.
 */

// ═══════════════════════════════════════════════════════════════════════════
// PARSING
// ═══════════════════════════════════════════════════════════════════════════

const unquote = (s) => (s || '').trim().replace(/^[`"[]|[`"\]]$/g, '')

// Splits on commas that aren't inside parentheses, so DECIMAL(10,2) and
// PRIMARY KEY (a, b) stay whole.
const splitTopLevel = (body) => {
  const out = []
  let depth = 0, cur = '', q = null
  for (const ch of body) {
    if (q) { cur += ch; if (ch === q) q = null; continue }
    if (ch === "'" || ch === '"') { q = ch; cur += ch; continue }
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue }
    cur += ch
  }
  if (cur.trim()) out.push(cur)
  return out
}

const NAME = '[`"\\[]?(\\w+)[`"\\]]?'

const parseCreateTables = (sql) => {
  const clean = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
  const tables = []
  const re = new RegExp(`create\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?${NAME}\\s*\\(`, 'gi')
  let m

  while ((m = re.exec(clean))) {
    const name = m[1]
    let depth = 1, i = re.lastIndex
    const start = i
    while (i < clean.length && depth > 0) {
      if (clean[i] === '(') depth++
      else if (clean[i] === ')') depth--
      i++
    }
    const body = clean.slice(start, i - 1)
    re.lastIndex = i

    const columns = []
    const pks = new Set()
    const fks = {}

    for (const raw of splitTopLevel(body)) {
      const p = raw.trim()
      if (!p) continue
      let mm

      if ((mm = /^(?:constraint\s+\S+\s+)?primary\s+key\s*\(([^)]*)\)/i.exec(p))) {
        mm[1].split(',').forEach(c => pks.add(unquote(c)))
        continue
      }
      mm = new RegExp(`^(?:constraint\\s+\\S+\\s+)?foreign\\s+key\\s*\\(([^)]*)\\)\\s*references\\s+${NAME}\\s*(?:\\(([^)]*)\\))?`, 'i').exec(p)
      if (mm) {
        const local = mm[1].split(',').map(unquote)
        const remote = mm[3] ? mm[3].split(',').map(unquote) : []
        local.forEach((c, k) => { fks[c] = { table: mm[2], column: remote[k] || null } })
        continue
      }
      if (/^(constraint|unique|index|key|check)\b/i.test(p)) continue

      const cm = new RegExp(`^${NAME}\\s+([A-Za-z_]\\w*(?:\\s*\\([^)]*\\))?)`).exec(p)
      if (!cm) continue
      const col = { name: cm[1], type: cm[2].replace(/\s+/g, '').toUpperCase() }
      if (/\bprimary\s+key\b/i.test(p)) pks.add(col.name)
      const r = new RegExp(`\\breferences\\s+${NAME}\\s*(?:\\(\\s*${NAME}\\s*\\))?`, 'i').exec(p)
      if (r) fks[col.name] = { table: r[1], column: r[2] || null }
      columns.push(col)
    }

    columns.forEach(c => {
      c.pk = pks.has(c.name)
      if (fks[c.name]) c.fk = fks[c.name]
    })
    tables.push({ name, columns, rows: [] })
  }
  return tables
}

// "students(id, name, year)" — a shorthand some professors write instead of
// full DDL, sometimes as comments.
const parseShorthand = (sql) => {
  const tables = []
  for (const line of sql.split('\n')) {
    const m = /^\s*(?:--\s*)?(\w+)\s*\(([^)]*)\)\s*;?\s*$/.exec(line)
    if (!m || /^(select|insert|values|create)$/i.test(m[1])) continue
    tables.push({
      name: m[1],
      columns: m[2].split(',').map(c => ({ name: unquote(c), type: '' })).filter(c => c.name),
      rows: [],
    })
  }
  return tables
}

const parseValueTuples = (s) => {
  const rows = []
  let i = 0
  const val = (c, quoted) => quoted ? c : (c.trim().toUpperCase() === 'NULL' ? null : c.trim())
  while (i < s.length) {
    while (i < s.length && /[\s,]/.test(s[i])) i++
    if (s[i] !== '(') break
    i++
    const row = []
    let cur = '', q = null, quoted = false
    for (; i < s.length; i++) {
      const ch = s[i]
      if (q) {
        if (ch === q) {
          if (s[i + 1] === q) { cur += ch; i++ } else q = null
        } else cur += ch
        continue
      }
      if (ch === "'" || ch === '"') { q = ch; quoted = true; continue }
      if (ch === ',') { row.push(val(cur, quoted)); cur = ''; quoted = false; continue }
      if (ch === ')') { row.push(val(cur, quoted)); i++; break }
      cur += ch
    }
    rows.push(row)
  }
  return rows
}

const attachInserts = (sql, tables) => {
  const byName = new Map(tables.map(t => [t.name.toLowerCase(), t]))
  const re = new RegExp(`insert\\s+into\\s+${NAME}\\s*(?:\\(([^)]*)\\))?\\s*values\\s*`, 'gi')
  let m
  while ((m = re.exec(sql))) {
    const t = byName.get(m[1].toLowerCase())
    if (!t) continue
    const cols = m[2] ? m[2].split(',').map(unquote) : t.columns.map(c => c.name)
    const tuples = parseValueTuples(sql.slice(re.lastIndex))
    tuples.forEach(vals => {
      const obj = {}
      cols.forEach((c, k) => { obj[c] = vals[k] })
      t.rows.push(obj)
    })
  }
}

// "product_id (INT)" or "price (DECIMAL(10,2))"
const parseColString = (s) => {
  const m = /^\s*[`"]?(\w+)[`"]?\s*(?:\((.*)\))?\s*$/.exec(s || '')
  return m ? { name: m[1], type: (m[2] || '').toUpperCase() } : { name: String(s), type: '' }
}

const fromAiTables = (list) => list.map(t => {
  const columns = (t.columns || []).map(c =>
    typeof c === 'string'
      ? parseColString(c)
      : { name: c.name, type: (c.type || '').toUpperCase(), pk: !!c.pk }
  )
  let rows = []
  if (Array.isArray(t.sample_rows)) {
    rows = t.sample_rows.map(r => {
      if (Array.isArray(r)) {
        const o = {}
        columns.forEach((c, k) => { o[c.name] = r[k] })
        return o
      }
      return r
    })
  }
  return {
    name: t.name,
    columns,
    rows,
    description: typeof t.sample_data === 'string' ? t.sample_data : t.description,
  }
})

// Fills in primary and foreign keys the schema didn't declare.
const inferKeys = (tables) => {
  const byName = new Map(tables.map(t => [t.name.toLowerCase(), t]))

  const singulars = (name) => {
    const n = name.toLowerCase()
    const s = new Set([n])
    if (n.endsWith('ies')) s.add(n.slice(0, -3) + 'y')
    if (n.endsWith('es')) s.add(n.slice(0, -2))
    if (n.endsWith('s')) s.add(n.slice(0, -1))
    return s
  }

  tables.forEach(t => {
    if (t.columns.some(c => c.pk)) return
    const sing = singulars(t.name)
    const hit = t.columns.find(c => {
      const n = c.name.toLowerCase()
      return n === 'id' || [...sing].some(s => n === `${s}_id`)
    })
    if (hit) hit.pk = true
  })

  // A column that shares its name with another table's single primary key is
  // almost always a reference to it: orders.customer_id → customers.customer_id.
  const pkOwner = new Map()
  tables.forEach(t => {
    const pks = t.columns.filter(c => c.pk)
    if (pks.length === 1) pkOwner.set(pks[0].name.toLowerCase(), t)
  })

  tables.forEach(t => t.columns.forEach(c => {
    if (c.fk) return
    const n = c.name.toLowerCase()
    const owner = pkOwner.get(n)
    if (owner && owner !== t) {
      c.fk = { table: owner.name, column: owner.columns.find(x => x.pk).name }
      return
    }
    if (n.endsWith('_id') && !c.pk) {
      const base = n.slice(0, -3)
      const candidates = [base, `${base}s`, `${base}es`, base.endsWith('y') ? `${base.slice(0, -1)}ies` : null]
      for (const cand of candidates) {
        const target = cand && byName.get(cand)
        if (target && target !== t) {
          const pk = target.columns.find(x => x.pk) || target.columns[0]
          c.fk = { table: target.name, column: pk?.name }
          break
        }
      }
    }
  }))

  tables.forEach(t => t.columns.forEach(c => {
    if (c.fk && !c.fk.column) {
      const target = byName.get(c.fk.table.toLowerCase())
      const pk = target?.columns.find(x => x.pk)
      if (pk) c.fk.column = pk.name
    }
  }))
}

export const buildSchema = ({ tables, schemaSql }) => {
  let result = []
  if (schemaSql) {
    result = parseCreateTables(schemaSql)
    if (!result.length) result = parseShorthand(schemaSql)
    if (result.length) attachInserts(schemaSql, result)
  } else if (Array.isArray(tables)) {
    result = fromAiTables(tables)
  }
  inferKeys(result)
  return result
}

// ═══════════════════════════════════════════════════════════════════════════
// DIAGRAM
// ═══════════════════════════════════════════════════════════════════════════

const BOX_W = 184
const HEADER_H = 30
const ROW_H = 21
const PAD_B = 6
const GAP_X = 64
const GAP_Y = 40
const MARGIN = 14
const LOOP_ROOM = 44

const boxHeight = (t) => HEADER_H + t.columns.length * ROW_H + PAD_B

const buildAdjacency = (tables) => {
  const adj = new Map(tables.map(t => [t.name, new Map()]))
  const lower = new Map(tables.map(t => [t.name.toLowerCase(), t.name]))
  tables.forEach(t => t.columns.forEach(c => {
    const target = c.fk && lower.get(c.fk.table.toLowerCase())
    if (!target || target === t.name) return
    adj.get(t.name).set(target, (adj.get(t.name).get(target) || 0) + 1)
    adj.get(target).set(t.name, (adj.get(target).get(t.name) || 0) + 1)
  }))
  return adj
}

// Places tables on a grid one at a time, each in the free cell closest to the
// tables it is linked to. The most-connected table starts in the middle, so a
// hub like `orders` ends up surrounded by what it references.
const placeTables = (tables, cols) => {
  const n = tables.length
  const rows = Math.ceil(n / cols)
  const adj = buildAdjacency(tables)
  const degree = (name) => [...adj.get(name).values()].reduce((a, b) => a + b, 0)

  const free = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) free.push({ c, r })

  const placed = new Map()
  const remaining = new Set(tables.map(t => t.name))

  const take = (name, cell) => {
    placed.set(name, cell)
    remaining.delete(name)
    free.splice(free.findIndex(f => f.c === cell.c && f.r === cell.r), 1)
  }

  const cost = (name, cell) => {
    let total = 0
    for (const [nb, w] of adj.get(name)) {
      const q = placed.get(nb)
      if (!q) continue
      const dc = Math.abs(q.c - cell.c)
      const dr = Math.abs(q.r - cell.r)
      // Neighbouring columns share a gutter, so the line is short and simple.
      // Anything further has to detour round the boxes in between.
      total += w * (dc + dr * 1.2 + (dc >= 2 ? 3 : 0))
    }
    return total
  }

  const first = [...remaining].sort((a, b) => degree(b) - degree(a))[0]
  take(first, { c: Math.floor((cols - 1) / 2), r: Math.floor((rows - 1) / 2) })

  while (remaining.size) {
    // Next: the table with the most links to what's already placed.
    const next = [...remaining].sort((a, b) => {
      const la = [...adj.get(a).keys()].filter(x => placed.has(x)).length
      const lb = [...adj.get(b).keys()].filter(x => placed.has(x)).length
      return lb - la || degree(b) - degree(a)
    })[0]
    const linked = [...adj.get(next).keys()].some(x => placed.has(x))
    const cell = linked
      ? [...free].sort((a, b) => cost(next, a) - cost(next, b) || a.r - b.r || a.c - b.c)[0]
      : free[0]
    take(next, cell)
  }
  return { placed, rows }
}

const layout = (tables, cols) => {
  cols = Math.max(1, Math.min(cols, tables.length))
  const { placed, rows } = placeTables(tables, cols)

  const rowH = Array(rows).fill(0)
  tables.forEach(t => {
    const { r } = placed.get(t.name)
    rowH[r] = Math.max(rowH[r], boxHeight(t))
  })
  const rowTop = []
  let y = MARGIN
  for (let r = 0; r < rows; r++) { rowTop[r] = y; y += rowH[r] + GAP_Y }

  const pos = new Map()
  tables.forEach(t => {
    const { c, r } = placed.get(t.name)
    pos.set(t.name, { x: MARGIN + c * (BOX_W + GAP_X), y: rowTop[r], h: boxHeight(t), col: c, row: r })
  })

  // Horizontal lanes run through the gaps between rows, which no box ever
  // occupies. The last row gets one beneath it too.
  const channelY = (ra, rb) => {
    if (ra !== rb) {
      const top = Math.min(ra, rb)
      return rowTop[top] + rowH[top] + GAP_Y / 2
    }
    if (ra > 0) return rowTop[ra] - GAP_Y / 2
    return rowTop[ra] + rowH[ra] + GAP_Y / 2
  }

  const width = MARGIN * 2 + cols * BOX_W + (cols - 1) * GAP_X + LOOP_ROOM
  const height = y + MARGIN // includes the lane under the last row
  return { pos, width, height, channelY }
}

const buildEdges = (tables, pos) => {
  const lower = new Map(tables.map(t => [t.name.toLowerCase(), t]))
  const edges = []
  tables.forEach(t => t.columns.forEach((c, ci) => {
    if (!c.fk) return
    const target = lower.get(c.fk.table.toLowerCase())
    if (!target) return
    const ti = Math.max(0, target.columns.findIndex(x => x.name === c.fk.column))
    const a = pos.get(t.name), b = pos.get(target.name)
    edges.push({
      from: t.name, to: target.name,
      y1: a.y + HEADER_H + ci * ROW_H + ROW_H / 2,
      y2: b.y + HEADER_H + ti * ROW_H + ROW_H / 2,
      ax: a.x, bx: b.x, acol: a.col, bcol: b.col, arow: a.row, brow: b.row,
    })
  }))

  // Spread lines that share a gutter or lane so they don't sit on top of one
  // another.
  const loopCount = new Map()
  edges.forEach((e, k) => {
    if (e.acol === e.bcol) {
      const n = loopCount.get(e.acol) || 0
      loopCount.set(e.acol, n + 1)
      e.lane = Math.min(n, 4)
    } else {
      e.lane = (k % 5) - 2
    }
  })
  return edges
}

// Crow's foot on the "many" side, a double bar on the "one" side.
const crowsFoot = (x, y, dir) => {
  const tip = x + dir * 11
  return `M${tip},${y} L${x},${y - 6} M${tip},${y} L${x},${y} M${tip},${y} L${x},${y + 6} M${x + dir * 14},${y - 6} L${x + dir * 14},${y + 6}`
}
const oneBar = (x, y, dir) =>
  `M${x + dir * 7},${y - 6} L${x + dir * 7},${y + 6} M${x + dir * 11},${y - 6} L${x + dir * 11},${y + 6}`

// Every vertical run sits in a gutter between columns and every long
// horizontal run sits in a lane between rows, so no line crosses a table.
const edgePaths = (e, channelY) => {
  if (e.acol === e.bcol) {
    const sx = e.ax + BOX_W
    const out = sx + 16 + e.lane * 6
    return {
      line: `M${sx},${e.y1} H${out} V${e.y2} H${sx}`,
      marks: crowsFoot(sx, e.y1, 1) + ' ' + oneBar(sx, e.y2, 1),
    }
  }

  const dir = e.bcol > e.acol ? 1 : -1
  const sx = dir > 0 ? e.ax + BOX_W : e.ax
  const ex = dir > 0 ? e.bx : e.bx + BOX_W
  const marks = crowsFoot(sx, e.y1, dir) + ' ' + oneBar(ex, e.y2, -dir)

  if (Math.abs(e.bcol - e.acol) === 1) {
    const gx = (sx + ex) / 2 + e.lane * 5
    return { line: `M${sx},${e.y1} H${gx} V${e.y2} H${ex}`, marks }
  }

  const gx1 = sx + dir * (GAP_X / 2) + e.lane * 5
  const gx2 = ex - dir * (GAP_X / 2) + e.lane * 5
  const cy = channelY(e.arow, e.brow) + e.lane * 4
  return { line: `M${sx},${e.y1} H${gx1} V${cy} H${gx2} V${e.y2} H${ex}`, marks }
}

const Diagram = ({ tables, maxCols }) => {
  const [hover, setHover] = useState(null)
  const wrapRef = useRef(null)
  const [avail, setAvail] = useState(0)

  // Fit as many columns as the space allows: one in the side panel, more when
  // expanded or on a wide screen.
  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => setAvail(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const fit = avail
    ? Math.max(1, Math.floor((avail - MARGIN * 2 - LOOP_ROOM + GAP_X) / (BOX_W + GAP_X)))
    : 1
  const cols = Math.min(maxCols, fit)

  const { pos, width, height, channelY } = useMemo(() => layout(tables, cols), [tables, cols])
  const edges = useMemo(() => buildEdges(tables, pos), [tables, pos])

  const linked = (a, b) => edges.some(e => (e.from === a && e.to === b) || (e.to === a && e.from === b))

  return (
    <div ref={wrapRef} className="overflow-auto rounded-xl border border-white/5 bg-[#0a0a18]">
      <div className="relative mx-auto" style={{ width, height }}>
        <svg
          width={width}
          height={height}
          className="absolute inset-0 pointer-events-none text-gray-500"
          aria-hidden="true"
        >
          {edges.map((e, k) => {
            const { line, marks } = edgePaths(e, channelY)
            const lit = hover && (e.from === hover || e.to === hover)
            const dim = hover && !lit
            return (
              <g
                key={k}
                className={lit ? 'text-emerald-400' : ''}
                opacity={dim ? 0.15 : 1}
                stroke="currentColor"
                fill="none"
                strokeWidth={lit ? 1.8 : 1.3}
              >
                <path d={line} />
                <path d={marks} />
              </g>
            )
          })}
        </svg>

        {tables.map(t => {
          const p = pos.get(t.name)
          const dim = hover && hover !== t.name && !linked(hover, t.name)
          return (
            <div
              key={t.name}
              onMouseEnter={() => setHover(t.name)}
              onMouseLeave={() => setHover(null)}
              className={`absolute rounded-lg border overflow-hidden transition-opacity ${
                hover === t.name ? 'border-emerald-400/60' : 'border-white/10'
              } bg-[#0d1218] ${dim ? 'opacity-40' : ''}`}
              style={{ left: p.x, top: p.y, width: BOX_W, height: p.h }}
            >
              <div
                className="flex items-center gap-1.5 px-2.5 bg-emerald-500/15 border-b border-white/5"
                style={{ height: HEADER_H }}
              >
                <FontAwesomeIcon icon={faTable} className="text-emerald-400 text-[10px]" />
                <span className="text-emerald-300 text-[12px] font-bold font-mono truncate">{t.name}</span>
              </div>
              {t.columns.map(c => (
                <div
                  key={c.name}
                  className="flex items-center gap-1.5 px-2.5 font-mono"
                  style={{ height: ROW_H }}
                >
                  <span className="w-3 flex-shrink-0 text-center">
                    {c.pk
                      ? <FontAwesomeIcon icon={faKey} className="text-amber-400 text-[9px]" title="Primary key" />
                      : c.fk
                        ? <FontAwesomeIcon icon={faLink} className="text-blue-400 text-[9px]" title={`References ${c.fk.table}`} />
                        : null}
                  </span>
                  <span className={`text-[11px] truncate ${c.pk ? 'text-white font-semibold' : 'text-gray-300'}`}>
                    {c.name}
                  </span>
                  {c.type && (
                    <span className="ml-auto text-[9px] text-gray-600 truncate pl-1 flex-shrink-0 max-w-[70px]">{c.type}</span>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SAMPLE DATA
// ═══════════════════════════════════════════════════════════════════════════

const MAX_ROWS = 8

const SampleData = ({ tables }) => {
  const withRows = tables.filter(t => t.rows?.length)
  if (!withRows.length) {
    return (
      <p className="text-gray-500 text-xs leading-relaxed">
        No sample rows were provided for this schema.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      {withRows.map(t => {
        const cols = t.columns.length ? t.columns.map(c => c.name) : Object.keys(t.rows[0] || {})
        const shown = t.rows.slice(0, MAX_ROWS)
        return (
          <div key={t.name}>
            <p className="text-emerald-300 text-xs font-bold font-mono mb-1.5">{t.name}</p>
            <div className="overflow-x-auto rounded-lg border border-white/8">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="bg-white/[0.04]">
                    {cols.map(c => (
                      <th key={c} className="text-left text-gray-400 font-semibold px-2.5 py-1.5 border-b border-white/8 whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      {cols.map(c => (
                        <td key={c} className="px-2.5 py-1.5 text-gray-300 whitespace-nowrap">
                          {r[c] === null || r[c] === undefined
                            ? <span className="text-gray-600 italic">NULL</span>
                            : String(r[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {t.rows.length > MAX_ROWS && (
              <p className="text-gray-600 text-[10px] mt-1">
                Showing {MAX_ROWS} of {t.rows.length} rows
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEWER
// ═══════════════════════════════════════════════════════════════════════════

const SchemaViewer = ({ tables, schemaSql }) => {
  const schema = useMemo(() => buildSchema({ tables, schemaSql }), [tables, schemaSql])
  const hasDiagram = schema.length > 0
  const hasRows = schema.some(t => t.rows?.length)
  const hasSql = !!schemaSql

  const [tab, setTab] = useState(hasDiagram ? 'diagram' : 'sql')
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!expanded) return
    const onKey = (e) => { if (e.key === 'Escape') setExpanded(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded])

  if (!hasDiagram && !hasSql) return null

  const tabs = [
    hasDiagram && { key: 'diagram', label: 'Diagram', icon: faDiagramProject },
    hasDiagram && { key: 'data', label: 'Sample data', icon: faTable, muted: !hasRows },
    hasSql && { key: 'sql', label: 'SQL', icon: faCode },
  ].filter(Boolean)

  const body = (inModal) => (
    <>
      {tab === 'diagram' && hasDiagram && (
        <>
          <Diagram tables={schema} maxCols={inModal ? 4 : 2} />
          <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><FontAwesomeIcon icon={faKey} className="text-amber-400" /> Primary key</span>
            <span className="flex items-center gap-1"><FontAwesomeIcon icon={faLink} className="text-blue-400" /> Foreign key</span>
            <span>Hover a table to trace its links</span>
          </div>
        </>
      )}
      {tab === 'data' && <SampleData tables={schema} />}
      {tab === 'sql' && hasSql && (
        <pre className="text-emerald-300 text-xs font-mono leading-relaxed bg-[#0a0a18] border border-white/5 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap">
          {schemaSql}
        </pre>
      )}
      {!inModal && tab !== 'sql' && schema.some(t => t.description) && (
        <div className="mt-3 flex flex-col gap-1">
          {schema.filter(t => t.description).map(t => (
            <p key={t.name} className="text-gray-500 text-xs leading-relaxed">
              <span className="text-gray-400 font-mono">{t.name}</span> — {t.description}
            </p>
          ))}
        </div>
      )}
    </>
  )

  const tabBar = (
    <div className="flex items-center gap-1 mb-3">
      {tabs.map(t => (
        <button
          key={t.key}
          type="button"
          tabIndex={-1}
          onClick={() => setTab(t.key)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
            tab === t.key
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
              : `border border-transparent hover:text-white ${t.muted ? 'text-gray-600' : 'text-gray-500'}`
          }`}
        >
          <FontAwesomeIcon icon={t.icon} className="text-[10px]" /> {t.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <FontAwesomeIcon icon={faTable} className="text-emerald-400 text-xs" />
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Schema</p>
        {hasDiagram && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setExpanded(true)}
            className="ml-auto flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faExpand} className="text-[10px]" /> Expand
          </button>
        )}
      </div>

      {tabBar}
      {body(false)}

      {/* Stays inside the page, so opening it is not a tab switch. */}
      {expanded && (
        <div
          className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          onClick={() => setExpanded(false)}
        >
          <div
            className="w-full max-w-5xl max-h-full overflow-auto bg-[#0a0a18] border border-white/10 rounded-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon icon={faTable} className="text-emerald-400 text-xs" />
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Schema</p>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Close"
                className="ml-auto w-8 h-8 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            {tabBar}
            {body(true)}
          </div>
        </div>
      )}
    </div>
  )
}

export default SchemaViewer