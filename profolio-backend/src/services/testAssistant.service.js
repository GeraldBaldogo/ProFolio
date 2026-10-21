// ─────────────────────────────────────────────────────────────────────────────
// src/services/testAssistant.service.js
//
// The "Build with AI" assistant on the professor's side. The professor chats
// with the AI about the test they want — type, level, topic, how hard — and the
// AI drafts a complete, valid test config. The professor still reviews and
// edits it in the normal form before publishing, so nothing here can create or
// assign a test on its own: it only ever returns a draft to the page.
// ─────────────────────────────────────────────────────────────────────────────

const { getModel } = require('../utils/gemini');

const VALID_TYPES = ['typing', 'programming', 'flowchart', 'sql', 'bugfix', 'communication'];
const VALID_LEVELS = ['easy', 'medium', 'hard'];

// Must match REQUIRED_CONFIG_FIELDS in test.service.js — the server validates
// against that list on save, so a draft missing any of these isn't "ready".
const REQUIRED_CONFIG_FIELDS = {
  typing: ['text_passage', 'duration_seconds'],
  programming: ['problem_statement', 'starter_code', 'language'],
  flowchart: ['scenario_description'],
  sql: ['schema_sql', 'question'],
  bugfix: ['buggy_code', 'language'],
  communication: ['prompt'],
};

const LANGUAGES = [
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C', 'C#',
  'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
];

// The whole catalogue the AI is allowed to design for, spelled out so it can
// only ever produce a config the save endpoint will accept.
const TYPE_SPEC = `
Assessment types and the EXACT config fields each one needs:

- "typing" (Speed typing): config = {
    "text_passage": string — the passage the student types (3–6 sentences; harder = longer and more technical),
    "duration_seconds": number — time limit in SECONDS (e.g. 60, 90, 120)
  }
- "programming" (Programming challenge): config = {
    "problem_statement": string — what to build,
    "starter_code": string — a stub in the chosen language (e.g. a function signature with a TODO),
    "language": one of ${LANGUAGES.join(', ')},
    "test_cases": optional array of { "input": string, "expected_output": string }
  }
- "bugfix" (Bug fix): config = {
    "buggy_code": string — code with a real bug the student must fix,
    "language": one of ${LANGUAGES.join(', ')},
    "test_cases": optional array of { "input": string, "expected_output": string }
  }
- "sql" (SQL query): config = {
    "schema_sql": string — CREATE TABLE statements AND INSERT rows (6+ rows per table, varied),
    "question": string — one question with a single correct result; name the exact columns to return,
    "solution_sql": optional string — the correct query (never shown to students; strongly recommended)
  }
- "flowchart" (Flowchart design): config = {
    "scenario_description": string — the process to diagram,
    "rubric": optional array of strings — criteria to mark on
  }
- "communication" (Communication): config = {
    "prompt": string — what to answer in plain language,
    "rubric": optional array of strings — criteria to mark on
  }

Every draft also needs:
- "type": one of ${VALID_TYPES.join(', ')}
- "title": a short title, e.g. "Week 4 — Loops and Conditionals"
- "description": one or two sentences for the student
- "level": one of ${VALID_LEVELS.join(', ')}
    easy = 1st year / up to Trainee, medium = 2nd year / up to Associate, hard = 3rd–4th year / up to Junior.
`.trim();

const SYSTEM_PROMPT = `You are the test-design assistant inside ProFolio, a student portfolio and assessment platform. A PROFESSOR is chatting with you to design ONE assessment. Your job is to understand what they want and draft a complete, ready-to-use test for them to review.

${TYPE_SPEC}

How to behave:
- Always reply in clear, simple ENGLISH, and write ALL test content (titles, passages, problems, schemas, prompts, rubrics, starter/buggy code, descriptions) in English — even if the professor writes to you in another language. Be warm and brief.
- If you don't yet know the test TYPE, the LEVEL, or the TOPIC, ask a short question to get what's missing — do not guess wildly. One or two short questions at a time, not a long list.
- The professor tells you how hard it should be (the level) and the topic; YOU write the actual content (passage, problem, schema, prompt, rubric, starter code, test cases) at that level.
- As soon as you have enough to make a sensible test, PRODUCE A DRAFT. You can draft and still ask if they want changes.
- When the professor asks for changes ("make it harder", "change the topic", "shorter passage", "add a test case"), return an UPDATED full draft that keeps everything else.
- Match difficulty to the level: easy = short/basic, medium = moderate, hard = longer and more involved.
- Keep everything self-contained and correct. For SQL, the solution_sql must actually answer the question against your sample data. For programming/bugfix, test_cases must be consistent with a correct solution.

OUTPUT FORMAT — respond with JSON ONLY, no markdown, exactly this shape:
{
  "reply": "your chat message to the professor",
  "draft": {
    "type": "...", "title": "...", "description": "...", "level": "easy|medium|hard",
    "config": { ... fields for that type ... }
  }
}
Set "draft" to null while you are still only asking clarifying questions and have nothing to draft yet. Whenever you have enough information, "draft" must be a full, valid object — never a partial one.`;

