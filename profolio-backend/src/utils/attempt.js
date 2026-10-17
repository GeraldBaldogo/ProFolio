const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const supabase = require('../config/db');

/*
 * Attempts: the server's own record of "this student started this assessment".
 *
 * Before, the browser made up the attempt id and, when submitting, simply
 * told the server how many flags it had and (for typing) what its WPM and
 * accuracy were. Anyone could edit those numbers in DevTools before they were
 * sent. Now:
 *
 *  1. The server issues the attempt id, inside a token signed with a secret
 *     only the server knows. It can't be forged or swapped for a fresh one.
 *  2. Every proctoring flag is logged to the server under that id as it
 *     happens. At submit, the server counts them itself and uses whichever is
 *     higher — its own count or the browser's — so editing the count to 0
 *     does nothing.
 *  3. Each attempt can be submitted once.
 *
 * No database changes: the token carries everything, and flags already live
 * in proctoring_events.
 */

const SECRET = () => {
  const s = process.env.ATTEMPT_SECRET || process.env.JWT_SECRET;
  if (!s) throw { status: 500, message: 'Server is missing JWT_SECRET.' };
  return s;
};
const AUDIENCE = 'profolio-attempt';
const MAX_AGE = '6h';

const CAMERA_EVENTS = ['camera_no_face', 'camera_multiple_faces', 'camera_looking_away'];
const NOT_A_VIOLATION = ['tab_focus'];

const sign = (claims) => jwt.sign(claims, SECRET(), { audience: AUDIENCE, expiresIn: MAX_AGE });

// Start an attempt. `extra` is signed in too (e.g. the typing passage).
const issue = (user_id, type, extra = {}) => {
  const session_id = crypto.randomUUID();
  const session_token = sign({ sid: session_id, uid: user_id, type, ...extra });
  return { session_id, session_token };
};

// Re-sign with more claims (e.g. typing's "began at"), keeping the same id.
const extend = (claims, more) => {
  const { iat, exp, aud, ...keep } = claims; // eslint-disable-line no-unused-vars
  return sign({ ...keep, ...more });
};

const verify = (token, user_id, type) => {
  if (!token) {
    throw { status: 400, message: 'This attempt wasn’t started properly. Reload the page and start again.' };
  }
  let claims;
  try {
    claims = jwt.verify(token, SECRET(), { audience: AUDIENCE });
  } catch (err) {
    throw {
      status: 400,
      message: err.name === 'TokenExpiredError'
        ? 'This attempt has expired. Reload the page and start again.'
        : 'This attempt couldn’t be verified. Reload the page and start again.',
    };
  }
  if (claims.uid !== user_id) throw { status: 403, message: 'This attempt belongs to another account.' };
  if (type && claims.type !== type) throw { status: 400, message: 'This attempt is for a different assessment.' };
  return claims;
};

// Flags the server itself received for this attempt.
const serverCounts = async (user_id, session_id) => {
  const { data, error } = await supabase
    .from('proctoring_events')
    .select('event_type')
    .eq('session_id', session_id)
    .eq('user_id', user_id);
  if (error) throw error;
  const rows = data || [];
  return {
    camera_violation_count: rows.filter((e) => CAMERA_EVENTS.includes(e.event_type)).length,
    violation_count: rows.filter((e) => !CAMERA_EVENTS.includes(e.event_type) && !NOT_A_VIOLATION.includes(e.event_type)).length,
  };
};

const assertNotSubmitted = async (session_id) => {
  const { data, error } = await supabase
    .from('assessment_results')
    .select('id')
    .eq('session_id', session_id)
    .limit(1);
  if (error) throw error;
  if (data?.length) throw { status: 409, message: 'This attempt has already been submitted.' };
};

const toCount = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

/*
 * For the submit routes. Checks the attempt token and replaces what the
 * browser sent — session_id and both flag counts — with values the server
 * stands behind. Pages that add camera flags into violation_count (SQL,
 * Bug Fix, Communication) still work: the browser's number only ever raises
 * the total, never lowers it below what the server logged.
 */
const settle = async (user_id, type, body = {}) => {
  const claims = verify(body.session_token, user_id, type);
  await assertNotSubmitted(claims.sid);
  const server = await serverCounts(user_id, claims.sid);
  const camera = Math.max(server.camera_violation_count, toCount(body.camera_violation_count));
  const other = Math.max(server.violation_count, toCount(body.violation_count));
  const { session_token, ...rest } = body; // eslint-disable-line no-unused-vars
  return {
    claims,
    body: {
      ...rest,
      session_id: claims.sid,
      camera_violation_count: camera,
      violation_count: other,
    },
  };
};

module.exports = { issue, extend, verify, settle, serverCounts, assertNotSubmitted, CAMERA_EVENTS };
