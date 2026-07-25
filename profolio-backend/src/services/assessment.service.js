const { GoogleGenerativeAI } = require('@google/generative-ai');
const assessmentRepo = require('../repositories/assessment.repo');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper: call Gemini and force a clean JSON response.
// imageParts (optional): array of { inlineData: { mimeType, data } } for vision inputs.
const generateJSON = async (prompt, imageParts = []) => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const contentParts = imageParts.length
    ? [...imageParts, { text: prompt }]
    : prompt;

  const result = await model.generateContent(contentParts);
  const raw = result.response.text().replace(/```json|```/g, '').trim();
  return JSON.parse(raw);
};

// ─── TYPING ───────────────────────────────────────────────────────────────────

const TYPING_TEXTS = {
  easy: [
    "The quick brown fox jumps over the lazy dog. Learning to type fast is an important skill for every student.",
    "Practice makes perfect. The more you type, the faster and more accurate you will become over time.",
    "A computer is a useful tool for students. It helps you write, research, and learn new things every day.",
  ],
  medium: [
    "Programming requires logical thinking and attention to detail. Debugging code often takes longer than writing it in the first place.",
    "Software development is a collaborative process. Teams use version control systems like Git to manage changes to their codebase efficiently.",
    "Database management systems store and retrieve data efficiently. SQL is the standard language used to query relational databases.",
  ],
  hard: [
    "Polymorphism in object-oriented programming allows methods to perform different functions based on the object they are acting upon. This is achieved through method overriding and interfaces.",
    "Asymptotic analysis describes the limiting behavior of algorithms. Big-O notation expresses the worst-case complexity of an algorithm in terms of input size n.",
    "RESTful APIs use HTTP methods such as GET, POST, PUT, PATCH, and DELETE to perform CRUD operations on resources identified by uniform resource identifiers.",
  ]
};

const submitTypingResult = async (user_id, {
  wpm, accuracy, time_seconds, difficulty = 'easy',
  violation_count = 0, camera_violation_count = 0, session_id = null
}) => {
  if (wpm === undefined || wpm === null || accuracy === undefined || accuracy === null)
    throw { status: 400, message: 'wpm and accuracy are required.' };

  const wpmScore = Math.min((wpm / 100) * 100, 100);
  const accScore = accuracy;
  const rawScore = Math.round(wpmScore * 0.6 + accScore * 0.4);

  // Previously: violations were recorded but never affected the score.
  // Now consistent with coding/sql/bugfix penalty logic.
  const totalViolations = violation_count + camera_violation_count;
  const penalty = Math.min(totalViolations * 5, 25);
  const score = Math.max(0, rawScore - penalty);

  const result = await assessmentRepo.saveResult({
    user_id,
    type: 'typing',
    score,
    session_id,
    metadata: { wpm, accuracy, time_seconds, difficulty, violation_count, camera_violation_count, penalty_applied: penalty }
  });

  return result;
};

const getTypingText = ({ difficulty = 'easy' }) => {
  const texts = TYPING_TEXTS[difficulty] || TYPING_TEXTS.easy;
  return texts[Math.floor(Math.random() * texts.length)];
};

// ─── PROGRAMMING ──────────────────────────────────────────────────────────────

const generateChallenge = async ({ language, difficulty }) => {
  if (!language || !difficulty) throw { status: 400, message: 'language and difficulty are required.' };

  const prompt = `Generate a coding challenge for a student portfolio assessment.

Language: ${language}
Difficulty: ${difficulty}

Difficulty guidelines:
- easy: basic syntax, loops, conditionals, simple functions (1st-2nd year level)
- medium: data structures, recursion, string manipulation, OOP basics (2nd-3rd year level)
- hard: algorithms, complexity optimization, design patterns, advanced OOP (3rd-4th year level)

Respond with JSON only, no markdown:
{
  "title": "short challenge title",
  "description": "clear problem statement, 2-4 sentences",
  "example_input": "example input if applicable, or null",
  "example_output": "expected output if applicable, or null",
  "time_limit_minutes": number (10 for easy, 15 for medium, 20 for hard)
}`;

  return generateJSON(prompt);
};

const submitCodingResult = async (user_id, {
  language, difficulty, challenge_title, code,
  violation_count, camera_violation_count = 0, time_taken_seconds, session_id = null
}) => {
  if (!code) throw { status: 400, message: 'code is required.' };

  const prompt = `You are evaluating a coding assessment submission for a student portfolio platform.

Language: ${language}
Difficulty: ${difficulty}
Challenge: ${challenge_title}
Tab/Paste Violations: ${violation_count}
Camera Violations: ${camera_violation_count}

Student code:
\`\`\`
${code}
\`\`\`

Respond with JSON only, no markdown:
{
  "skill_score": number from 0-100,
  "correctness": "correct" | "partial" | "incorrect",
  "feedback": "2-3 sentence evaluation: correctness, code quality, one improvement tip",
  "penalty_applied": boolean
}`;

  const aiResult = await generateJSON(prompt);

  const totalViolations = violation_count + camera_violation_count;
  const penalty = Math.min(totalViolations * 5, 25);
  const finalScore = Math.max(0, aiResult.skill_score - penalty);

  const result = await assessmentRepo.saveResult({
    user_id,
    type: 'programming',
    score: finalScore,
    session_id,
    metadata: {
      language, difficulty, challenge_title, code,
      violation_count, camera_violation_count, time_taken_seconds,
      ai_score: aiResult.skill_score,
      penalty_applied: penalty,
      correctness: aiResult.correctness,
      feedback: aiResult.feedback
    }
  });

  return { ...result, feedback: aiResult.feedback, correctness: aiResult.correctness };
};

