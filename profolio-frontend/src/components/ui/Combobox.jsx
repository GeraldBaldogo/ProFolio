import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { usePopover, PopoverPanel } from './Popover'

/*
 * A text box with suggestions, in place of <input list> + <datalist> (whose
 * suggestion box is drawn by the browser and looks different everywhere).
 * Anything can still be typed; the list only helps.
 *
 *   <Combobox value={course} onChange={setCourse} options={COURSES} placeholder="e.g. BS Computer Science" />
 */
export default function Combobox({
  id, value = '', onChange, options = [], placeholder = '', className = '', invalid,
  'aria-label': ariaLabel, 'aria-describedby': describedBy, autoComplete = 'off',
}) {
  const { open, setOpen, close, anchorRef, panelRef } = usePopover()
  const inputRef = useRef(null)
  const listId = useId()
  const [active, setActive] = useState(-1)
  const [filtering, setFiltering] = useState(false)

  const q = value.trim().toLowerCase()
  const shown = filtering && q ? options.filter((o) => o.toLowerCase().includes(q)) : options
  const visible = open && shown.length > 0

  useEffect(() => { if (!open) { setActive(-1); setFiltering(false) } }, [open])

  // Focus never left the input (mousedown is prevented on the list), so
  // there's no need to refocus it — doing so would reopen the list.
  const pick = (o) => { onChange?.(o); close() }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) { setOpen(true); setActive(0); return }
      setActive((a) => Math.min(shown.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    } else if (e.key === 'Enter' && visible && active >= 0) {
      e.preventDefault(); pick(shown[active])
    } else if (e.key === 'Escape' && open) {
      e.preventDefault(); e.stopPropagation(); close()
    } else if (e.key === 'Tab') close()
  }

  return (
    <>
      <div ref={anchorRef} className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={visible}
          aria-controls={visible ? listId : undefined}
          aria-activedescendant={visible && active >= 0 ? `${listId}-${active}` : undefined}
          aria-label={ariaLabel}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          autoComplete={autoComplete}
          value={value}
          placeholder={placeholder}
          onChange={(e) => { onChange?.(e.target.value); setFiltering(true); setOpen(true); setActive(-1) }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={`pr-10 ${open && shown.length ? 'pf-trigger-open' : ''} ${className}`}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? 'Hide suggestions' : 'Show suggestions'}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => { setFiltering(false); setOpen((v) => !v); inputRef.current?.focus() }}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white"
        >
          <ChevronDown size={16} strokeWidth={2} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <PopoverPanel open={visible} anchorRef={anchorRef} panelRef={panelRef} className="p-1" label={ariaLabel}>
        <ul id={listId} role="listbox" aria-label={ariaLabel} className="max-h-64 overflow-y-auto overscroll-contain">
          {shown.map((o, i) => {
            const selected = o === value
            return (
              <li
                key={o}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(o)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer select-none ${
                  i === active ? 'pf-hover text-white' : 'text-gray-300'
                } ${selected ? 'font-semibold' : ''}`}
              >
                <span className="flex-1">{o}</span>
                {selected && <Check size={15} strokeWidth={2.5} className="text-blue-400 flex-shrink-0" aria-hidden="true" />}
              </li>
            )
          })}
        </ul>
      </PopoverPanel>
    </>
  )
}
