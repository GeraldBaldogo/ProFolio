const { rubricPrompt, rubricJson, scoreFromCriteria, normalizeCriteria } = require('../utils/rubrics');
const { getModel } = require('../utils/gemini');
const assessmentRepo = require('../repositories/assessment.repo');
const testRepo = require('../repositories/test.repo');
const { assertNotOverdue } = require('./test.service');
const {
  runSql, signatureOf, signatureHash, isOrdered,
  sealChallenge, openChallenge, preview,
} = require('../utils/sqlSandbox');
const progress = require('./progress.service');
const { verifiedTitle } = require('../utils/titles');

// What an attempt earned, for the result screen. A verified title comes only
// from a professor's test and depends on the level that professor set; a
// practice attempt reports the practice rank instead.
const awardFor = async (user_id, type, test_id, score) => {
  if (test_id) {
    const test = await testRepo.findById(test_id);
    const award = verifiedTitle(type, test?.config?.level, score);
    return {
      title_awarded: award && { label: award.label, level: award.level, test_level: test?.config?.level || 'easy' },
      practice_rank: null,
    };
  }
  return { title_awarded: null, practice_rank: (await progress.getProgress(user_id, type)).rank };
};


// Helper: call Gemini and force a clean JSON response.
// imageParts (optional): array of { inlineData: { mimeType, data } } for vision inputs.
const generateJSON = async (prompt, imageParts = []) => {
  const model = getModel({
    model: 'gemini-3.6-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const contentParts = imageParts.length
    ? [...imageParts, { text: prompt }]
    : prompt;

  const result = await model.generateContent(contentParts);
  const raw = result.response.text().replace(/```json|```/g, '').trim();
  return JSON.parse(raw);
};

// ─── TEST-BACKED SUBMISSIONS ──────────────────────────────────────────────────
// Every submit below works two ways. With no test_id it's a practice attempt,
// exactly as before. With a test_id it's an answer to a professor's test, and
// the result is tied to that test.
//
// Every submit also carries unproctored / unproctored_reason, set when the
// student's device had no working camera. metadata is built by hand in each
// function, so a field that isn't named here is silently dropped — that's how
// test_id, is_approved and user_id each went missing once already.

// A student may only submit against a test that was actually assigned to them.
// Without this, anyone could post a test_id and attach a result to a test they
// were never given.

const resolveTest = async (user_id, test_id) => {
  if (!test_id) return null;
 
  const assignment = await testRepo.findAssignment(test_id, user_id);
  if (!assignment) {
    throw { status: 403, message: 'This test was not assigned to you.' };
  }
  if (assignment.status === 'submitted') {
    throw { status: 400, message: 'You have already submitted this test.' };
  }
  assertNotOverdue(assignment);                     // ← add
 
  return assignment;
};

// Called only after a result is saved, so a failed submission doesn't close the
// assignment and lock the student out of retrying.
const closeAssignment = async (user_id, test_id) => {
  if (!test_id) return;
  await testRepo.updateAssignmentStatus(test_id, user_id, 'submitted');
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
  violation_count = 0, camera_violation_count = 0, session_id = null,
  test_id = null,
  unproctored = false, unproctored_reason = null
}) => {
  if (wpm === undefined || wpm === null || accuracy === undefined || accuracy === null)
    throw { status: 400, message: 'wpm and accuracy are required.' };

  await resolveTest(user_id, test_id);

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
    test_id,
    metadata: {
      wpm, accuracy, time_seconds, difficulty,
      violation_count, camera_violation_count,
      penalty_applied: penalty,
      unproctored, unproctored_reason
    }
  });

  await closeAssignment(user_id, test_id);

  return result;
};

const getTypingText = ({ difficulty = 'easy' }) => {
  const texts = TYPING_TEXTS[difficulty] || TYPING_TEXTS.easy;
  return texts[Math.floor(Math.random() * texts.length)];
};

// ─── PROGRAMMING ──────────────────────────────────────────────────────────────

