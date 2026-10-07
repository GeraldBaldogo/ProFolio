import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub, faGoogle, faFacebook } from '@fortawesome/free-brands-svg-icons'
import api from '../services/api'
import { googleConfigured, preloadGoogle, requestGoogleCode } from '../services/google.service'
import { facebookConfigured, preloadFacebook, requestFacebookToken } from '../services/facebook.service'

// The "or continue with" buttons on the Login and Register pages.
//
// Each working provider opens its own popup, gets something back (a code or a
// token), and sends it to our backend, which checks it with the provider and
// replies exactly like email login does. A provider whose ID isn't set in the
// .env shows as switched off, so nobody clicks a button that does nothing.
//
// Props
//   intent    – 'login' (existing accounts only) or 'register' (new accounts only)
//   role      – only used when the provider makes a NEW account ('student' | 'evaluator')
//   disabled  – true while the page's own form is submitting
//   onSuccess – gets the backend's reply: { user, token } or { pending, message }
//   onError   – gets a message to show in the page's error box
//   gap       – Tailwind gap class, so each page keeps its own spacing
//   textSize  – Tailwind text size for the labels

const PROVIDERS = [
  {
    key: 'google',
    label: 'Google',
    icon: faGoogle,
    iconColor: '#EA4335',
    ready: googleConfigured(),
    preload: preloadGoogle,
    // returns the body for our backend
    getCredential: async () => ({ code: await requestGoogleCode() }),
    endpoint: '/auth/google',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: faFacebook,
    iconColor: '#1877F2',
    ready: facebookConfigured(),
    preload: preloadFacebook,
    getCredential: async () => ({ accessToken: await requestFacebookToken() }),
    endpoint: '/auth/facebook',
  },
  {
    key: 'github',
    label: 'GitHub',
    icon: faGithub,
    iconColor: '#ffffff',
    ready: false,
    soon: true,
  },
]

const baseBtn =
  'flex items-center justify-center gap-2 border border-white/10 bg-white/[0.03] text-gray-300 py-3 rounded-xl font-semibold transition-all'

const SocialSignIn = ({ intent, role, disabled = false, onSuccess, onError, gap = 'gap-3', textSize = 'text-[14px]' }) => {
  const [busy, setBusy] = useState(null) // key of the provider in progress
  const alive = useRef(true)

  // Load each provider's script early: popups are only allowed right after a
  // click, so the script must already be there when the button is pressed.
  useEffect(() => {
    alive.current = true
    PROVIDERS.forEach((p) => { if (p.ready) p.preload().catch(() => {}) })
    return () => { alive.current = false }
  }, [])

  const handleClick = async (p) => {
    if (busy || disabled || !p.ready) return
    onError?.('')
    setBusy(p.key)
    try {
      // getCredential opens the popup straight away, still inside the click.
      const credential = await p.getCredential()
      const res = await api.post(p.endpoint, { ...credential, role, intent })
      if (alive.current) onSuccess?.(res.data.data)
    } catch (err) {
      if (!alive.current || err?.cancelled) return
      onError?.(err.response?.data?.message || err.message || `${p.label} sign-in failed. Please try again.`)
    } finally {
      if (alive.current) setBusy(null)
    }
  }

  return (
    <div className={`grid grid-cols-3 ${gap}`}>
      {PROVIDERS.map((p) => {
        const off = !p.ready || disabled || Boolean(busy)
        const title = p.soon
          ? `${p.label} sign-in is coming soon`
          : p.ready ? `Continue with ${p.label}` : `${p.label} sign-in is not set up yet`
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => handleClick(p)}
            disabled={off}
            aria-label={p.ready ? `Continue with ${p.label}` : title}
            title={title}
            className={`${baseBtn} ${textSize} ${
              !p.ready
                ? 'opacity-40 cursor-not-allowed'
                : off
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:border-white/25 hover:bg-white/[0.07] hover:text-white'
            }`}
          >
            {busy === p.key ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FontAwesomeIcon icon={p.icon} className="text-base" style={{ color: p.iconColor }} />
            )}
            <span className="hidden sm:inline lg:hidden xl:inline">{p.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default SocialSignIn