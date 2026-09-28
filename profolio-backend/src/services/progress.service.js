// ─────────────────────────────────────────────────────────────────────────────
// src/services/progress.service.js
//
// Practice levels unlock in order: Medium once every Easy topic is passed,
// Hard once every Medium topic is passed. See utils/curriculum.js for what the
// topics are.
//
// Enforced here, on the server. A lock that lived only in the page could be
// opened from DevTools by anyone who wanted to.
//
// Progress is worked out from results already saved — no extra table. Only
// practice results count (assigned tests are the professor's to set), and
// only results whose topic came from a sealed token, so a student can't claim
// a topic they weren't given.
// ─────────────────────────────────────────────────────────────────────────────

const assessmentRepo = require('../repositories/assessment.repo');
const { CURRICULUM, LEVELS, PASS_SCORE, findTopic } = require('../utils/curriculum');
const { sealChallenge, openChallenge } = require('../utils/sqlSandbox');
const { practiceRank } = require('../utils/titles');

const LEVEL_NAME = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

const buildProgress = (rows, type) => {
  const plan = CURRICULUM[type];

  // Best score per topic within its own level.
  const best = new Map();
  for (const r of rows) {
    if (r.type !== type || !r.topic || !r.difficulty) continue;
    const k = `${r.difficulty}:${r.topic}`;
    best.set(k, Math.max(best.get(k) ?? 0, Number(r.score) || 0));
  }

  const levels = {};
  let previousComplete = true;
  for (const level of LEVELS) {
    const topics = plan[level].map((t) => {
      const k = `${level}:${t.key}`;
      const score = best.has(k) ? best.get(k) : null;
      return { key: t.key, label: t.label, best_score: score, passed: score !== null && score >= PASS_SCORE };
    });
    const complete = topics.every((t) => t.passed);
    levels[level] = {
      unlocked: previousComplete,
      complete,
      passed: topics.filter((t) => t.passed).length,
      total: topics.length,
      topics,
    };
    previousComplete = previousComplete && complete;
  }

  const result = { type, pass_score: PASS_SCORE, levels };
  result.rank = practiceRank(type, result);
  return result;
};

const getProgress = async (user_id, type) => {
  if (!CURRICULUM[type]) throw { status: 400, message: `Unknown assessment type: ${type}` };
  return buildProgress(await assessmentRepo.getPracticeScores(user_id), type);
};

const getAllProgress = async (user_id) => {
  const rows = await assessmentRepo.getPracticeScores(user_id);
  return Object.fromEntries(Object.keys(CURRICULUM).map((t) => [t, buildProgress(rows, t)]));
};

// The lowest level with anything left to pass. Used where the page has no
// level picker (flowchart) so the next task is chosen for the student.
const currentLevel = (progress) =>
  LEVELS.find((l) => progress.levels[l].unlocked && !progress.levels[l].complete) || 'hard';

const lockedMessage = (progress, level) => {
  const prev = LEVELS[LEVELS.indexOf(level) - 1];
  const p = progress.levels[prev];
  return `${LEVEL_NAME[level]} is locked. Score ${PASS_SCORE} or higher on every ${LEVEL_NAME[prev]} topic first — ${p.passed} of ${p.total} done.`;
};

const assertUnlocked = (progress, level) => {
  if (!LEVELS.includes(level)) throw { status: 400, message: `Unknown difficulty: ${level}` };
  if (!progress.levels[level].unlocked) throw { status: 403, message: lockedMessage(progress, level) };
};

/**
 * Called by every practice generator before it spends a Gemini request.
 * Refuses a locked level, then picks the topic: the one asked for if it is in
 * this level, otherwise the next one not yet passed, otherwise any (review).
 */
const beginPractice = async (user_id, type, difficulty, requestedTopic = null) => {
  const progress = await getProgress(user_id, type);
  const level = difficulty || currentLevel(progress);
  assertUnlocked(progress, level);

  const plan = CURRICULUM[type][level];
  const status = new Map(progress.levels[level].topics.map((t) => [t.key, t.passed]));
  const topic =
    plan.find((t) => t.key === requestedTopic) ||
    plan.find((t) => !status.get(t.key)) ||
    plan[Math.floor(Math.random() * plan.length)];

  return { difficulty: level, topic, progress };
};

// Binds a generated challenge to its type, level and topic. Sent to the page
// and returned on submit; the student can carry it but not read or alter it.
const sealPractice = (type, difficulty, topicKey, extra = {}) =>
  sealChallenge({ ...extra, type, difficulty, topic: topicKey });

// The trusted difficulty and topic for a practice submission, or nulls if the
// token is missing, expired, tampered with or belongs to a different type.
// A null topic still saves the result — it just doesn't count toward unlocking.
const readPractice = (token, type) => {
  if (!token) return { difficulty: null, topic: null, payload: null };
  try {
    const p = openChallenge(token);
    if (p.type !== type || !findTopic(type, p.topic)) return { difficulty: null, topic: null, payload: p };
    return { difficulty: p.difficulty, topic: p.topic, payload: p };
  } catch {
    return { difficulty: null, topic: null, payload: null };
  }
};

module.exports = {
  getProgress, getAllProgress, beginPractice, sealPractice, readPractice,
  assertUnlocked, currentLevel,
};