// Each practice challenge targets one curriculum topic, so passing it means
// something specific. The level must be unlocked; see progress.service.js.
const generateChallenge = async (user_id, { language, difficulty, topic: requestedTopic = null }) => {
  if (!language) throw { status: 400, message: 'language is required.' };

  const { difficulty: level, topic } = await progress.beginPractice(user_id, 'programming', difficulty, requestedTopic);

  const prompt = `Generate a coding challenge for a computer science student.

Language: ${language}
Level: ${level}
Topic: ${topic.label} — ${topic.brief}

The challenge must exercise this topic specifically and should be solvable in
the time limit. For object-oriented topics, require the student to write the
classes rather than a single function. For data structure and algorithm topics,
make the efficient approach matter.

Respond with JSON only, no markdown:
{
  "title": "short challenge title",
  "description": "clear problem statement, 2-4 sentences, saying exactly what to build",
  "example_input": "example input if applicable, or null",
  "example_output": "expected output if applicable, or null",
  "time_limit_minutes": ${level === 'hard' ? 20 : level === 'medium' ? 15 : 10}
}`;

  const challenge = await generateJSON(prompt);

  // The statement travels sealed with the topic, so marking uses the problem
  // the student was actually given, not whatever the page sends back.
  return {
    ...challenge,
    difficulty: level,
    topic: { key: topic.key, label: topic.label },
    progress_token: progress.sealPractice('programming', level, topic.key, {
      title: challenge.title, description: challenge.description,
    }),
  };
};

const submitCodingResult = async (user_id, {
  language, difficulty, challenge_title, code,
  progress_token = null,
  violation_count, camera_violation_count = 0, time_taken_seconds, session_id = null,
  test_id = null,
  unproctored = false, unproctored_reason = null
}) => {
  if (!code) throw { status: 400, message: 'code is required.' };

  await resolveTest(user_id, test_id);

  // Practice only: the sealed level, topic and problem statement.
  const practice = test_id ? { difficulty: null, topic: null, payload: null } : progress.readPractice(progress_token, 'programming');

  // On an assigned test the problem and its test cases are read from the
  // database rather than taken from the request — the same rule as SQL and
  // communication. Marking without the test cases meant judging code against
  // a title alone.
  const testCfg = test_id ? (await testRepo.findById(test_id))?.config || null : null;
  const cases = Array.isArray(testCfg?.test_cases)
    ? testCfg.test_cases.filter((t) => t?.input || t?.expected_output)
    : [];

  const level = practice.difficulty || difficulty;
  const title = testCfg?.title || practice.payload?.title || challenge_title;
  const statement = testCfg?.problem_statement || practice.payload?.description;

  const prompt = `You are evaluating a coding assessment submission for a student portfolio platform.

Language: ${language}
Difficulty: ${level}
Challenge: ${title}${statement ? `\nProblem statement: ${statement}` : ''}${cases.length ? `
The code must produce these results:
${cases.map((t) => `  input: ${t.input} → expected output: ${t.expected_output}`).join('\n')}
Trace the student's code against each one. Say which cases it would pass and which it would fail, and why.` : ''}
Tab/Paste Violations: ${violation_count}
Camera Violations: ${camera_violation_count}

Student code:
\`\`\`
${code}
\`\`\`

${rubricPrompt('programming')}

Respond with JSON only, no markdown:
{
  ${rubricJson('programming')}
  "skill_score": number from 0-100,
  "correctness": "correct" | "partial" | "incorrect",
  "feedback": "2-3 sentence evaluation: correctness, code quality, one improvement tip",
  "penalty_applied": boolean
}`;

  const aiResult = await generateJSON(prompt);

  // Weighted by utils/rubrics.js, not left to the model

  const rubricScore = scoreFromCriteria('programming', aiResult.criteria, aiResult.skill_score);

  const totalViolations = violation_count + camera_violation_count;
  const penalty = Math.min(totalViolations * 5, 25);
  const finalScore = Math.max(0, rubricScore - penalty);

  const result = await assessmentRepo.saveResult({
    user_id,
    type: 'programming',
    score: finalScore,
    session_id,
    test_id,
    metadata: {
      criteria: normalizeCriteria('programming', aiResult.criteria),
      language, difficulty: level, topic: practice.topic, challenge_title: title, code,
      violation_count, camera_violation_count, time_taken_seconds,
      ai_score: rubricScore,
      penalty_applied: penalty,
      correctness: aiResult.correctness,
      feedback: aiResult.feedback,
      unproctored, unproctored_reason
    }
  });

  await closeAssignment(user_id, test_id);

  // What this attempt earned, for the result screen. On a professor's test,
  // a verified title from the test's level and the score. On practice, the
  // practice rank as it now stands — never a verified title.
  const award = await awardFor(user_id, 'programming', test_id, finalScore);

  return { ...result, feedback: aiResult.feedback, correctness: aiResult.correctness, ...award };
};

