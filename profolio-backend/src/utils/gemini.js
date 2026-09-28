// ─────────────────────────────────────────────────────────────────────────────
// src/utils/gemini.js
//
// One place for every Gemini call in the backend, with retry and fallback.
//
// Seven services each created their own model and called it once. A 503 from
// Google — "this model is currently experiencing high demand" — therefore
// failed the request outright, which during a demonstration means an
// assessment that never gets marked.
//
// getModel() returns an object shaped like the SDK's own model, so a service
// only changes the line that creates the model; every generateContent call
// stays exactly as it is.
// ─────────────────────────────────────────────────────────────────────────────

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// Tried in order once the primary has failed. Set GEMINI_FALLBACK_MODELS in
// .env and on Render as a comma-separated list to change them without a
// redeploy of code.
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || 'gemini-3.5-flash,gemini-3.1-flash-lite')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Most 503s clear within a couple of seconds. Two short waits catch nearly all
// of them before falling back; longer waits would just leave the student
// staring at a spinner.
const RETRY_DELAYS_MS = [1500, 4000];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The SDK attaches .status to fetch errors, but older versions only put the
// code in the message — "[503 Service Unavailable]". Read either.
const statusOf = (err) => {
  if (err?.status) return Number(err.status);
  const m = /\[(\d{3})[\s\]]/.exec(err?.message || '');
  return m ? Number(m[1]) : null;
};

// Google's side is overloaded or hiccupped. Worth waiting and asking again.
const isTransient = (s) => s === 500 || s === 502 || s === 503 || s === 504;

// Worth trying a different model, but not worth retrying the same one:
//   429 — this model's quota is spent; free-tier quotas are per model, so a
//         fallback model usually still has room.
//   404 — this model name doesn't exist (retired, or mistyped in .env).
const shouldFallback = (s) => isTransient(s) || s === 429 || s === 404;

async function withResilience(label, call) {
  const models = [PRIMARY_MODEL, ...FALLBACK_MODELS.filter((m) => m !== PRIMARY_MODEL)];
  let lastErr;

  for (const modelName of models) {
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      try {
        const result = await call(modelName);
        if (modelName !== PRIMARY_MODEL) {
          console.warn(`[gemini] ${label}: served by fallback model ${modelName}`);
        }
        return result;
      } catch (err) {
        lastErr = err;
        const status = statusOf(err);

        if (isTransient(status) && attempt < RETRY_DELAYS_MS.length) {
          const wait = RETRY_DELAYS_MS[attempt];
          console.warn(`[gemini] ${label}: ${status} from ${modelName}, retrying in ${wait}ms`);
          await sleep(wait);
          continue;
        }

        if (shouldFallback(status)) {
          console.warn(`[gemini] ${label}: ${status} from ${modelName}, trying next model`);
          break;
        }

        // 400, a bad API key, a blocked prompt — no amount of retrying fixes
        // these, and hiding them behind a fallback would make them harder to
        // diagnose.
        throw err;
      }
    }
  }

  throw lastErr;
}

/**
 * Drop-in replacement for genAI.getGenerativeModel(options).
 * Any `model` in options is ignored in favour of PRIMARY_MODEL and fallbacks;
 * everything else (generationConfig, systemInstruction, safetySettings) is
 * passed through unchanged.
 */
function getModel(options = {}) {
  const { model: _ignored, ...rest } = options;
  const build = (name) => genAI.getGenerativeModel({ ...rest, model: name });

  return {
    generateContent: (...args) =>
      withResilience('generateContent', (name) => build(name).generateContent(...args)),

    // Retries only if the stream fails to open. A failure halfway through a
    // stream is passed on, since part of the answer has already been sent.
    generateContentStream: (...args) =>
      withResilience('generateContentStream', (name) => build(name).generateContentStream(...args)),

    countTokens: (...args) => build(PRIMARY_MODEL).countTokens(...args),

    // Chat keeps its own history here rather than inside one SDK session, so
    // that if a message falls back to a different model mid-conversation, the
    // new model still sees everything that was said before.
    startChat: (chatParams = {}) => {
      let history = [...(chatParams.history || [])];

      return {
        sendMessage: async (message) => {
          let session;
          const result = await withResilience('chat', (name) => {
            session = build(name).startChat({ ...chatParams, history });
            return session.sendMessage(message);
          });
          history = await session.getHistory();
          return result;
        },
        getHistory: async () => history,
      };
    },
  };
}

module.exports = { getModel, PRIMARY_MODEL, FALLBACK_MODELS };