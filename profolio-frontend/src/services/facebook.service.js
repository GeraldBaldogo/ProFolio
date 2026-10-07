// Facebook sign-in, popup style.
//
// Facebook's own script opens its login popup and hands back an access
// token. The token goes to our backend (POST /auth/facebook), which checks
// with Facebook that it is real and was made for THIS app before reading the
// user's name and email. This file only deals with the popup.

const SDK_SRC = 'https://connect.facebook.net/en_US/sdk.js';
const APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;
const GRAPH_VERSION = 'v26.0';

let loading = null;

export const facebookConfigured = () => Boolean(APP_ID);

const isLoaded = () => Boolean(window.FB?.login);

// Load Facebook's script ahead of time (call this when the page opens).
// Browsers only allow a popup straight after a click, so the script has to be
// ready before the button is pressed.
export function preloadFacebook() {
  if (!APP_ID) return Promise.resolve(false);
  if (isLoaded()) return Promise.resolve(true);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      window.fbAsyncInit = () => {
        window.FB.init({ appId: APP_ID, cookie: false, xfbml: false, version: GRAPH_VERSION });
        resolve(true);
      };
      const script = document.createElement('script');
      script.src = SDK_SRC;
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.onerror = () => {
        loading = null;
        script.remove();
        reject(new Error('Could not reach Facebook. Check your connection, or turn off an ad blocker for this site.'));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}

// Opens the Facebook popup. Resolves with the access token, or rejects with a
// friendly message. Closing the popup rejects with { cancelled: true } so the
// page can stay quiet instead of showing an error.
export function requestFacebookToken() {
  if (!APP_ID) {
    return Promise.reject(new Error('Facebook sign-in is not set up yet.'));
  }
  if (!isLoaded()) {
    preloadFacebook().catch(() => {});
    return Promise.reject(new Error('Facebook is still loading. Please click the button again.'));
  }

  return new Promise((resolve, reject) => {
    window.FB.login(
      (response) => {
        const token = response?.authResponse?.accessToken;
        if (response?.status === 'connected' && token) {
          resolve(token);
        } else {
          const e = new Error('Facebook sign-in was closed.');
          e.cancelled = true;
          reject(e);
        }
      },
      // 'rerequest' asks for email again if they turned it off last time.
      { scope: 'public_profile,email', auth_type: 'rerequest' },
    );
  });
}