// ─── FLOWCHART ────────────────────────────────────────────────────────────────

// The flowchart page has no level picker, so with no difficulty given the
// server hands out the next topic the student hasn't passed yet.
const generateFlowchartProblem = async (user_id, { difficulty = null, topic: requestedTopic = null } = {}) => {
  const { difficulty: level, topic } = await progress.beginPractice(user_id, 'flowchart', difficulty, requestedTopic);

  const prompt = `Generate a flowchart problem for a computer science student.

Level: ${level}
Topic: ${topic.label} — ${topic.brief}

The process must require exactly the structures this topic names, so a correct
flowchart has to use them. Keep it drawable on one sheet of paper.

Respond with JSON only, no markdown:
{
  "title": "short title",
  "description": "describe what process the student should create a flowchart for, 2-3 sentences",
  "hints": ["hint 1", "hint 2", "hint 3"]
}`;

  const problem = await generateJSON(prompt);
  return {
    ...problem,
    difficulty: level,
    topic: { key: topic.key, label: topic.label },
    progress_token: progress.sealPractice('flowchart', level, topic.key, {
      title: problem.title, description: problem.description,
    }),
  };
};

const submitFlowchartResult = async (user_id, {
  problem_title, difficulty = 'easy', image_base64, image_type,
  // Present when the student drew it in the app rather than on paper: the
  // actual shapes and arrows, not just a picture of them.
  diagram = null,
  progress_token = null,
  camera_violation_count = 0, session_id = null,
  test_id = null,
  unproctored = false, unproctored_reason = null
}) => {
  if (!image_base64) throw { status: 400, message: 'image_base64 is required.' };

  await resolveTest(user_id, test_id);

  const practice = test_id ? { difficulty: null, topic: null, payload: null } : progress.readPractice(progress_token, 'flowchart');
  const level = practice.difficulty || difficulty;
  const title = practice.payload?.title || problem_title;
  const statement = practice.payload?.description;

  // Drawn in the app: the structure is known exactly, so say so. Marking can
  // then name the shape at fault instead of guessing at a photograph.
  const structure = diagram?.nodes?.length
    ? `\n\nThe student drew this in the app, so here is its exact structure.
Shapes:
${diagram.nodes.map((n) => `  - ${n.kind}: "${n.label}"`).join('\n')}
Arrows:
${(diagram.edges || []).map((e) => `  - "${e.from}" → "${e.to}"${e.label ? ` [${e.label}]` : ''}`).join('\n') || '  (none)'}

Judge the logic from this structure; the image shows the same thing. Where
something is wrong, name the shape or arrow by its text.`
    : '\n\nThe student drew this on paper and photographed it, so read the image carefully.';

  const prompt = `This is a student-drawn flowchart for the problem: "${title}" (Difficulty: ${level}).${statement ? `\nThe process to diagram: ${statement}` : ''}${structure}

Evaluate the flowchart.
${rubricPrompt('flowchart')}

Respond with JSON only, no markdown:
{
  ${rubricJson('flowchart')}
  "skill_score": number from 0-100,
  "has_start_end": boolean,
  "has_decision_diamond": boolean,
  "logical_flow": "correct" | "partial" | "incorrect",
  "feedback": "2-3 sentences: what is good, what needs improvement"
}`;

  const imagePart = { inlineData: { mimeType: image_type || 'image/jpeg', data: image_base64 } };
  const aiResult = await generateJSON(prompt, [imagePart]);
  // Weighted by utils/rubrics.js, not left to the model
  const rubricScore = scoreFromCriteria('flowchart', aiResult.criteria, aiResult.skill_score);

  const penalty = Math.min(camera_violation_count * 5, 25);
  const finalScore = Math.max(0, rubricScore - penalty);

  const result = await assessmentRepo.saveResult({
    user_id,
    type: 'flowchart',
    score: finalScore,
    session_id,
    test_id,
    metadata: {
      criteria: normalizeCriteria('flowchart', aiResult.criteria),
      problem_title: title, difficulty: level, topic: practice.topic,
      drawn_in_app: !!diagram?.nodes?.length,
      diagram,
      camera_violation_count,
      penalty_applied: penalty,
      feedback: aiResult.feedback,
      has_start_end: aiResult.has_start_end,
      has_decision_diamond: aiResult.has_decision_diamond,
      logical_flow: aiResult.logical_flow,
      unproctored, unproctored_reason
    }
  });

  await closeAssignment(user_id, test_id);

  const award = await awardFor(user_id, 'flowchart', test_id, finalScore);

  return { ...result, feedback: aiResult.feedback, logical_flow: aiResult.logical_flow, ...award };
};

