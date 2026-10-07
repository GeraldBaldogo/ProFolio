// Google sign-in, popup style.
//
// Google's script opens its own account picker in a popup and hands back a
// one-time code. The code goes to our backend (POST /auth/google), which
// trades it with Google for the user's verified email. This file only deals
// with the popup — it never sees a password or decides who the user is.

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let loading = null;

export const googleConfigured = () => Boolean(CLIENT_ID);

const isLoaded = () => Boolean(window.google?.accounts?.oauth2);

// Load Google's script ahead of time (call this when the page opens).
// Browsers only allow a popup straight after a click, so the script has to be
// ready before the button is pressed.
export function preloadGoogle() {
  if (!CLIENT_ID) return Promise.resolve(false);
  if (isLoaded()) return Promise.resolve(true);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        loading = null;
        script.remove();
        reject(new Error('Could not reach Google. Check your connection and try again.'));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}

// Opens the Google popup. Resolves with the one-time code, or rejects with a
// friendly message. A closed popup rejects with { cancelled: true } so the
// page can stay quiet instead of showing an error.
export function requestGoogleCode() {
  if (!CLIENT_ID) {
    return Promise.reject(new Error('Google sign-in is not set up yet.'));
  }
  if (!isLoaded()) {
    // Script still loading (slow connection) — start it and ask for one more click.
    preloadGoogle().catch(() => {});
    return Promise.reject(new Error('Google is still loading. Please click the button again.'));
  }

  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: CLIENT_ID,
      scope: 'openid email profile',
      ux_mode: 'popup',
      select_account: true,
      callback: (response) => {
        if (response?.code) resolve(response.code);
        else reject(new Error(response?.error_description || 'Google sign-in was not completed.'));
      },
      error_callback: (err) => {
        if (err?.type === 'popup_closed') {
          const e = new Error('Google sign-in was closed.');
          e.cancelled = true;
          reject(e);
        } else if (err?.type === 'popup_failed_to_open') {
          reject(new Error('Your browser blocked the Google popup. Allow popups for this site and try again.'));
        } else {
          reject(new Error('Google sign-in did not finish. Please try again.'));
        }
      },
    });
    client.requestCode();
  });
}