import { useState, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPalette, faCheck, faSun, faMoon } from '@fortawesome/free-solid-svg-icons'
import { useTheme, ACCENTS, MODES } from '../context/ThemeContext'

/**
 * Drop into any page header:
 *
 *   import ThemePicker from '../../components/ThemePicker'
 *   <ThemePicker />
 *
 * Shows a sun/moon button that flips light and dark in one click, plus a menu
 * for the accent colour. Most people only ever want the toggle, so it doesn't
 * hide behind the menu.
 */
const ThemePicker = () => {
  const { accent, mode, setAccent, setMode, toggleMode } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="flex items-center gap-2" ref={ref}>

      {/* One click, no menu — this is the switch people actually use. */}
      <button
        onClick={toggleMode}
        aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="w-9 h-9 border border-white/8 bg-white/[0.03] rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all"
      >
        <FontAwesomeIcon icon={mode === 'dark' ? faSun : faMoon} className="text-sm" />
      </button>

      <div className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          aria-label="Change accent colour"
          aria-expanded={open}
          className="w-9 h-9 border border-white/8 bg-white/[0.03] rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all"
        >
          <FontAwesomeIcon icon={faPalette} className="text-sm" />
        </button>

        {open && (
          <div className="absolute right-0 top-11 z-50 w-56 bg-[#0a0a18] border border-white/8 rounded-2xl shadow-2xl overflow-hidden">

            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2.5">Appearance</p>
              <div className="grid grid-cols-2 gap-2">
                {MODES.map(m => (
                  <button
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    aria-pressed={mode === m.key}
                    title={m.hint}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      mode === m.key
                        ? 'border-blue-500/30 bg-blue-500/10 text-white'
                        : 'border-white/8 text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <FontAwesomeIcon icon={m.key === 'light' ? faSun : faMoon} className="text-[11px]" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 py-3">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2.5">Accent colour</p>
              <div className="grid grid-cols-6 gap-2">
                {ACCENTS.map(a => (
                  <button
                    key={a.key}
                    onClick={() => setAccent(a.key)}
                    aria-label={a.label}
                    aria-pressed={accent === a.key}
                    title={a.label}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      accent === a.key ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-[#0a0a18]' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: a.swatch }}
                  >
                    {accent === a.key && (
                      <FontAwesomeIcon icon={faCheck} className="text-[10px] text-black/70" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <p className="px-4 py-2.5 text-gray-600 text-[11px] border-t border-white/5">
              Saved on this device.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ThemePicker