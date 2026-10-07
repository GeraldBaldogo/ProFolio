const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const userRepo = require('../repositories/user.repo');
const supabase = require('../config/db');

// Only these two can be self-selected at sign-up. Admin accounts are made by
// hand in the database — never through a public endpoint.
const SELF_SIGNUP_ROLES = ['student', 'evaluator'];

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const publicUser = (user) => ({
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  role: user.role,
});

const PENDING_MESSAGE = 'Your professor account is waiting for admin approval.';

// Shared by email sign-up and Google sign-up, so both make the same account:
// a users row plus the matching profile row, professors held for approval.
const createAccount = async ({ full_name, email, password_hash, role }) => {
  const isProfessor = role === 'evaluator';

  const user = await userRepo.create({
    full_name,
    email,
    password_hash,
    role,
    is_approved: !isProfessor,
  });

  if (role === 'student') {
    await supabase.from('student_profiles').insert({ user_id: user.id });
  } else {
    await supabase.from('professor_profiles').insert({ user_id: user.id });
  }

  return user;
};

// One place that decides whether an existing account may sign in.
const assertCanSignIn = (user) => {
  if (user.is_active === false) {
    throw { status: 403, message: 'This account has been deactivated. Please contact the administrator.' };
  }
  if (user.role === 'evaluator' && user.is_approved === false) {
    throw { status: 403, message: 'Your professor account is still waiting for approval.' };
  }
};

const register = async ({ full_name, email, password, role = 'student' }) => {
  if (!SELF_SIGNUP_ROLES.includes(role)) {
    throw { status: 400, message: 'Invalid account type' };
  }

  const existing = await userRepo.findByEmail(email);
  if (existing) throw { status: 400, message: 'Email already in use' };

  const password_hash = await bcrypt.hash(password.toString(), 10);
  const user = await createAccount({ full_name, email, password_hash, role });

  // No token for an unapproved professor — the account exists but can't be used.
  if (role === 'evaluator') {
    return { pending: true, user: publicUser(user), message: PENDING_MESSAGE };
  }

  return { user: publicUser(user), token: signToken(user) };
};

const login = async ({ email, password }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) throw { status: 401, message: 'Invalid email or password' };

  const valid = await bcrypt.compare(password.toString(), user.password_hash);
  if (!valid) throw { status: 401, message: 'Invalid email or password' };

  // Checked after the password, so this can't be used to guess which emails exist.
  assertCanSignIn(user);

  return { user: publicUser(user), token: signToken(user) };
};

// ─── Google sign-in ─────────────────────────────────────────────────────────
// The browser opens Google's popup and gets back a one-time "code". The code
// is sent here, and the server trades it with Google (using the client
// secret, which never leaves the server) for an ID token. That token is
// signed by Google and is checked to be for THIS app before anything in it
// is trusted. The browser never tells us who the user is — Google does.

let googleClient = null;
const getGoogleClient = () => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw { status: 503, message: 'Google sign-in is not set up on the server yet.' };
  }
  // 'postmessage' is the redirect URI Google expects for popup sign-in.
  if (!googleClient) googleClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, 'postmessage');
  return googleClient;
};

const verifyGoogleCode = async (code) => {
  if (typeof code !== 'string' || !code.trim() || code.length > 2048) {
    throw { status: 400, message: 'Missing Google sign-in code.' };
  }

  const client = getGoogleClient();
  let payload;
  try {
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) throw new Error('Google returned no ID token');
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    console.warn('⚠️  Google sign-in rejected:', err.message);
    throw { status: 401, message: 'Google sign-in failed. Please try again.' };
  }

  if (!payload?.email || payload.email_verified !== true) {
    throw { status: 401, message: 'Your Google account email is not verified.' };
  }
  return payload;
};

// Used by every "Continue with …" button once the provider has told us who
// the user is. What happens depends on which page the button was on:
//   intent 'register' – makes a NEW account with the role picked on the page.
//                       If the email is already registered, says so instead.
//   intent 'login'    – signs in to an EXISTING account. If there isn't one,
//                       says so instead of quietly making a student account
//                       (a professor would end up with the wrong role).
// With no intent (an older frontend), it signs in or creates, as before.
const socialSignIn = async ({ email, full_name, role = 'student', intent, provider }) => {
  email = email.toLowerCase();

  const existing = await userRepo.findByEmailAnyCase(email);

  if (existing && intent === 'register') {
    throw {
      status: 409,
      message: `${email} already has a ProFolio account. Go to Sign in and choose ${provider} there.`,
    };
  }
  if (!existing && intent === 'login') {
    throw {
      status: 404,
      message: `No ProFolio account uses ${email} yet. Create one first \u2014 choose Create one below, then ${provider}.`,
    };
  }

  if (existing) {
    assertCanSignIn(existing);
    return { user: publicUser(existing), token: signToken(existing) };
  }

  if (!SELF_SIGNUP_ROLES.includes(role)) role = 'student';

  // A social account has no ProFolio password. Store a long random one that
  // nobody knows, so the column is filled and email + password login simply
  // never matches for this account.
  const password_hash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

  const user = await createAccount({ full_name, email, password_hash, role });

  if (role === 'evaluator') {
    return { pending: true, created: true, user: publicUser(user), message: PENDING_MESSAGE };
  }
  return { created: true, user: publicUser(user), token: signToken(user) };
};

