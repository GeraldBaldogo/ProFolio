import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGlobe, faCopy, faCheck, faArrowUpRightFromSquare, faRotate, faSpinner, faLock,
} from '@fortawesome/free-solid-svg-icons'
import { getShowcaseSettings, updateShowcase, resetShowcaseLink, showcaseUrl } from '../services/showcase.service'

/*
 * The student's switch for their public portfolio page (/p/<slug>).
 * Off by default. When on: the link, a copy button, whether to show the
 * email, and a way to replace the link if it ended up somewhere unwanted.
 */

const Switch = ({ on, disabled, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!on)}
    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${on ? 'bg-emerald-500' : 'bg-white/15'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
  </button>
)

export default function ShareShowcaseCard() {
  const [settings, setSettings] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getShowcaseSettings().then(setSettings).catch((e) => setError(e.message))
  }, [])

  const run = async (fn) => {
    setBusy(true)
    setError('')
    try { setSettings(await fn()) }
    catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  const url = settings?.slug ? showcaseUrl(settings.slug) : ''

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Older browsers / insecure origins: select the text for a manual copy
      const el = document.getElementById('showcase-url')
      el?.select()
      document.execCommand?.('copy')
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const reset = () => {
    if (!window.confirm('Make a new link? The current one will stop working straight away, for anyone you already sent it to.')) return
    run(resetShowcaseLink)
  }

  return (
    <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${settings?.enabled ? 'bg-emerald-500/15' : 'bg-white/5'}`}>
          <FontAwesomeIcon icon={settings?.enabled ? faGlobe : faLock} className={settings?.enabled ? 'text-emerald-400' : 'text-gray-500'} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white font-bold text-sm">Share your portfolio</p>
          <p className="text-gray-400 text-xs mt-1 leading-relaxed">
            {settings?.enabled
              ? 'Anyone with the link can see your projects, skills and verified performance — no sign-in needed. Your contact number is never shown.'
              : 'Turn this on to get a public link for your résumé, LinkedIn or a job application. Only people you give it to will find it.'}
          </p>
        </div>
        {settings ? (
          <Switch on={settings.enabled} disabled={busy} label="Public portfolio page"
            onChange={(enabled) => run(() => updateShowcase({ enabled }))} />
        ) : !error && (
          <FontAwesomeIcon icon={faSpinner} className="text-gray-500 animate-spin mt-1" />
        )}
      </div>

      {settings?.enabled && url && (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="showcase-url"
              readOnly
              value={url}
              onFocus={(e) => e.target.select()}
              className="flex-1 min-w-0 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-gray-200 text-xs sm:text-sm font-mono outline-none"
            />
            <div className="flex gap-2">
              <button type="button" onClick={copy}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
                <FontAwesomeIcon icon={copied ? faCheck : faCopy} /> {copied ? 'Copied' : 'Copy link'}
              </button>
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-xs" /> Open
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-gray-300 text-xs sm:text-sm">
              <input type="checkbox" checked={settings.show_email} disabled={busy}
                onChange={(e) => run(() => updateShowcase({ show_email: e.target.checked }))}
                className="accent-emerald-500 w-4 h-4" />
              Show my email so employers can contact me
            </label>
            <button type="button" onClick={reset} disabled={busy}
              className="sm:ml-auto self-start flex items-center gap-1.5 text-gray-500 hover:text-white text-xs font-medium transition-colors disabled:opacity-50">
              <FontAwesomeIcon icon={faRotate} /> Get a new link
            </button>
          </div>

          <p className="text-gray-600 text-[11px] leading-relaxed">
            The page shows what&apos;s on your latest CV — regenerate it in the CV Builder to update your verified
            performance. Items you left off your CV stay off this page too.
          </p>
        </div>
      )}

      {error && <p className="text-rose-400 text-xs mt-3">{error}</p>}
    </div>
  )
}