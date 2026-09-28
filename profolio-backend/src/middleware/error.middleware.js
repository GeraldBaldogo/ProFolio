const crypto = require('crypto');

/*
 * The one place every backend error ends up (mounted last in server.js).
 *
 * Writes enough to the terminal — or Render's logs — to find the cause
 * without opening the browser's Network tab: which route, which user, the
 * message, and the code/details/hint Supabase attaches to database errors
 * (that's where "violates foreign key constraint" and the like show up).
 *
 * 4xx are the user's mistake or an expected "not allowed": one short line,
 * and their message goes back as-is because it's written for the user.
 * 5xx are ours: the full detail is logged, and in production the browser
 * gets a plain message plus a short ref to match against the log, rather
 * than raw database internals.
 */
module.exports = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  const code = Number(err?.status);
  const status = code >= 400 && code < 600 ? code : 500;
  const who = req.user ? `${req.user.role || 'user'} ${req.user.id}` : 'not signed in';
  const where = `${req.method} ${req.originalUrl}`;

  if (status < 500) {
    console.warn(`⚠️  ${status} ${where} (${who}): ${err?.message}`);
    return res.status(status).json({ success: false, message: err?.message || 'Request failed.' });
  }

  const ref = crypto.randomBytes(3).toString('hex');
  console.error(`❌ ${status} ${where} (${who}) ref=${ref}`);
  console.error(`   ${err?.message || err}`);
  for (const key of ['code', 'details', 'hint']) {
    if (err?.[key]) console.error(`   ${key}: ${err[key]}`);
  }
  if (err?.stack) console.error(err.stack.split('\n').slice(1, 6).join('\n'));

  const showDetail = process.env.NODE_ENV !== 'production';
  res.status(status).json({
    success: false,
    message: showDetail
      ? (err?.message || 'Internal Server Error')
      : `Something went wrong on our side. Please try again. (ref ${ref})`,
    ref,
  });
};