// A draft is "ready" (the professor can use it as-is) only when it has a valid
// type, level, title and every required config field for that type.
const isDraftReady = (draft) => {
  if (!draft || typeof draft !== 'object') return false;
  if (!VALID_TYPES.includes(draft.type)) return false;
  if (!VALID_LEVELS.includes(draft.level)) return false;
  if (!draft.title || !String(draft.title).trim()) return false;
  const cfg = draft.config;
  if (!cfg || typeof cfg !== 'object') return false;
  const required = REQUIRED_CONFIG_FIELDS[draft.type] || [];
  return required.every((f) => {
    const v = cfg[f];
    return v !== undefined && v !== null && String(v).trim() !== '';
  });
};

// Fold any stray top-level fields the model may have put beside config back
// into the config, and coerce the few typed fields, so the draft matches what
// the save endpoint expects. Never throws — a messy draft just comes back less
// complete and isReady catches it.
const normaliseDraft = (draft) => {
  if (!draft || typeof draft !== 'object') return null;
  const type = VALID_TYPES.includes(draft.type) ? draft.type : null;
  const level = VALID_LEVELS.includes(draft.level) ? draft.level : undefined;
  const config = { ...(draft.config && typeof draft.config === 'object' ? draft.config : {}) };

  if (level) config.level = level;
  if (config.duration_seconds !== undefined) {
    config.duration_seconds = Number(config.duration_seconds) || 0;
  }
  // Rubric is stored as an array; accept a comma-separated string too.
  if (typeof config.rubric === 'string') {
    config.rubric = config.rubric.split(',').map((x) => x.trim()).filter(Boolean);
  }
  // Test cases must be an array of {input, expected_output}; drop anything else.
  if (config.test_cases !== undefined) {
    config.test_cases = Array.isArray(config.test_cases)
      ? config.test_cases
          .map((tc) => ({
            input: String(tc?.input ?? ''),
            expected_output: String(tc?.expected_output ?? ''),
          }))
          .filter((tc) => tc.input || tc.expected_output)
      : [];
  }

  return {
    type,
    title: draft.title ? String(draft.title).trim() : '',
    description: draft.description ? String(draft.description).trim() : '',
    level,
    config,
  };
};

// Renders the chat so far into the single prompt the SDK takes, the same way
// the other services build their prompts.
const renderTranscript = (messages) =>
  (messages || [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-20) // keep the prompt bounded on long conversations
    .map((m) => `${m.role === 'user' ? 'PROFESSOR' : 'ASSISTANT'}: ${m.content}`)
    .join('\n\n');

// A compact, safe view of the professor's existing test, used as the reference
// the AI builds a new test from. Only the design fields — never ids or ownership.
const renderBase = (base) => {
  if (!base || typeof base !== 'object') return '';
  const cfg = base.config && typeof base.config === 'object' ? base.config : {};
  let out = '';
  try { out = JSON.stringify({ type: base.type, title: base.title, description: base.description, config: cfg }, null, 2); }
  catch { out = ''; }
  return out;
};

const draftTest = async (_professor_id, { messages = [], type = null, base = null } = {}) => {
  const hasUser = (messages || []).some((m) => m && m.role === 'user' && String(m.content || '').trim());
  if (!hasUser) {
    throw { status: 400, message: 'Say what kind of test you want to build.' };
  }

  const steer = VALID_TYPES.includes(type)
    ? `\n\nThe professor has pre-selected the type "${type}". Design for that type unless they clearly ask to change it.`
    : '';

  // When the chat is opened from an existing test, that test is the reference:
  // the AI builds a NEW test based on it — same type and level, equivalent
  // difficulty — with fresh content, not a copy.
  const baseText = renderBase(base);
  const baseBlock = baseText
    ? `\n\nThe professor opened this chat from an EXISTING test, shown below. Build a NEW test BASED ON it: keep the same type and level and match its style and difficulty, but write FRESH content (a different passage / problem / schema / prompt of equivalent difficulty) — never copy it. Only change the type or level if the professor explicitly asks.

EXISTING TEST (reference):
${baseText}`
    : '';

  const prompt = `${SYSTEM_PROMPT}${steer}${baseBlock}

Conversation so far:
${renderTranscript(messages)}

Now respond with the JSON object described above.`;

  const model = getModel({
    model: 'gemini-3.6-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });

  const geminiResult = await model.generateContent(prompt);
  const raw = geminiResult.response.text().replace(/```json|```/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // The model didn't return clean JSON — treat its text as a plain reply so
    // the chat keeps working rather than erroring out mid-conversation.
    return { reply: raw || 'Sorry, could you say that again?', draft: null, ready: false };
  }

  const reply = typeof parsed.reply === 'string' && parsed.reply.trim()
    ? parsed.reply.trim()
    : 'Here’s a draft — tell me what to change.';
  const draft = parsed.draft ? normaliseDraft(parsed.draft) : null;
  const ready = isDraftReady(draft);

  // A draft that isn't actually complete shouldn't look usable; keep the reply
  // but only hand back a draft the professor can really use.
  return { reply, draft: ready ? draft : (draft && draft.type ? draft : null), ready };
};

module.exports = { draftTest };
