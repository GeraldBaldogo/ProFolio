import { Sun, Moon } from 'lucide-react'
import { useTheme, ACCENTS } from '../context/ThemeContext'

/*
 * Light/dark switch and accent colour, for the bottom of every sidebar.
 *
 * The sidebar is on every signed-in page, so this is the one place to look
 * for it — no matter which page you're on or which role you have. The choice
 * is saved on this device and applies to the whole app straight away.
 */
const SidebarTheme = () => {
  const { mode, accent, setMode, setAccent } = useTheme()

  return (
    <div className="px-3 pb-3 mb-3 border-b border-white/5">
      <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-2">Appearance</p>

      <div role="radiogroup" aria-label="Appearance" className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
        {[
          { key: 'light', label: 'Light', Icon: Sun },
          { key: 'dark', label: 'Dark', Icon: Moon },
        ].map(({ key, label, Icon }) => {
          const on = mode === key
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setMode(key)}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                on ? 'bg-blue-500/15 text-white border border-blue-500/25' : 'text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              <Icon size={13} strokeWidth={2} />
              {label}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between mt-2.5 px-0.5" role="radiogroup" aria-label="Accent colour">
        {ACCENTS.map((a) => {
          const on = accent === a.key
          return (
            <button
              key={a.key}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${a.label} accent`}
              title={a.label}
              onClick={() => setAccent(a.key)}
              className={`w-5 h-5 rounded-full transition-transform ${on ? '' : 'hover:scale-110'}`}
              style={{
                backgroundColor: a.swatch,
                // A ring in the sidebar's own colour, then one in the swatch's,
                // so the chosen colour reads in both light and dark mode.
                boxShadow: on ? `0 0 0 2px var(--app-surface, #0a0a18), 0 0 0 4px ${a.swatch}` : 'none',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

export default SidebarTheme
