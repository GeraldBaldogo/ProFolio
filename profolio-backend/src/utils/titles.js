// ─────────────────────────────────────────────────────────────────────────────
// src/utils/titles.js
//
// Two kinds of recognition, named differently on purpose so neither is
// mistaken for the other:
//
//   Practice rank  — earned by clearing practice levels. Motivation only.
//                    Deliberately not a job title.
//   Verified title — earned only on a test a professor set and assigned.
//                    A job title, and the one that counts.
//
// A verified title depends on the LEVEL of the professor's test as well as the
// score. A perfect score on a first-year test shows first-year mastery; it does
// not make someone a Junior Developer.
//
//   score >= PASS_SCORE (85)   → the title for the test's level
//   score >= NEAR_SCORE (70)   → the title one level below
//   anything lower             → no title from this test
//
// Rename anything here freely; nothing is stored by label.
// ─────────────────────────────────────────────────────────────────────────────

const { LEVELS, PASS_SCORE } = require('./curriculum');

const NEAR_SCORE = 70;

const PRACTICE_NOUN = {
  programming: 'Coder',
  bugfix: 'Debugger',
  sql: 'Query Writer',
  flowchart: 'Logic Designer',
  communication: 'Communicator',
};

// Index = how far through the practice levels the student is.
const PRACTICE_RANKS = ['Beginner', 'Developing', 'Proficient', 'Advanced'];

const VERIFIED_TITLES = {
  programming:   { easy: 'Trainee Developer',        medium: 'Associate Developer',       hard: 'Junior Developer' },
  bugfix:        { easy: 'QA Trainee',               medium: 'Associate QA Tester',       hard: 'Junior QA Engineer' },
  sql:           { easy: 'Database Trainee',         medium: 'Associate Data Analyst',    hard: 'Junior Database Developer' },
  flowchart:     { easy: 'Systems Analysis Trainee', medium: 'Associate Systems Analyst', hard: 'Junior Systems Analyst' },
  communication: { easy: 'Technical Writing Trainee', medium: 'Associate Technical Writer', hard: 'Junior Technical Writer' },
};

// What a student's practice progress amounts to.
//   one Easy topic passed → Beginner
//   all Easy passed       → Developing
//   all Medium passed     → Proficient
//   all Hard passed       → Advanced
const practiceRank = (type, progress) => {
  const noun = PRACTICE_NOUN[type];
  if (!noun || !progress?.levels) return null;
  const L = progress.levels;
  let tier = -1;
  if (L.easy.passed > 0) tier = 0;
  if (L.easy.complete) tier = 1;
  if (L.medium.complete) tier = 2;
  if (L.hard.complete) tier = 3;
  return tier < 0 ? null : { tier, label: `${PRACTICE_RANKS[tier]} ${noun}` };
};

// The title a single professor test earns. A test saved without a level is
// treated as Easy — the cautious reading, so an old or unlabelled test can
// never award more than it should.
const verifiedTitle = (type, testLevel, score) => {
  const table = VERIFIED_TITLES[type];
  if (!table) return null;
  const level = LEVELS.includes(testLevel) ? testLevel : 'easy';
  const i = LEVELS.indexOf(level);
  const s = Number(score) || 0;
  const tier = s >= PASS_SCORE ? i : s >= NEAR_SCORE ? i - 1 : -1;
  if (tier < 0) return null;
  return { tier, level: LEVELS[tier], label: table[LEVELS[tier]] };
};

const ladder = (type) =>
  VERIFIED_TITLES[type] ? LEVELS.map((level, tier) => ({ tier, level, label: VERIFIED_TITLES[type][level] })) : [];

module.exports = {
  NEAR_SCORE, PRACTICE_NOUN, PRACTICE_RANKS, VERIFIED_TITLES,
  practiceRank, verifiedTitle, ladder,
};