// ─── SQL ──────────────────────────────────────────────────────────────────────
//
// A SQL question means nothing without data to ask it of. Every challenge now
// carries real tables with real rows, the student's query is actually run
// against them, and the result is compared with a reference answer run against
// the same data. See utils/sqlSandbox.js.

const SQL_GUIDE = {
  easy:   'single table; SELECT with WHERE, ORDER BY, COUNT, or a simple INSERT, UPDATE or DELETE',
  medium: 'two or three tables; INNER or LEFT JOIN, GROUP BY, HAVING, COUNT, SUM, AVG',
  hard:   'three or four tables; subqueries, multiple JOINs, GROUP BY with HAVING, or an UPDATE/DELETE whose condition needs a subquery',
};

const sqlChallengePrompt = (difficulty, topic) => `Generate a SQL assessment challenge for a computer science student.

Difficulty: ${difficulty} — ${SQL_GUIDE[difficulty] || SQL_GUIDE.easy}
Topic: ${topic.label} — ${topic.brief}
The question must require this topic specifically.

The student will see the tables and their rows, write a query, and run it
against that data. Your reference answer will be run against the same data to
check theirs. So the schema and the answer must actually execute.

Rules:
- Write schema_sql in SQLite-compatible SQL: CREATE TABLE statements followed
  by INSERT statements. Use INTEGER, TEXT, REAL, DECIMAL(10,2), VARCHAR(n), DATE.
  Do not use AUTO_INCREMENT, ENUM, or engine options.
- Give every table a primary key. Name foreign key columns after the table
  they point to, e.g. customer_id referencing customers.customer_id.
- Insert 6 to 12 rows per table, varied enough that a wrong query gives a
  visibly different result from a right one.
- Store dates as 'YYYY-MM-DD' text. Do not rely on the current date, random
  values, or anything else that changes between runs.
- solution_sql must be a single statement that answers the question exactly.
  If it is a SELECT it must return at least one row. If the question asks for
  an order, use ORDER BY; if it doesn't, don't.
- The question must say precisely which columns to return, or precisely what
  to change, so there is one correct result.
- expected_output describes the result in words only. Never include the query.

Respond with JSON only, no markdown:
{
  "title": "short challenge title",
  "scenario": "one or two sentences describing the database",
  "schema_sql": "CREATE TABLE ...; INSERT INTO ...;",
  "question": "the task, 1-2 sentences, naming the exact columns or change required",
  "expected_output": "what the correct result looks like, in words",
  "solution_sql": "the reference query",
  "time_limit_minutes": ${difficulty === 'hard' ? 20 : difficulty === 'medium' ? 15 : 10}
}`;

// The AI occasionally writes a schema that doesn't load or an answer that
// returns nothing. Each attempt is run before it's accepted, so the student
// never receives a challenge that can't be answered.
const generateSQLChallenge = async (user_id, { difficulty = 'easy', topic: requestedTopic = null } = {}) => {
  const { difficulty: level, topic } = await progress.beginPractice(user_id, 'sql', difficulty, requestedTopic);
  let lastProblem = 'unknown';

  for (let attempt = 1; attempt <= 3; attempt++) {
    const ai = await generateJSON(sqlChallengePrompt(level, topic));
    if (!ai?.schema_sql || !ai?.solution_sql || !ai?.question) {
      lastProblem = 'missing fields';
      continue;
    }

    const reference = await runSql(ai.schema_sql, ai.solution_sql);
    if (!reference.ok) {
      lastProblem = `${reference.stage}: ${reference.error}`;
      continue;
    }
    const returnsRows = reference.result && reference.result.rows.length > 0;
    const changesData = !reference.result && reference.changes > 0;
    if (!returnsRows && !changesData) {
      lastProblem = 'reference answer produced nothing';
      continue;
    }

    const ordered = isOrdered(ai.solution_sql);

    // solution_sql is deliberately absent from what goes to the browser. It
    // travels only inside the sealed token, which the student cannot read.
    return {
      title: ai.title,
      scenario: ai.scenario,
      schema_sql: ai.schema_sql,
      question: ai.question,
      expected_output: ai.expected_output,
      time_limit_minutes: ai.time_limit_minutes,
      difficulty: level,
      topic: { key: topic.key, label: topic.label },
      challenge_token: progress.sealPractice('sql', level, topic.key, {
        schema_sql: ai.schema_sql,
        solution_sql: ai.solution_sql,
        question: ai.question,
      }),
      expected_signature: signatureHash(signatureOf(reference, ordered)),
      ordered,
    };
  }

  console.warn('[sql] challenge generation failed after 3 attempts:', lastProblem);
  throw { status: 502, message: 'Couldn\u2019t generate a working SQL challenge. Please try again.' };
};

