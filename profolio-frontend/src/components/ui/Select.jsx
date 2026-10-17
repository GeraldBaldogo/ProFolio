import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { usePopover, PopoverPanel } from './Popover'

/*
 * ProFolio's dropdown. Replaces the browser's <select>, whose open list is
 * drawn by the operating system (white with a blue highlight on Windows, a
 * wheel on iPhone) and can't be styled to match the app.
 *
 *   <Select value={v} onChange={setV} options={['1st Year', '2nd Year']} placeholder="Choose…" />
 *   <Select value={v} onChange={setV} options={[{ value: 'student', label: 'Student' }]} />
 *
 * `className` styles the closed box, so it can match the inputs beside it.
 * Keyboard: ↑ ↓ to move, Enter or Space to pick, Esc to close, type a letter
 * to jump.
 */
const norm = (o) => (typeof o === 'object' && o !== null ? o : { value: o, label: String(o) })

export default function Select({
  id, value, onChange, options = [], placeholder = 'Choose…', className = '',
  invalid = false, disabled = false, small = false, 'aria-label': ariaLabel, 'aria-describedby': describedBy,
}) {
  const items = options.map(norm)
  const { open, setOpen, close, anchorRef, panelRef } = usePopover()
  const listId = useId()
  const selectedIndex = items.findIndex((o) => o.value === value)
  const [active, setActive] = useState(-1)
  const listRef = useRef(null)
  const typed = useRef({ text: '', at: 0 })

  // Highlight the chosen item (or the first) in the same step as opening, so
  // an arrow key pressed straight after Enter moves from the right place.
  const openList = () => { setActive(selectedIndex >= 0 ? selectedIndex : 0); setOpen(true) }

  useEffect(() => {
    if (!open || active < 0) return
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const pick = (i) => {
    const o = items[i]
    if (!o || o.disabled) return
    onChange?.(o.value)
    close(true)
  }

  const move = (delta) => {
    if (!items.length) return
    let i = active
    for (let n = 0; n < items.length; n++) {
      i = (i + delta + items.length) % items.length
      if (!items[i].disabled) break
    }
    setActive(i)
  }

  const onKeyDown = (e) => {
    if (disabled) return
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); openList() }
      return
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0) }
    else if (e.key === 'End') { e.preventDefault(); setActive(items.length - 1) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(active) }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true) }
    else if (e.key === 'Tab') { close() }
    else if (e.key.length === 1 && /\S/.test(e.key)) {
      const now = Date.now()
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : '') + e.key.toLowerCase(), at: now }
      const i = items.findIndex((o) => o.label.toLowerCase().startsWith(typed.current.text))
      if (i >= 0) setActive(i)
    }
  }

  const current = items[selectedIndex]
  const iconSize = small ? 14 : 16

  return (
    <>
      <button
        ref={anchorRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={`relative flex items-center text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${small ? 'pr-7' : 'pr-10'} ${open ? 'pf-trigger-open' : ''} ${className}`}
      >
        <span className={`block truncate ${current ? '' : 'text-gray-500'}`}>{current ? current.label : placeholder}</span>
        <ChevronDown
          size={iconSize}
          strokeWidth={2}
          aria-hidden="true"
          className={`absolute ${small ? 'right-2' : 'right-3.5'} top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <PopoverPanel open={open} anchorRef={anchorRef} panelRef={panelRef} minWidth={small ? 140 : 0} className="p-1" label={ariaLabel}>
        <ul ref={listRef} id={listId} role="listbox" aria-label={ariaLabel} className="max-h-64 overflow-y-auto overscroll-contain">
          {items.map((o, i) => {
            const selected = i === selectedIndex
            const isActive = i === active
            return (
              <li
                key={String(o.value)}
                id={`${listId}-${i}`}
                data-index={i}
                role="option"
                aria-selected={selected}
                aria-disabled={o.disabled || undefined}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer select-none ${
                  o.disabled ? 'opacity-40 cursor-not-allowed'
                  : isActive ? 'pf-hover text-white' : 'text-gray-300'
                } ${selected ? 'font-semibold' : ''}`}
              >
                <span className="flex-1 truncate">{o.label}</span>
                {selected && <Check size={15} strokeWidth={2.5} className="text-blue-400 flex-shrink-0" aria-hidden="true" />}
              </li>
            )
          })}
        </ul>
      </PopoverPanel>
    </>
  )
}
