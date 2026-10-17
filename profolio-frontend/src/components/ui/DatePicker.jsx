import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { usePopover, PopoverPanel } from './Popover'
import Select from './Select'

/*
 * ProFolio's calendars, in place of the browser's date inputs (which look
 * different in every browser and can't be styled to match the app).
 *
 *   <MonthPicker value="June 2027" onChange={setGrad} />                 // stored as "June 2027"
 *   <DatePicker value="2025-03-01" onChange={setDate} />                 // stored as "YYYY-MM-DD"
 *   <DateTimePicker value="2026-10-20T17:00" onChange={setDue} />        // stored like datetime-local
 *
 * Keyboard: arrow keys move, Page Up/Down change month (or year), Enter
 * picks, Esc closes.
 */

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const SHORT = MONTHS.map((m) => m.slice(0, 3))
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const pad = (n) => String(n).padStart(2, '0')
const toISO = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const parseISO = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '')
  return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null
}
const daysIn = (y, m) => new Date(y, m + 1, 0).getDate()
const today = () => { const t = new Date(); return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() } }

const iconBtn = 'w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.07] disabled:opacity-30 disabled:hover:bg-transparent transition-colors'

// The closed box: looks like the inputs around it, with a calendar icon.
function Trigger({ anchorRef, id, open, setOpen, text, placeholder, className, invalid, ariaLabel, describedBy, onKeyDown, disabled }) {
  return (
    <button
      ref={anchorRef}
      id={id}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={ariaLabel ? `${ariaLabel}${text ? `: ${text}` : ''}` : undefined}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      disabled={disabled}
      onClick={() => setOpen((v) => !v)}
      onKeyDown={onKeyDown}
      className={`relative flex items-center text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 pr-10 ${open ? 'pf-trigger-open' : ''} ${className}`}
    >
      <span className={`block truncate ${text ? '' : 'text-gray-500'}`}>{text || placeholder}</span>
      <Calendar size={16} strokeWidth={2} aria-hidden="true" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
    </button>
  )
}

function Header({ label, onLabel, onPrev, onNext, prevDisabled, nextDisabled, prevLabel, nextLabel }) {
  return (
    <div className="flex items-center gap-1 mb-2">
      <button type="button" className={iconBtn} onClick={onPrev} disabled={prevDisabled} aria-label={prevLabel}>
        <ChevronLeft size={16} strokeWidth={2.25} />
      </button>
      {onLabel ? (
        <button type="button" onClick={onLabel}
          className="flex-1 h-8 rounded-lg text-sm font-semibold text-white hover:bg-white/[0.07] transition-colors">
          {label}
        </button>
      ) : (
        <p className="flex-1 text-center text-sm font-semibold text-white" aria-live="polite">{label}</p>
      )}
      <button type="button" className={iconBtn} onClick={onNext} disabled={nextDisabled} aria-label={nextLabel}>
        <ChevronRight size={16} strokeWidth={2.25} />
      </button>
    </div>
  )
}

