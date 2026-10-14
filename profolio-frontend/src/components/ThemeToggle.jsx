import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

/*
 * A single sun/moon button for pages that have no sidebar — the public pages,
 * profile setup and the assessment start screens. Same saved choice as the
 * sidebar switch.
 */
const ThemeToggle = ({ className = '' }) => {
  const { mode, toggleMode } = useTheme()
  const label = mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={label}
      title={label}
      className={`w-9 h-9 flex-shrink-0 border border-white/8 bg-white/[0.03] rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all ${className}`}
    >
      {mode === 'dark' ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
    </button>
  )
}

export default ThemeToggle