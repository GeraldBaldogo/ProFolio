import { useLayoutEffect, useRef, useState } from 'react'

/*
 * Small SVG charts for the admin analytics page. No chart library: these
 * cover exactly what the page needs, match the app's dark theme, and add
 * nothing to install.
 *
 * Every chart measures its own width and draws at real pixels, so text never
 * stretches the way it does in a scaled viewBox.
 */

export const COLORS = {
  blue: '#60a5fa',
  violet: '#a78bfa',
  emerald: '#34d399',
  amber: '#fbbf24',
  rose: '#fb7185',
  sky: '#38bdf8',
  slate: '#64748b',
}

const GRID = 'rgba(255,255,255,0.06)'
const AXIS_TEXT = '#6b7280'

const useWidth = () => {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth)
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

// Rounds a maximum up to 1, 2 or 5 × a power of ten, so gridlines land on
// numbers a person would pick.
const niceMax = (value) => {
  if (value <= 4) return 4
  const pow = 10 ** Math.floor(Math.log10(value))
  const n = value / pow
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow
}

export const weekLabel = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

const Tooltip = ({ x, width, title, rows }) => {
  const left = Math.min(Math.max(x, 70), width - 70)
  return (
    <div
      className="dark-surface pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-white/10 bg-[#11131c]/95 px-3 py-2 shadow-xl z-10"
      style={{ left }}
    >
      <p className="text-[11px] text-gray-400 mb-1 whitespace-nowrap">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center gap-2 text-xs text-white whitespace-nowrap">
          <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
          <span className="text-gray-300">{r.label}</span>
          <span className="ml-auto pl-3 font-semibold tabular-nums">{r.value}</span>
        </p>
      ))}
    </div>
  )
}

const Legend = ({ series }) => (
  <div className="flex flex-wrap gap-x-4 gap-y-1">
    {series.map((s) => (
      <span key={s.key} className="flex items-center gap-1.5 text-xs text-gray-400">
        <span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.label}
      </span>
    ))}
  </div>
)

// Shared frame for the two weekly charts: gridlines, y-axis numbers, week
// labels, and which week the pointer is over.
const useWeeklyFrame = ({ data, width, height, max }) => {
  const pad = { top: 10, right: 8, bottom: 24, left: 32 }
  const innerW = Math.max(0, width - pad.left - pad.right)
  const innerH = height - pad.top - pad.bottom
  const top = niceMax(max)
  const y = (v) => pad.top + innerH - (v / top) * innerH
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(top * f))
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(innerW / 56))))
  return { pad, innerW, innerH, y, ticks, labelEvery }
}

const Axes = ({ data, width, frame, xAt }) => (
  <>
    {frame.ticks.map((t) => (
      <g key={t}>
        <line x1={frame.pad.left} x2={width - frame.pad.right} y1={frame.y(t)} y2={frame.y(t)} stroke={GRID} />
        <text x={frame.pad.left - 8} y={frame.y(t)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill={AXIS_TEXT}>{t}</text>
      </g>
    ))}
    {/* Counted back from the latest week, so the newest week always has a
        label and labels never crowd each other at the right edge. */}
    {data.map((d, i) => (data.length - 1 - i) % frame.labelEvery === 0 && (
      <text key={d.week} x={xAt(i)} y={frame.pad.top + frame.innerH + 16} fontSize="10" fill={AXIS_TEXT}
        textAnchor={xAt(i) + 22 > width - frame.pad.right ? 'end' : xAt(i) - 22 < frame.pad.left ? 'start' : 'middle'}>
        {weekLabel(d.week)}
      </text>
    ))}
  </>
)

/** Lines with a soft fill, one per series, over weekly buckets. */
export function TrendChart({ data = [], series, height = 220 }) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState(null)
  const max = Math.max(0, ...data.flatMap((d) => series.map((s) => d[s.key] || 0)))
  const frame = useWeeklyFrame({ data, width, height, max })
  const xAt = (i) => frame.pad.left + (data.length <= 1 ? frame.innerW / 2 : (i / (data.length - 1)) * frame.innerW)

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const rel = (e.clientX - rect.left - frame.pad.left) / Math.max(1, frame.innerW)
    setHover(Math.min(data.length - 1, Math.max(0, Math.round(rel * (data.length - 1)))))
  }

  return (
    <div>
      <div ref={ref} className="relative" style={{ height }}>
        {width > 0 && (
          <svg width={width} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img">
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                </linearGradient>
              ))}
            </defs>
            <Axes data={data} width={width} frame={frame} xAt={xAt} />
            {series.map((s) => {
              const pts = data.map((d, i) => [xAt(i), frame.y(d[s.key] || 0)])
              if (!pts.length) return null
              const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')
              const base = frame.y(0)
              const area = `${line} L${pts[pts.length - 1][0]},${base} L${pts[0][0]},${base} Z`
              return (
                <g key={s.key}>
                  <path d={area} fill={`url(#fill-${s.key})`} />
                  <path d={line} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                </g>
              )
            })}
            {hover !== null && (
              <g>
                <line x1={xAt(hover)} x2={xAt(hover)} y1={frame.pad.top} y2={frame.pad.top + frame.innerH} stroke="rgba(255,255,255,0.18)" />
                {series.map((s) => (
                  <circle key={s.key} cx={xAt(hover)} cy={frame.y(data[hover][s.key] || 0)} r="4" fill="#0b0d14" stroke={s.color} strokeWidth="2" />
                ))}
              </g>
            )}
          </svg>
        )}
        {hover !== null && width > 0 && (
          <Tooltip
            x={xAt(hover)}
            width={width}
            title={`Week of ${weekLabel(data[hover].week)}`}
            rows={series.map((s) => ({ label: s.label, color: s.color, value: data[hover][s.key] || 0 }))}
          />
        )}
      </div>
      {series.length > 1 && <div className="mt-3"><Legend series={series} /></div>}
    </div>
  )
}

