const { PASS_SCORE } = require('./curriculum');

const RUBRICS = {
  typing: {
    label: 'Typing',
    outcome: 'Use computing tools efficiently and accurately in professional work.',
    method: 'Measured automatically — no AI involved.',
    criteria: [
      { key: 'speed', label: 'Speed', weight: 60, measures: 'Words per minute, counted up to 100 WPM (100 WPM or more earns the full 60).' },
      { key: 'accuracy', label: 'Accuracy', weight: 40, measures: 'Share of characters typed correctly.' },
    ],
  },
  programming: {
    label: 'Programming',
    outcome: 'Design, implement and evaluate a computing solution to a given problem.',
    method: 'Scored by AI against the criteria below, then weighted by the system.',
    criteria: [
      { key: 'correctness', label: 'Correctness', weight: 40, measures: 'Produces the right result for normal and edge cases.' },
      { key: 'problem_solving', label: 'Problem solving', weight: 25, measures: 'A sound approach and algorithm for the task.' },
      { key: 'code_quality', label: 'Code quality', weight: 20, measures: 'Readable names, clear structure, no needless repetition.' },
      { key: 'documentation', label: 'Documentation', weight: 15, measures: 'Comments or naming that explain the non-obvious parts.' },
    ],
  },
  bugfix: {
    label: 'Debugging',
    outcome: 'Analyse existing code to find and correct defects.',
    method: 'Scored by AI against the criteria below, then weighted by the system.',
    criteria: [
      { key: 'identification', label: 'Defects found', weight: 35, measures: 'How many of the planted bugs were located.' },
      { key: 'fix_correctness', label: 'Fix correctness', weight: 40, measures: 'Each fix actually resolves its bug.' },
      { key: 'preservation', label: 'Nothing broken', weight: 15, measures: 'Working behaviour was left intact; no new bugs.' },
      { key: 'code_quality', label: 'Code quality', weight: 10, measures: 'Fixes are clean and in keeping with the code around them.' },
    ],
  },
  sql: {
    label: 'SQL',
    outcome: 'Retrieve and manipulate data using a query language.',
    method: 'The query is run against the schema; AI scores the criteria below; the system weights them. A wrong result caps the score.',
    criteria: [
      { key: 'result', label: 'Correct result', weight: 50, measures: 'The query returns exactly the rows asked for.' },
      { key: 'query_design', label: 'Query design', weight: 25, measures: 'Appropriate joins, filters, grouping and aggregation.' },
      { key: 'efficiency', label: 'Efficiency', weight: 15, measures: 'No unnecessary work — needless subqueries, joins or scans.' },
      { key: 'readability', label: 'Readability', weight: 10, measures: 'Consistent formatting and meaningful aliases.' },
    ],
  },
  flowchart: {
    label: 'Flowcharting',
    outcome: 'Model a process as an algorithm using standard notation.',
    method: 'Scored by AI against the criteria below, then weighted by the system.',
    criteria: [
      { key: 'logic', label: 'Logic', weight: 40, measures: 'The steps and branches solve the stated problem.' },
      { key: 'completeness', label: 'Completeness', weight: 25, measures: 'Start and end, every decision and every path is present.' },
      { key: 'notation', label: 'Notation', weight: 20, measures: 'Correct symbols: ovals, rectangles, diamonds, arrows.' },
      { key: 'clarity', label: 'Clarity', weight: 15, measures: 'Readable labels and a flow that is easy to follow.' },
    ],
  },
  communication: {
    label: 'Communication',
    outcome: 'Communicate effectively in writing with technical and non-technical readers.',
    method: 'Scored by AI against the criteria below, then weighted by the system.',
    criteria: [
      { key: 'clarity', label: 'Clarity', weight: 30, measures: 'The message is easy to understand on first reading.' },
      { key: 'structure', label: 'Structure', weight: 25, measures: 'A logical order with a clear opening and close.' },
      { key: 'professionalism', label: 'Professionalism', weight: 25, measures: 'Tone suited to the reader and the situation.' },
      { key: 'grammar', label: 'Grammar', weight: 20, measures: 'Correct grammar, spelling and punctuation.' },
    ],
  },
};

// The same four bands used on the CV (services/cv.service.js).
const PROFICIENCY = [
  { label: 'Advanced', min: 85, meaning: 'Consistently meets every criterion; ready for independent work.' },
  { label: 'Proficient', min: 70, meaning: 'Meets most criteria with minor gaps.' },
  { label: 'Developing', min: 55, meaning: 'Meets the core of the task; several criteria need work.' },
  { label: 'Beginning', min: 0, meaning: 'Early stage; the essentials are not yet in place.' },
];

const INTEGRITY = {
  per_violation: 5,
  max_penalty: 25,
  rule: 'Each proctoring flag — switching tabs, leaving the window, pasting, or the camera losing your face — takes 5 points off, up to 25.',
};

const clamp10 = (n) => Math.max(0, Math.min(10, Number(n)));

// The criterion scores as stored in the result: only known keys, each 0–10.
const normalizeCriteria = (type, raw) => {
  const rubric = RUBRICS[type];
  if (!rubric || !raw || typeof raw !== 'object') return null;
  const out = {};
  for (const c of rubric.criteria) {
    if (Number.isFinite(Number(raw[c.key]))) out[c.key] = clamp10(raw[c.key]);
  }
  return Object.keys(out).length === rubric.criteria.length ? out : null;
};

// Weighted 0–100 from 0–10 criterion scores. If the model didn't return every
// criterion, falls back to its overall score rather than failing the attempt.
const scoreFromCriteria = (type, raw, fallback) => {
  const criteria = normalizeCriteria(type, raw);
  if (!criteria) return Math.max(0, Math.min(100, Math.round(Number(fallback) || 0)));
  const total = RUBRICS[type].criteria.reduce((sum, c) => sum + (criteria[c.key] / 10) * c.weight, 0);
  return Math.round(total);
};

// The text an AI grader is given: each criterion, its weight, and what it
// means — plus the exact JSON shape to answer with.
const rubricPrompt = (type) => {
  const rubric = RUBRICS[type];
  const lines = rubric.criteria.map((c) => `- ${c.key} (${c.weight}%): ${c.measures}`).join('\n');
  return `Score each criterion from 0 to 10 using this rubric (10 = fully meets it, 5 = partly, 0 = not at all):
${lines}
Be consistent: the same work must always get the same criterion scores.`;
};

const rubricJson = (type) =>
  `"criteria": { ${RUBRICS[type].criteria.map((c) => `"${c.key}": number 0-10`).join(', ')} },`;

// For the "How scoring works" page.
const publicRubric = () => ({
  proficiency: PROFICIENCY,
  integrity: INTEGRITY,
  practice_pass_score: PASS_SCORE,
  types: Object.entries(RUBRICS).map(([type, r]) => ({ type, ...r })),
});

module.exports = { RUBRICS, PROFICIENCY, INTEGRITY, normalizeCriteria, scoreFromCriteria, rubricPrompt, rubricJson, publicRubric };