// Where the reference answer comes from: the professor's test config for an
// assigned test, or the sealed token for a practice attempt. For a test, the
// question and schema are read from the database rather than trusted from
// the request, so they can't be swapped for easier ones.
const loadSqlReference = async (test_id, challenge_token) => {
  if (test_id) {
    const test = await testRepo.findById(test_id);
    const cfg = test?.config || {};
    return {
      schema_sql: cfg.schema_sql || null,
      // expected_query is the field's older name; tests saved before the
      // rename still mark correctly.
      solution_sql: cfg.solution_sql || cfg.expected_query || null,
      question: cfg.question || null,
    };
  }
  if (challenge_token) {
    try {
      const t = openChallenge(challenge_token);
      return { schema_sql: t.schema_sql, solution_sql: t.solution_sql, question: t.question };
    } catch {
      // Expired or tampered with. Mark by AI alone rather than fail the
      // submission outright.
    }
  }
  return { schema_sql: null, solution_sql: null, question: null };
};

// The data decides correctness; the AI only places the score within a band.
// This stops a wrong answer from being scored 95 because the query looked tidy.
const SQL_BANDS = {
  correct:   [75, 100],
  incorrect: [10, 70],
  error:     [0, 40],
};

const submitSQLResult = async (user_id, {
  difficulty, challenge_title, scenario, question, sql_code,
  challenge_token = null,
  violation_count, camera_violation_count = 0, time_taken_seconds, session_id = null,
  test_id = null,
  unproctored = false, unproctored_reason = null
}) => {
  if (!sql_code) throw { status: 400, message: 'sql_code is required.' };

  await resolveTest(user_id, test_id);

  const ref = await loadSqlReference(test_id, challenge_token);
  const officialQuestion = ref.question || question;
  const practice = test_id ? { difficulty: null, topic: null } : progress.readPractice(challenge_token, 'sql');
  const level = practice.difficulty || difficulty;

  // ── Run it ──
  let execution = null;
  if (ref.schema_sql) {
    const student = await runSql(ref.schema_sql, sql_code);
    const reference = ref.solution_sql ? await runSql(ref.schema_sql, ref.solution_sql) : null;

    let matches = null;
    if (student.ok && reference?.ok) {
      const ordered = isOrdered(ref.solution_sql);
      matches = signatureOf(student, ordered) === signatureOf(reference, ordered);
    }

    execution = {
      ran: student.ok,
      error: student.ok ? null : student.error,
      matches,
      verified: matches !== null || !student.ok,
      student_output: preview(student),
      expected_output: reference?.ok ? preview(reference) : null,
    };
  }

  const decided = !execution ? null
    : !execution.ran ? 'error'
    : execution.matches === true ? 'correct'
    : execution.matches === false ? 'incorrect'
    : null;

  // ── Feedback ──
  const facts = !execution
    ? 'The query could not be executed because no schema was provided. Judge it by reading it.'
    : !execution.ran
      ? `The query was executed and FAILED with this error: ${execution.error}`
      : `The query was executed successfully.
Its result: ${JSON.stringify(execution.student_output)}
${execution.expected_output ? `The correct result: ${JSON.stringify(execution.expected_output)}` : ''}
${decided ? `Verdict from execution: ${decided === 'correct' ? 'the result MATCHES the correct answer' : 'the result DOES NOT match the correct answer'}.` : ''}`;

  const prompt = `You are giving feedback on a SQL assessment submission for a student portfolio platform.

Difficulty: ${difficulty}
Challenge: ${challenge_title}
Scenario: ${scenario}
Question: ${officialQuestion}
Tab/Paste Violations: ${violation_count}
Camera Violations: ${camera_violation_count}

Student SQL:
\`\`\`sql
${sql_code}
\`\`\`

What happened when it ran:
${facts}

If an execution verdict is given above, it is final — do not contradict it.
Explain WHY the result is right or wrong in terms the student can act on. If it
is wrong, point to the specific clause at fault without writing the full
corrected query.

${rubricPrompt('sql')}

Respond with JSON only, no markdown:
{
  ${rubricJson('sql')}
  "skill_score": number from 0-100,
  "correctness": "correct" | "partial" | "incorrect",
  "syntax_valid": boolean,
  "feedback": "2-3 sentences: whether it is correct and why, query quality, one improvement tip"
}`;

  const aiResult = await generateJSON(prompt);

  // Weighted by utils/rubrics.js, not left to the model

  const rubricScore = scoreFromCriteria('sql', aiResult.criteria, aiResult.skill_score);

  let skill = rubricScore;
  let correctness = aiResult.correctness;
  let syntaxValid = aiResult.syntax_valid;
  if (decided) {
    const [lo, hi] = SQL_BANDS[decided];
    skill = Math.min(hi, Math.max(lo, skill));
    if (decided === 'correct') { correctness = 'correct'; syntaxValid = true; }
    if (decided === 'incorrect') { correctness = correctness === 'correct' ? 'partial' : correctness; syntaxValid = true; }
    if (decided === 'error') { correctness = 'incorrect'; syntaxValid = false; }
  }

  const totalViolations = violation_count + camera_violation_count;
  const penalty = Math.min(totalViolations * 5, 25);
  const finalScore = Math.max(0, skill - penalty);

  const result = await assessmentRepo.saveResult({
    user_id,
    type: 'sql',
    score: finalScore,
    session_id,
    test_id,
    metadata: {
      criteria: normalizeCriteria('sql', aiResult.criteria),
      difficulty: level, topic: practice.topic, challenge_title, scenario, question: officialQuestion, sql_code,
      violation_count, camera_violation_count, time_taken_seconds,
      ai_score: skill,
      penalty_applied: penalty,
      correctness,
      syntax_valid: syntaxValid,
      feedback: aiResult.feedback,
      // Shown to the professor beside the answer: whether the query ran, and
      // whether its output matched — evidence rather than opinion.
      execution: execution && {
        ran: execution.ran,
        error: execution.error,
        matches: execution.matches,
        verified: execution.verified,
        student_output: execution.student_output,
        expected_output: execution.expected_output,
      },
      unproctored, unproctored_reason
    }
  });

  await closeAssignment(user_id, test_id);

  const award = await awardFor(user_id, 'sql', test_id, finalScore);

  return {
    ...result,
    feedback: aiResult.feedback,
    correctness,
    execution: execution && { ran: execution.ran, error: execution.error, matches: execution.matches, verified: execution.verified },
    ...award,
  };
};