/** Stacked weekly bars, e.g. graded vs practice attempts. */
export function StackedBars({ data = [], series, height = 220 }) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState(null)
  const max = Math.max(0, ...data.map((d) => series.reduce((sum, s) => sum + (d[s.key] || 0), 0)))
  const frame = useWeeklyFrame({ data, width, height, max })
  const slot = data.length ? frame.innerW / data.length : 0
  const barW = Math.max(4, Math.min(28, slot * 0.62))
  const xAt = (i) => frame.pad.left + slot * i + slot / 2

  return (
    <div>
      <div ref={ref} className="relative" style={{ height }}>
        {width > 0 && (
          <svg width={width} height={height} onMouseLeave={() => setHover(null)} role="img">
            <Axes data={data} width={width} frame={frame} xAt={xAt} />
            {data.map((d, i) => {
              let acc = 0
              return (
                <g key={d.week} onMouseEnter={() => setHover(i)} opacity={hover === null || hover === i ? 1 : 0.45}>
                  <rect x={xAt(i) - slot / 2} y={frame.pad.top} width={slot} height={frame.innerH} fill="transparent" />
                  {series.map((s, si) => {
                    const v = d[s.key] || 0
                    if (!v) return null
                    const y0 = frame.y(acc)
                    acc += v
                    const y1 = frame.y(acc)
                    const isTop = series.slice(si + 1).every((n) => !(d[n.key] || 0))
                    return (
                      <rect key={s.key} x={xAt(i) - barW / 2} y={y1} width={barW} height={Math.max(0, y0 - y1)}
                        rx={isTop ? 3 : 0} fill={s.color} />
                    )
                  })}
                </g>
              )
            })}
          </svg>
        )}
        {hover !== null && width > 0 && (
          <Tooltip
            x={xAt(hover)}
            width={width}
            title={`Week of ${weekLabel(data[hover].week)}`}
            rows={series.map((s) => ({ label: s.label, color: s.color, value: data[hover][s.key] || 0 }))}
          />
        )}
      </div>
      <div className="mt-3"><Legend series={series} /></div>
    </div>
  )
}

/** Ring chart with a legend. Segments: [{ label, value, color }]. */
export function Donut({ segments = [], size = 150, thickness = 16, centerValue, centerLabel, stacked = false }) {
  const [hover, setHover] = useState(null)
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let offset = 0
  const shown = hover !== null ? segments[hover] : null

  return (
    <div className={`flex flex-col items-center gap-5 ${stacked ? '' : 'sm:flex-row'}`}>
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={GRID} strokeWidth={thickness} />
          {total > 0 && segments.map((s, i) => {
            const len = (s.value / total) * c
            const el = (
              <circle key={s.label} cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={s.color} strokeWidth={hover === i ? thickness + 3 : thickness}
                strokeDasharray={`${Math.max(0, len - 2)} ${c}`} strokeDashoffset={-offset}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                style={{ transition: 'stroke-width .15s' }} />
            )
            offset += len
            return el
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-white text-xl font-bold tabular-nums">{shown ? shown.value : centerValue ?? total}</span>
          <span className="text-gray-500 text-[11px] max-w-[90px] leading-tight">{shown ? shown.label : centerLabel}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 w-full min-w-0">
        {segments.map((s, i) => (
          <div key={s.label} className={`flex items-center gap-2 text-xs rounded-md px-1 -mx-1 ${hover === i ? 'bg-white/5' : ''}`}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
            <span className="text-gray-300 truncate">{s.label}</span>
            <span className="ml-auto text-white font-semibold tabular-nums">{s.value}</span>
            <span className="text-gray-500 w-10 text-right tabular-nums">{total ? Math.round((s.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Ranked horizontal bars. Items: [{ label, value, note? }]. */
export function BarList({ items = [], color = COLORS.blue, max, format = (v) => v, note }) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value))
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <span className="text-gray-300 text-xs truncate">{item.label}</span>
            <span className="text-white text-xs font-semibold tabular-nums flex-shrink-0">
              {format(item.value)}
              {(item.note ?? note?.(item)) && <span className="text-gray-500 font-normal ml-1.5">{item.note ?? note(item)}</span>}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (item.value / top) * 100)}%`, background: item.color || color, transition: 'width .6s ease' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Tiny trend line for a KPI card. */
export function Sparkline({ values = [], color = COLORS.blue, width = 96, height = 28 }) {
  if (values.length < 2) return null
  const max = Math.max(1, ...values)
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - 2 - (v / max) * (height - 4)}`)
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
