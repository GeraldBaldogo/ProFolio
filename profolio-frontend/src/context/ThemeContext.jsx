import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export const ACCENTS = [
  { key: 'blue', label: 'Blue', swatch: '#60a5fa' },
  { key: 'green', label: 'Green', swatch: '#34d399' },
  { key: 'violet', label: 'Violet', swatch: '#a78bfa' },
  { key: 'orange', label: 'Orange', swatch: '#fb923c' },
  { key: 'rose', label: 'Rose', swatch: '#fb7185' },
  { key: 'amber', label: 'Amber', swatch: '#fbbf24' },
]

export const MODES = [
  { key: 'dark', label: 'Dark', hint: 'Light text on a dark page' },
  { key: 'light', label: 'Light', hint: 'Dark text on a white page' },
]

const STORAGE_KEY = 'profolio-theme'

const read = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved?.mode) return { accent: saved.accent || 'blue', mode: saved.mode }

    // No choice made yet — follow whatever the person has set on their device
    // rather than assuming. Someone browsing at night has usually already told
    // their operating system.
    const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches
    return { accent: saved?.accent || 'blue', mode: prefersLight ? 'light' : 'dark' }
  } catch {
    // A corrupted value shouldn't stop the app loading.
    return { accent: 'blue', mode: 'dark' }
  }
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(read)

  // The attributes go on <html>, so the CSS variables in index.css cascade to
  // everything — including anything rendered in a portal outside the app root.
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-accent', theme.accent)
    root.setAttribute('data-theme', theme.mode)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme))
    } catch {
      // Private browsing can block writes. The theme still applies for this
      // session; it just won't be remembered.
    }
  }, [theme])

  const setAccent = (accent) => setTheme(t => ({ ...t, accent }))
  const setMode = (mode) => setTheme(t => ({ ...t, mode }))
  const toggleMode = () => setTheme(t => ({ ...t, mode: t.mode === 'dark' ? 'light' : 'dark' }))

  return (
    <ThemeContext.Provider value={{ ...theme, setAccent, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}