// ─── BUG FIXING ───────────────────────────────────────────────────────────────

const generateBugFixChallenge = async (user_id, { language, difficulty = 'easy', topic: requestedTopic = null }) => {
  if (!language) throw { status: 400, message: 'language is required.' };

  const { difficulty: level, topic } = await progress.beginPractice(user_id, 'bugfix', difficulty, requestedTopic);

  const prompt = `Generate a bug fixing challenge for a computer science student.

Language: ${language}
Level: ${level}
Topic: ${topic.label} — ${topic.brief}

Every bug planted must be of this kind. ${level === 'easy' ? 'Plant 1-2 bugs.' : level === 'medium' ? 'Plant 2-3 bugs.' : 'Plant 3-4 subtle bugs.'}
${level === 'medium' ? 'The code must be object-oriented: at least one class, with the bugs inside it.' : ''}

Respond with JSON only, no markdown:
{
  "title": "short challenge title",
  "description": "what the code is supposed to do, 1-2 sentences",
  "buggy_code": "the code with bugs inserted (10-25 lines)",
  "bug_count": number,
  "hints": ["hint about bug 1", "hint about bug 2"],
  "time_limit_minutes": ${level === 'hard' ? 20 : level === 'medium' ? 15 : 10}
}`;

  const challenge = await generateJSON(prompt);

  // The original buggy code is sealed too. Marking compares the student's fix
  // against what they were actually given, not a version the page sends back.
  return {
    ...challenge,
    difficulty: level,
    topic: { key: topic.key, label: topic.label },
    progress_token: progress.sealPractice('bugfix', level, topic.key, {
      title: challenge.title, description: challenge.description, buggy_code: challenge.buggy_code,
    }),
  };
};

