import { useState, useEffect, useRef } from 'react'

/**
 * An on-screen keyboard for the typing assessment.
 *
 *   - The key for the NEXT character glows, with the correct Shift key lit
 *     alongside it when a capital or symbol is needed.
 *   - The key actually pressed flashes green if it was right, red if not.
 *
 * Purely visual. It listens to keydown on the window and never calls
 * preventDefault, so it cannot interfere with the textarea, the paste blocking
 * or the proctoring hooks. It reveals nothing the passage above doesn't already
 * show — the next character is on screen either way.
 */

// Width in key units. Every row adds up to 15 so the edges line up.
const ROWS = [
  [['`', '~'], ['1', '!'], ['2', '@'], ['3', '#'], ['4', '$'], ['5', '%'], ['6', '^'],
   ['7', '&'], ['8', '*'], ['9', '('], ['0', ')'], ['-', '_'], ['=', '+'],
   { id: 'Backspace', label: 'Backspace', w: 2 }],
  [{ id: 'Tab', label: 'Tab', w: 1.5 }, 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p',
   ['[', '{'], [']', '}'], { id: '\\', label: '\\', sub: '|', w: 1.5 }],
  [{ id: 'Caps', label: 'Caps', w: 1.75 }, 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l',
   [';', ':'], ["'", '"'], { id: 'Enter', label: 'Enter', w: 2.25 }],
  [{ id: 'ShiftL', label: 'Shift', w: 2.25 }, 'z', 'x', 'c', 'v', 'b', 'n', 'm',
   [',', '<'], ['.', '>'], ['/', '?'], { id: 'ShiftR', label: 'Shift', w: 2.75 }],
  [{ spacer: true, w: 4.375 }, { id: 'Space', label: '', w: 6.25 }, { spacer: true, w: 4.375 }],
]

// Shifted character → the key that produces it.
const SHIFTED = {
  '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7',
  '*': '8', '(': '9', ')': '0', '_': '-', '+': '=', '{': '[', '}': ']', '|': '\\',
  ':': ';', '"': "'", '<': ',', '>': '.', '?': '/',
}

// Touch typists press Shift with the opposite hand, so a capital on the left
// side of the keyboard lights the right Shift and vice versa.
const LEFT_HAND = new Set('`12345qwertasdfgzxcvb'.split(''))

// Straight and curly quotes both map to the apostrophe key — passages pasted
// from a word processor often carry the curly kind.
const normalise = (ch) => {
  if (ch === '\u2018' || ch === '\u2019') return "'"
  if (ch === '\u201C' || ch === '\u201D') return '"'
  return ch
}

const resolve = (raw) => {
  if (!raw) return null
  const ch = normalise(raw)
  if (ch === ' ') return { key: 'Space', shift: null }
  if (ch === '\n') return { key: 'Enter', shift: null }
  if (/[A-Z]/.test(ch)) {
    const base = ch.toLowerCase()
    return { key: base, shift: LEFT_HAND.has(base) ? 'ShiftR' : 'ShiftL' }
  }
  if (SHIFTED[ch]) {
    const base = SHIFTED[ch]
    return { key: base, shift: LEFT_HAND.has(base) ? 'ShiftR' : 'ShiftL' }
  }
  return { key: ch.toLowerCase(), shift: null }
}

// Turns a keydown event into the id of the key that was physically pressed.
const keyIdFromEvent = (e) => {
  if (e.key === 'Backspace') return 'Backspace'
  if (e.key === 'Tab') return 'Tab'
  if (e.key === 'Enter') return 'Enter'
  if (e.key === 'CapsLock') return 'Caps'
  if (e.key === 'Shift') return e.code === 'ShiftRight' ? 'ShiftR' : 'ShiftL'
  if (e.key.length !== 1) return null
  return resolve(e.key)?.key || null
}

const STORAGE_KEY = 'profolio-show-keyboard'

const KeyboardVisualizer = ({ nextChar, active = true }) => {
  const [visible, setVisible] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) !== 'off' } catch { return true }
  })
  const [flash, setFlash] = useState(null) // { id, ok }
  const flashTimer = useRef(null)
  // Read inside the keydown handler, which would otherwise see a stale value.
  const nextRef = useRef(nextChar)
  nextRef.current = nextChar

  useEffect(() => {
    if (!active || !visible) return

    const onKeyDown = (e) => {
      const id = keyIdFromEvent(e)
      if (!id) return

      // Correctness only means something for character keys. Backspace, Shift
      // and friends flash in a neutral colour.
      const expected = nextRef.current
      const isChar = e.key.length === 1
      const ok = isChar && expected != null
        ? normalise(e.key) === normalise(expected)
        : null

      setFlash({ id, ok })
      clearTimeout(flashTimer.current)
      flashTimer.current = setTimeout(() => setFlash(null), 180)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      clearTimeout(flashTimer.current)
    }
  }, [active, visible])

  const toggle = () => {
    setVisible(v => {
      const next = !v
      try { localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off') } catch { /* private mode */ }
      return next
    })
  }

  const target = active ? resolve(nextChar) : null

  const keyClass = (id) => {
    if (flash?.id === id) {
      if (flash.ok === true)  return 'bg-emerald-500 border-emerald-400 text-white scale-95'
      if (flash.ok === false) return 'bg-rose-500 border-rose-400 text-white scale-95'
      return 'bg-white/20 border-white/30 text-white scale-95'
    }
    if (target?.key === id) {
      return 'bg-blue-500 border-blue-400 text-white shadow-[0_0_0_3px_rgba(59,130,246,0.28)]'
    }
    if (target?.shift === id) {
      return 'bg-blue-500/35 border-blue-400/60 text-white'
    }
    return 'bg-white/[0.03] border-white/8 text-gray-500'
  }

  return (
    // Hidden below sm: a phone has no physical keyboard to mirror, and fifteen
    // key-widths don't fit a 375px screen anyway.
    <div className="hidden sm:block mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          {visible && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Next key
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Correct
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Mistake
              </span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={toggle}
          // tabIndex -1 keeps Tab inside the textarea rather than landing here.
          tabIndex={-1}
          className="text-[11px] text-gray-500 hover:text-white transition-colors"
        >
          {visible ? 'Hide keyboard' : 'Show keyboard'}
        </button>
      </div>

      {visible && (
        <div
          aria-hidden="true"
          className="border border-white/8 bg-white/[0.02] rounded-2xl p-3 flex flex-col gap-1.5 select-none"
        >
          {ROWS.map((row, r) => (
            <div key={r} className="flex gap-1.5">
              {row.map((k, i) => {
                if (k.spacer) return <div key={`s${i}`} style={{ flex: k.w }} />

                let id, label, sub, w = 1
                if (typeof k === 'string') { id = k; label = k.toUpperCase() }
                else if (Array.isArray(k)) { id = k[0]; label = k[0]; sub = k[1] }
                else { id = k.id; label = k.label; sub = k.sub; w = k.w || 1 }

                // Home-row bumps on F and J, as on a real keyboard.
                const bump = id === 'f' || id === 'j'

                return (
                  <div
                    key={id}
                    style={{ flex: w }}
                    className={`relative h-9 rounded-md border flex flex-col items-center justify-center font-mono leading-none transition-all duration-100 motion-reduce:transition-none ${keyClass(id)}`}
                  >
                    {sub && <span className="text-[8px] opacity-60 mb-0.5">{sub}</span>}
                    <span className={label.length > 1 ? 'text-[10px]' : 'text-[11px]'}>{label}</span>
                    {bump && <span className="absolute bottom-1 w-2 h-px rounded-full bg-current opacity-60" />}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default KeyboardVisualizer