// ─── FLOWCHART ────────────────────────────────────────────────────────────────

const generateFlowchartProblem = async ({ difficulty = 'easy' } = {}) => {
  const prompt = `Generate a flowchart problem for a student assessment.

Difficulty: ${difficulty}

Difficulty guidelines:
- easy: simple linear process, 3-5 steps, no nested decisions (e.g. making coffee, login process)
- medium: 1-2 decision points, loops allowed, 5-8 steps (e.g. grading system, ATM withdrawal)
- hard: multiple decisions, nested conditions, 8+ steps, complex logic (e.g. sorting algorithm flow, order processing system)

Respond with JSON only, no markdown:
{
  "title": "short title",
  "description": "describe what process the student should create a flowchart for, 2-3 sentences",
  "hints": ["hint 1", "hint 2", "hint 3"]
}`;

  return generateJSON(prompt);
};

const submitFlowchartResult = async (user_id, {
  problem_title, difficulty = 'easy', image_base64, image_type,
  camera_violation_count = 0, session_id = null
}) => {
  if (!image_base64) throw { status: 400, message: 'image_base64 is required.' };

  const prompt = `This is a student-drawn flowchart for the problem: "${problem_title}" (Difficulty: ${difficulty}).

Evaluate the flowchart and respond with JSON only, no markdown:
{
  "skill_score": number from 0-100,
  "has_start_end": boolean,
  "has_decision_diamond": boolean,
  "logical_flow": "correct" | "partial" | "incorrect",
  "feedback": "2-3 sentences: what is good, what needs improvement"
}`;

  const imagePart = { inlineData: { mimeType: image_type || 'image/jpeg', data: image_base64 } };
  const aiResult = await generateJSON(prompt, [imagePart]);

  const penalty = Math.min(camera_violation_count * 5, 25);
  const finalScore = Math.max(0, aiResult.skill_score - penalty);

  const result = await assessmentRepo.saveResult({
    user_id,
    type: 'flowchart',
    score: finalScore,
    session_id,
    metadata: {
      problem_title, difficulty,
      camera_violation_count,
      penalty_applied: penalty,
      feedback: aiResult.feedback,
      has_start_end: aiResult.has_start_end,
      has_decision_diamond: aiResult.has_decision_diamond,
      logical_flow: aiResult.logical_flow
    }
  });

  return { ...result, feedback: aiResult.feedback, logical_flow: aiResult.logical_flow };
};

// ─── SQL ──────────────────────────────────────────────────────────────────────

const generateSQLChallenge = async ({ difficulty = 'easy' }) => {
  const prompt = `Generate a SQL assessment challenge for a student.

Difficulty: ${difficulty}

Difficulty guidelines:
- easy: basic SELECT, WHERE, ORDER BY, simple single-table queries
- medium: JOINs (INNER, LEFT), GROUP BY, HAVING, aggregate functions (COUNT, SUM, AVG)
- hard: subqueries, nested SELECTs, multiple JOINs, UNION, window functions, complex aggregations

Respond with JSON only, no markdown:
{
  "title": "short challenge title",
  "scenario": "brief description of the database context (e.g. 'A university database with students and courses')",
  "tables": [
    {
      "name": "table_name",
      "columns": ["col1 (type)", "col2 (type)"],
      "sample_data": "brief description of what data is in this table"
    }
  ],
  "question": "the specific SQL query they need to write, 1-2 sentences",
  "expected_output": "describe what the result should look like",
  "time_limit_minutes": number (10 for easy, 15 for medium, 20 for hard)
}`;

  return generateJSON(prompt);
};

