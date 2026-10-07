import { useEffect, useState } from 'react'

/*
 * Backup for public/github-callback.html.
 *
 * GitHub sends the sign-in popup to /github-callback.html. Normally the
 * static file in /public answers that. If the file is missing (or a host
 * sends every address to the React app), this page answers instead and does
 * exactly the same thing: hand the code back to the ProFolio tab that opened
 * the popup, then close.
 */
export default function GithubCallback() {
  const [text, setText] = useState('Finishing GitHub sign-in…')

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const data = {
      type: 'profolio-github',
      code: q.get('code'),
      state: q.get('state'),
      error: q.get('error'),
      error_description: q.get('error_description'),
    }

    // Keep the code out of the address bar and history.
    try { window.history.replaceState(null, '', window.location.pathname) } catch { /* ignore */ }

    try {
      if (window.opener && !window.opener.closed) window.opener.postMessage(data, window.location.origin)
    } catch { /* ignore */ }
    try {
      const bc = new BroadcastChannel('profolio-github')
      bc.postMessage(data)
      bc.close()
    } catch { /* ignore */ }

    setText(data.code
      ? 'Signed in with GitHub. You can close this window.'
      : 'GitHub sign-in was cancelled. You can close this window.')
    const t = setTimeout(() => window.close(), 150)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <p className="text-gray-400 text-[15px] max-w-xs">{text}</p>
    </div>
  )
}