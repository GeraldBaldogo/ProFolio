// GitHub sign-in, popup style.
//
// GitHub has no ready-made popup script like Google and Facebook, so this
// opens a small window on GitHub's own sign-in page. When the user agrees,
// GitHub sends that window to /github-callback.html (in /public) with a
// one-time code. That page hands the code back to this tab and closes. The
// code then goes to our backend (POST /auth/github), which trades it with
// GitHub using the client secret.
//
// "state" is a random value made for each attempt. A code is only accepted
// if it comes back with the same state — so a code planted by another site
// can't sign anyone in.

const CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID
const CHANNEL = 'profolio-github'
const STATE_KEY = 'profolio-github-state'

export const githubConfigured = () => Boolean(CLIENT_ID)

// Must match one of the callback URLs registered on the GitHub OAuth app.
export const githubRedirectUri = () => `${window.location.origin}/github-callback.html`

const randomState = () => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

// Must be called straight from the click, or the browser blocks the popup.
// Returns the popup window.
export function openGithubPopup() {
  if (!CLIENT_ID) throw new Error('GitHub sign-in is not set up yet.')

  const state = randomState()
  try { sessionStorage.setItem(STATE_KEY, state) } catch { /* private mode — the in-memory copy below still works */ }
  openGithubPopup.pending = state

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: githubRedirectUri(),
    scope: 'read:user user:email',
    state,
    allow_signup: 'true',
  })

  const w = 520
  const h = 680
  const left = Math.max(0, window.screenX + (window.outerWidth - w) / 2)
  const top = Math.max(0, window.screenY + (window.outerHeight - h) / 2)
  const popup = window.open(
    `https://github.com/login/oauth/authorize?${params}`,
    'profolio-github',
    `width=${w},height=${h},left=${left},top=${top}`,
  )
  if (!popup) {
    throw new Error('Your browser blocked the GitHub popup. Allow popups for this site and try again.')
  }
  return popup
}

// Accepts a result only once, and only if its state matches this attempt.
function takeResult(data) {
  if (!data || data.type !== CHANNEL) return null
  let expected = openGithubPopup.pending
  try { expected = expected || sessionStorage.getItem(STATE_KEY) } catch { /* ignore */ }
  if (!expected || data.state !== expected) return null

  openGithubPopup.pending = null
  try { sessionStorage.removeItem(STATE_KEY) } catch { /* ignore */ }
  return data
}

// Listens for the callback page. It can arrive two ways: straight from the
// popup (window.opener), or over a BroadcastChannel — the second still works
// when GitHub's security headers cut the link between the popup and this tab.
// onResult gets { code } or { error }. Returns a function that stops listening.
export function listenForGithub(onResult) {
  const handle = (data) => {
    const result = takeResult(data)
    if (!result) return
    if (result.code) onResult({ code: result.code })
    else if (result.error === 'access_denied') onResult({ cancelled: true })
    else onResult({ error: result.error_description || 'GitHub sign-in did not finish. Please try again.' })
  }

  const onMessage = (e) => { if (e.origin === window.location.origin) handle(e.data) }
  window.addEventListener('message', onMessage)

  let channel = null
  if ('BroadcastChannel' in window) {
    channel = new BroadcastChannel(CHANNEL)
    channel.onmessage = (e) => handle(e.data)
  }

  return () => {
    window.removeEventListener('message', onMessage)
    channel?.close()
  }
}