const submitSQLResult = async (user_id, {
  difficulty, challenge_title, scenario, question, sql_code,
  violation_count, camera_violation_count = 0, time_taken_seconds, session_id = null
}) => {
  if (!sql_code) throw { status: 400, message: 'sql_code is required.' };

  const prompt = `You are evaluating a SQL assessment submission for a student portfolio platform.

Difficulty: ${difficulty}
Challenge: ${challenge_title}
Scenario: ${scenario}
Question: ${question}
Tab/Paste Violations: ${violation_count}
Camera Violations: ${camera_violation_count}

Student SQL:
\`\`\`sql
${sql_code}
\`\`\`

Respond with JSON only, no markdown:
{
  "skill_score": number from 0-100,
  "correctness": "correct" | "partial" | "incorrect",
  "syntax_valid": boolean,
  "feedback": "2-3 sentence evaluation: correctness, query quality, one improvement tip"
}`;

  const aiResult = await generateJSON(prompt);

  const totalViolations = violation_count + camera_violation_count;
  const penalty = Math.min(totalViolations * 5, 25);
  const finalScore = Math.max(0, aiResult.skill_score - penalty);

  const result = await assessmentRepo.saveResult({
    user_id,
    type: 'sql',
    score: finalScore,
    session_id,
    metadata: {
      difficulty, challenge_title, scenario, question, sql_code,
      violation_count, camera_violation_count, time_taken_seconds,
      ai_score: aiResult.skill_score,
      penalty_applied: penalty,
      correctness: aiResult.correctness,
      syntax_valid: aiResult.syntax_valid,
      feedback: aiResult.feedback
    }
  });

  return { ...result, feedback: aiResult.feedback, correctness: aiResult.correctness };
};

// ─── BUG FIXING ───────────────────────────────────────────────────────────────

const generateBugFixChallenge = async ({ language, difficulty = 'easy' }) => {
  const prompt = `Generate a bug fixing challenge for a student assessment.

Language: ${language}
Difficulty: ${difficulty}

Difficulty guidelines:
- easy: 1-2 obvious bugs, syntax errors, off-by-one errors, simple logic mistakes
- medium: 2-3 bugs, logical errors, wrong conditions, missing edge case handling
- hard: 3-5 subtle bugs, algorithmic errors, race conditions concepts, complex logic flaws

Respond with JSON only, no markdown:
{
  "title": "short challenge title",
  "description": "what the code is supposed to do, 1-2 sentences",
  "buggy_code": "the code with bugs inserted (10-25 lines)",
  "bug_count": number,
  "hints": ["hint about bug 1", "hint about bug 2"],
  "time_limit_minutes": number (10 for easy, 15 for medium, 20 for hard)
}`;

  return generateJSON(prompt);
};

const submitBugFixResult = async (user_id, {
  language, difficulty, challenge_title, description, original_buggy_code, fixed_code,
  violation_count, camera_violation_count = 0, time_taken_seconds, session_id = null
}) => {
  if (!fixed_code) throw { status: 400, message: 'fixed_code is required.' };

  const prompt = `You are evaluating a bug fixing assessment for a student portfolio platform.

Language: ${language}
Difficulty: ${difficulty}
Challenge: ${challenge_title}
Description: ${description}
Tab/Paste Violations: ${violation_count}
Camera Violations: ${camera_violation_count}

Original buggy code:
\`\`\`
${original_buggy_code}
\`\`\`

Student's fixed code:
\`\`\`
${fixed_code}
\`\`\`

Respond with JSON only, no markdown:
{
  "skill_score": number from 0-100,
  "bugs_fixed": "all" | "most" | "some" | "none",
  "correctness": "correct" | "partial" | "incorrect",
  "feedback": "2-3 sentences: which bugs were fixed, what was missed, one improvement tip"
}`;

  const aiResult = await generateJSON(prompt);

  const totalViolations = violation_count + camera_violation_count;
  const penalty = Math.min(totalViolations * 5, 25);
  const finalScore = Math.max(0, aiResult.skill_score - penalty);

  const result = await assessmentRepo.saveResult({
    user_id,
    type: 'bugfix',
    score: finalScore,
    session_id,
    metadata: {
      language, difficulty, challenge_title, description,
      original_buggy_code, fixed_code,
      violation_count, camera_violation_count, time_taken_seconds,
      ai_score: aiResult.skill_score,
      penalty_applied: penalty,
      bugs_fixed: aiResult.bugs_fixed,
      correctness: aiResult.correctness,
      feedback: aiResult.feedback
    }
  });

  return { ...result, feedback: aiResult.feedback, bugs_fixed: aiResult.bugs_fixed };
};

// ─── SUMMARY ──────────────────────────────────────────────────────────────────

const getAssessmentSummary = async (user_id) => {
  const results = await assessmentRepo.getResultsByUser(user_id);

  const summary = {
    typing: null, programming: null, flowchart: null,
    sql: null, bugfix: null, communication: null, overall_score: null
  };

  for (const r of results) {
    if (summary.hasOwnProperty(r.type) && !summary[r.type]) {
      summary[r.type] = r;
    }
  }

  const scores = Object.entries(summary)
    .filter(([key, r]) => key !== 'overall_score' && r && r.score !== null)
    .map(([, r]) => r.score);

  if (scores.length > 0) {
    summary.overall_score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  return summary;
};

module.exports = {
  submitTypingResult,
  getTypingText,
  generateChallenge,
  submitCodingResult,
  generateFlowchartProblem,
  submitFlowchartResult,
  generateSQLChallenge,
  submitSQLResult,
  generateBugFixChallenge,
  submitBugFixResult,
  getAssessmentSummary
};