const submitBugFixResult = async (user_id, {
  language, difficulty, challenge_title, description, original_buggy_code, fixed_code,
  progress_token = null,
  violation_count, camera_violation_count = 0, time_taken_seconds, session_id = null,
  test_id = null,
  unproctored = false, unproctored_reason = null
}) => {
  if (!fixed_code) throw { status: 400, message: 'fixed_code is required.' };

  await resolveTest(user_id, test_id);

  const practice = test_id ? { difficulty: null, topic: null, payload: null } : progress.readPractice(progress_token, 'bugfix');
  difficulty = practice.difficulty || difficulty;
  challenge_title = practice.payload?.title || challenge_title;
  description = practice.payload?.description || description;
  original_buggy_code = practice.payload?.buggy_code || original_buggy_code;

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

${rubricPrompt('bugfix')}

Respond with JSON only, no markdown:
{
  ${rubricJson('bugfix')}
  "skill_score": number from 0-100,
  "bugs_fixed": "all" | "most" | "some" | "none",
  "correctness": "correct" | "partial" | "incorrect",
  "feedback": "2-3 sentences: which bugs were fixed, what was missed, one improvement tip"
}`;

  const aiResult = await generateJSON(prompt);

  // Weighted by utils/rubrics.js, not left to the model

  const rubricScore = scoreFromCriteria('bugfix', aiResult.criteria, aiResult.skill_score);

  const totalViolations = violation_count + camera_violation_count;
  const penalty = Math.min(totalViolations * 5, 25);
  const finalScore = Math.max(0, rubricScore - penalty);

  const result = await assessmentRepo.saveResult({
    user_id,
    type: 'bugfix',
    score: finalScore,
    session_id,
    test_id,
    metadata: {
      criteria: normalizeCriteria('bugfix', aiResult.criteria),
      language, difficulty, topic: practice.topic, challenge_title, description,
      original_buggy_code, fixed_code,
      violation_count, camera_violation_count, time_taken_seconds,
      ai_score: rubricScore,
      penalty_applied: penalty,
      bugs_fixed: aiResult.bugs_fixed,
      correctness: aiResult.correctness,
      feedback: aiResult.feedback,
      unproctored, unproctored_reason
    }
  });

  await closeAssignment(user_id, test_id);

  const award = await awardFor(user_id, 'bugfix', test_id, finalScore);

  return { ...result, feedback: aiResult.feedback, bugs_fixed: aiResult.bugs_fixed, ...award };
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

const getMyResults = async (user_id) => {
  const results = await assessmentRepo.getResultsByUser(user_id);

  return (results || []).map((r) => ({
    id: r.id,
    type: r.type,
    score: r.score,
    test_id: r.test_id,
    created_at: r.created_at,
    metadata: {
      // Shared
      feedback: r.metadata?.overall_feedback || r.metadata?.feedback || null,
      difficulty: r.metadata?.difficulty || null,
      time_taken_seconds: r.metadata?.time_taken_seconds ?? r.metadata?.time_seconds ?? null,
      violation_count: r.metadata?.violation_count ?? 0,
      camera_violation_count: r.metadata?.camera_violation_count ?? 0,
      penalty_applied: r.metadata?.penalty_applied ?? 0,
      unproctored: r.metadata?.unproctored ?? false,
 
      // Type-specific, so they can see what they actually did
      wpm: r.metadata?.wpm ?? null,
      accuracy: r.metadata?.accuracy ?? null,
      correctness: r.metadata?.correctness || null,
      bugs_fixed: r.metadata?.bugs_fixed || null,
      logical_flow: r.metadata?.logical_flow || null,
      strengths: r.metadata?.strengths || null,
      improvements: r.metadata?.improvements || null,
      challenge_title: r.metadata?.challenge_title || r.metadata?.prompt_title || r.metadata?.problem_title || null,
    },
  }));
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
  resolveTest,
  getMyResults,
  getAssessmentSummary
};