const cleanName = (raw, email) => {
  const name = String(raw || '').replace(/\s+/g, ' ').trim();
  return (name || email.split('@')[0]).slice(0, 100);
};

const googleSignIn = async ({ code, role, intent }) => {
  const payload = await verifyGoogleCode(code);
  const name = payload.name || [payload.given_name, payload.family_name].filter(Boolean).join(' ');
  return socialSignIn({ email: payload.email, full_name: cleanName(name, payload.email), role, intent, provider: 'Google' });
};

// ─── Facebook sign-in ───────────────────────────────────────────────────────
// The browser's Facebook popup gives back a user access token. Before trusting
// it, the server asks Facebook (with the app secret, which stays here) whether
// the token is valid AND was issued to THIS app — a token made for some other
// app is rejected. Only then is the user's name and email read from Facebook.

const FB_GRAPH = 'https://graph.facebook.com/v26.0';

const getFacebookApp = () => {
  const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET } = process.env;
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    throw { status: 503, message: 'Facebook sign-in is not set up on the server yet.' };
  }
  return { id: FACEBOOK_APP_ID, secret: FACEBOOK_APP_SECRET };
};

// appsecret_proof proves a Graph request comes from the server that owns the app.
const proofFor = (app, accessToken) =>
  crypto.createHmac('sha256', app.secret).update(accessToken).digest('hex');

const fbGet = async (path, params) => {
  const res = await fetch(`${FB_GRAPH}${path}?${new URLSearchParams(params)}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    throw new Error(body.error?.message || `Facebook replied ${res.status}`);
  }
  return body;
};

const verifyFacebookToken = async (accessToken) => {
  if (typeof accessToken !== 'string' || !accessToken.trim() || accessToken.length > 4096) {
    throw { status: 400, message: 'Missing Facebook sign-in token.' };
  }

  const app = getFacebookApp();
  let profile;
  try {
    const { data } = await fbGet('/debug_token', {
      input_token: accessToken,
      access_token: `${app.id}|${app.secret}`,
    });
    if (!data?.is_valid || String(data.app_id) !== String(app.id)) {
      throw new Error('token is not valid for this app');
    }

    profile = await fbGet('/me', { fields: 'id,name,email', access_token: accessToken, appsecret_proof: proofFor(app, accessToken) });
    if (String(profile.id) !== String(data.user_id)) throw new Error('token user mismatch');
  } catch (err) {
    console.warn('⚠️  Facebook sign-in rejected:', err.message);
    throw { status: 401, message: 'Facebook sign-in failed. Please try again.' };
  }

  // Facebook leaves email out when the account was made with a phone number,
  // or when the user unticked the email permission in the popup.
  if (!profile.email) {
    // Find out which of the two it was, so the message says what to do.
    let emailPermission = 'unknown';
    try {
      const { data } = await fbGet('/me/permissions', { access_token: accessToken, appsecret_proof: proofFor(app, accessToken) });
      emailPermission = data?.find((p) => p.permission === 'email')?.status || 'not requested';
    } catch { /* the message below still works */ }
    console.warn(`⚠️  Facebook gave no email (email permission: ${emailPermission})`);

    throw {
      status: 400,
      message: emailPermission === 'granted'
        ? 'Your Facebook account has no confirmed email address. Add one in Facebook (Accounts Center \u2192 Personal details \u2192 Contact info), or sign in with Google or your email instead.'
        : 'Facebook didn\u2019t share your email address. Try again and keep \u201cEmail address\u201d switched on when Facebook asks, or sign in with Google or your email instead.',
    };
  }
  return profile;
};

const facebookSignIn = async ({ accessToken, role, intent }) => {
  const profile = await verifyFacebookToken(accessToken);
  return socialSignIn({ email: profile.email, full_name: cleanName(profile.name, profile.email), role, intent, provider: 'Facebook' });
};

module.exports = { register, login, googleSignIn, facebookSignIn };