// 12-month grid for one year. Shared by MonthPicker and DatePicker's month view.
function MonthGrid({ year, selected, focus, setFocus, onPick, minYear, maxYear, gridRef }) {
  const t = today()
  return (
    <div ref={gridRef} role="grid" aria-label={`Months of ${year}`} className="grid grid-cols-3 gap-1.5">
      {SHORT.map((label, m) => {
        const isSel = selected && selected.y === year && selected.m === m
        const isNow = t.y === year && t.m === m
        const disabled = year < minYear || year > maxYear
        return (
          <button
            key={label}
            type="button"
            role="gridcell"
            data-m={m}
            tabIndex={focus === m ? 0 : -1}
            aria-selected={isSel}
            aria-label={`${MONTHS[m]} ${year}`}
            disabled={disabled}
            onFocus={() => setFocus(m)}
            onClick={() => onPick(year, m)}
            className={`h-10 rounded-lg text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
              isSel ? 'pf-pick' : `text-gray-300 hover:bg-white/[0.07] ${isNow ? 'pf-today' : ''}`
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

/* ── Month + year ─────────────────────────────────────────────────────── */

export const parseMonthYear = (s) => {
  const m = MONTHS.findIndex((name) => (s || '').toLowerCase().startsWith(name.toLowerCase()))
  const y = (s || '').match(/\d{4}/)?.[0]
  return m >= 0 && y ? { y: +y, m } : null
}

export function MonthPicker({
  id, value, onChange, placeholder = 'Choose month and year', className = '', invalid,
  minYear = new Date().getFullYear() - 10, maxYear = new Date().getFullYear() + 8,
  'aria-label': ariaLabel = 'Month and year', 'aria-describedby': describedBy,
}) {
  const { open, setOpen, close, anchorRef, panelRef } = usePopover()
  const selected = parseMonthYear(value)
  const [year, setYear] = useState(selected?.y ?? today().y)
  const [focus, setFocus] = useState(selected?.m ?? today().m)
  const gridRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const s = parseMonthYear(value)
    setYear(s?.y ?? Math.min(Math.max(today().y, minYear), maxYear))
    setFocus(s?.m ?? today().m)
    requestAnimationFrame(() => gridRef.current?.querySelector('[tabindex="0"]')?.focus())
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (open) gridRef.current?.querySelector(`[data-m="${focus}"]`)?.focus() }, [focus, year]) // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (y, m) => { onChange?.(`${MONTHS[m]} ${y}`); close(true) }
  const shiftYear = (d) => setYear((y) => Math.min(maxYear, Math.max(minYear, y + d)))

  const onKeyDown = (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }[e.key]
    if (step) {
      e.preventDefault()
      const n = focus + step
      if (n < 0) { if (year > minYear) { shiftYear(-1); setFocus(n + 12) } }
      else if (n > 11) { if (year < maxYear) { shiftYear(1); setFocus(n - 12) } }
      else setFocus(n)
    } else if (e.key === 'PageUp') { e.preventDefault(); shiftYear(-1) }
    else if (e.key === 'PageDown') { e.preventDefault(); shiftYear(1) }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true) }
  }

  return (
    <>
      <Trigger anchorRef={anchorRef} id={id} open={open} setOpen={setOpen} className={className} invalid={invalid}
        text={selected ? `${MONTHS[selected.m]} ${selected.y}` : ''} placeholder={placeholder}
        ariaLabel={ariaLabel} describedBy={describedBy}
        onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true) } }} />
      <PopoverPanel open={open} anchorRef={anchorRef} panelRef={panelRef} minWidth={264} className="p-3" onKeyDown={onKeyDown} label={ariaLabel}>
        <Header label={String(year)} onPrev={() => shiftYear(-1)} onNext={() => shiftYear(1)}
          prevDisabled={year <= minYear} nextDisabled={year >= maxYear} prevLabel="Previous year" nextLabel="Next year" />
        <MonthGrid year={year} selected={selected} focus={focus} setFocus={setFocus} onPick={pick}
          minYear={minYear} maxYear={maxYear} gridRef={gridRef} />
      </PopoverPanel>
    </>
  )
}

/* ── Single date ──────────────────────────────────────────────────────── */

export const formatDate = (iso) => {
  const p = parseISO(iso)
  return p ? `${SHORT[p.m]} ${p.d}, ${p.y}` : ''
}

export function DatePicker({
  id, value, onChange, placeholder = 'Choose a date', className = '', invalid, clearable = true, disabled = false,
  minYear = 1990, maxYear = new Date().getFullYear() + 10,
  'aria-label': ariaLabel = 'Date', 'aria-describedby': describedBy,
}) {
  const { open, setOpen, close, anchorRef, panelRef } = usePopover()
  const selected = parseISO(value)
  const [view, setView] = useState('days')
  const [cursor, setCursor] = useState(() => selected || today()) // the focused day
  const gridRef = useRef(null)
  const monthGridRef = useRef(null)
  const [monthFocus, setMonthFocus] = useState(cursor.m)

  useEffect(() => {
    if (!open) return
    setView('days')
    setCursor(parseISO(value) || today())
    requestAnimationFrame(() => gridRef.current?.querySelector('[tabindex="0"]')?.focus())
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    if (view === 'days') gridRef.current?.querySelector('[tabindex="0"]')?.focus()
    else monthGridRef.current?.querySelector(`[data-m="${monthFocus}"]`)?.focus()
  }, [cursor, view, monthFocus]) // eslint-disable-line react-hooks/exhaustive-deps

  const weeks = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1).getDay()
    const total = daysIn(cursor.y, cursor.m)
    const cells = Array.from({ length: first }, () => null).concat(Array.from({ length: total }, (_, i) => i + 1))
    while (cells.length % 7) cells.push(null)
    return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7))
  }, [cursor.y, cursor.m])

  const moveDays = (n) => {
    const d = new Date(cursor.y, cursor.m, cursor.d + n)
    if (d.getFullYear() < minYear || d.getFullYear() > maxYear) return
    setCursor({ y: d.getFullYear(), m: d.getMonth(), d: d.getDate() })
  }
  const moveMonths = (n) => {
    const d = new Date(cursor.y, cursor.m + n, 1)
    if (d.getFullYear() < minYear || d.getFullYear() > maxYear) return
    setCursor({ y: d.getFullYear(), m: d.getMonth(), d: Math.min(cursor.d, daysIn(d.getFullYear(), d.getMonth())) })
  }

  const pick = (y, m, d) => { onChange?.(toISO(y, m, d)); close(true) }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (view === 'months') setView('days'); else close(true); return }
    if (view === 'months') {
      const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }[e.key]
      if (step) { e.preventDefault(); setMonthFocus((f) => Math.min(11, Math.max(0, f + step))) }
      else if (e.key === 'PageUp') { e.preventDefault(); setCursor((c) => ({ ...c, y: Math.max(minYear, c.y - 1) })) }
      else if (e.key === 'PageDown') { e.preventDefault(); setCursor((c) => ({ ...c, y: Math.min(maxYear, c.y + 1) })) }
      return
    }
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]
    if (step) { e.preventDefault(); moveDays(step) }
    else if (e.key === 'PageUp') { e.preventDefault(); moveMonths(e.shiftKey ? -12 : -1) }
    else if (e.key === 'PageDown') { e.preventDefault(); moveMonths(e.shiftKey ? 12 : 1) }
    else if (e.key === 'Home') { e.preventDefault(); setCursor((c) => ({ ...c, d: 1 })) }
    else if (e.key === 'End') { e.preventDefault(); setCursor((c) => ({ ...c, d: daysIn(c.y, c.m) })) }
  }

  const t = today()
  const firstOfMonth = new Date(cursor.y, cursor.m, 1)

  return (
    <>
      <Trigger anchorRef={anchorRef} id={id} open={open} setOpen={setOpen} className={className} invalid={invalid}
        text={formatDate(value)} placeholder={placeholder} ariaLabel={ariaLabel} describedBy={describedBy} disabled={disabled}
        onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true) } }} />
      <PopoverPanel open={open} anchorRef={anchorRef} panelRef={panelRef} minWidth={288} className="p-3" onKeyDown={onKeyDown} label={ariaLabel}>
        {view === 'days' ? (
          <>
            <Header
              label={`${MONTHS[cursor.m]} ${cursor.y}`}
              onLabel={() => { setMonthFocus(cursor.m); setView('months') }}
              onPrev={() => moveMonths(-1)} onNext={() => moveMonths(1)}
              prevDisabled={firstOfMonth.getFullYear() <= minYear && cursor.m === 0}
              nextDisabled={firstOfMonth.getFullYear() >= maxYear && cursor.m === 11}
              prevLabel="Previous month" nextLabel="Next month"
            />
            <div ref={gridRef} role="grid" aria-label={`${MONTHS[cursor.m]} ${cursor.y}`}>
              <div role="row" className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((w) => (
                  <span key={w} role="columnheader" className="h-8 flex items-center justify-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">{w}</span>
                ))}
              </div>
              {weeks.map((week, wi) => (
                <div key={wi} role="row" className="grid grid-cols-7 gap-y-0.5">
                  {week.map((d, di) => {
                    if (!d) return <span key={di} role="gridcell" />
                    const isSel = selected && selected.y === cursor.y && selected.m === cursor.m && selected.d === d
                    const isNow = t.y === cursor.y && t.m === cursor.m && t.d === d
                    const isFocus = d === cursor.d
                    return (
                      <button
                        key={di}
                        type="button"
                        role="gridcell"
                        tabIndex={isFocus ? 0 : -1}
                        aria-selected={isSel}
                        aria-current={isNow ? 'date' : undefined}
                        aria-label={`${MONTHS[cursor.m]} ${d}, ${cursor.y}`}
                        onClick={() => pick(cursor.y, cursor.m, d)}
                        onFocus={() => { if (!isFocus) setCursor((c) => ({ ...c, d })) }}
                        className={`mx-auto w-9 h-9 rounded-lg text-sm tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                          isSel ? 'pf-pick' : `text-gray-300 hover:bg-white/[0.07] ${isNow ? 'pf-today' : ''}`
                        }`}
                      >
                        {d}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <button type="button" onClick={() => pick(t.y, t.m, t.d)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-400 hover:bg-white/[0.07] transition-colors">
                Today
              </button>
              {clearable && value && (
                <button type="button" onClick={() => { onChange?.(''); close(true) }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/[0.07] transition-colors">
                  Clear
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <Header label={String(cursor.y)}
              onPrev={() => setCursor((c) => ({ ...c, y: Math.max(minYear, c.y - 1) }))}
              onNext={() => setCursor((c) => ({ ...c, y: Math.min(maxYear, c.y + 1) }))}
              prevDisabled={cursor.y <= minYear} nextDisabled={cursor.y >= maxYear}
              prevLabel="Previous year" nextLabel="Next year" />
            <MonthGrid year={cursor.y} selected={selected} focus={monthFocus} setFocus={setMonthFocus}
              minYear={minYear} maxYear={maxYear} gridRef={monthGridRef}
              onPick={(y, m) => { setCursor({ y, m, d: Math.min(cursor.d, daysIn(y, m)) }); setView('days') }} />
          </>
        )}
      </PopoverPanel>
    </>
  )
}

/* ── Date + time (for deadlines) ──────────────────────────────────────── */

const timeLabel = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  const ap = h < 12 ? 'AM' : 'PM'
  return `${((h + 11) % 12) + 1}:${pad(m)} ${ap}`
}
const TIMES = Array.from({ length: 48 }, (_, i) => `${pad(Math.floor(i / 2))}:${i % 2 ? '30' : '00'}`)

export function DateTimePicker({ id, value, onChange, className = '', invalid, defaultTime = '23:59', 'aria-label': ariaLabel = 'Date and time' }) {
  const [date = '', time = ''] = (value || '').split('T')
  const hhmm = time.slice(0, 5)
  const times = hhmm && !TIMES.includes(hhmm) ? [...TIMES, hhmm].sort() : TIMES
  const withEnd = times.includes('23:59') ? times : [...times, '23:59']
  const set = (d, t) => onChange?.(d ? `${d}T${t || defaultTime}` : '')
  return (
    <div className="grid grid-cols-[1fr_auto] gap-2">
      <DatePicker id={id} value={date} onChange={(d) => set(d, hhmm)} className={className} invalid={invalid}
        clearable={false} minYear={new Date().getFullYear() - 1} aria-label={`${ariaLabel}, date`} />
      <Select value={hhmm} onChange={(t) => set(date || toISO(today().y, today().m, today().d), t)}
        options={withEnd.map((v) => ({ value: v, label: timeLabel(v) }))} placeholder="Time"
        className={`${className} !w-auto min-w-[8.5rem]`} invalid={invalid} aria-label={`${ariaLabel}, time`} />
    </div>
  )
}
