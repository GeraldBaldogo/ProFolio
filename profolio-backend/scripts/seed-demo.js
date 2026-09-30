/*
 * ─────────────────────────────────────────────────────────────────────────────
 * scripts/seed-demo.js — ready-made accounts and data for demonstrations
 *
 *   node scripts/seed-demo.js           create the demo data (skips if present)
 *   node scripts/seed-demo.js --reset   delete all demo data, then create it fresh
 *
 * Every demo account uses an @profolio.demo email. The script only ever
 * touches those accounts and what belongs to them — nobody else's data.
 *
 * What it creates:
 *   admin.demo@profolio.demo       Admin
 *   prof.demo@profolio.demo        Professor, approved, with 5 published tests
 *   maria.demo@profolio.demo       Student with a full profile and portfolio,
 *                                  4 graded tests (one reviewed by the
 *                                  professor), practice history and a message
 *   juan.demo@profolio.demo        New student with 2 tests still to take
 *
 * Not created, on purpose: CVs and recommendations. Generating them live is
 * the best part of a demo, and they need the AI anyway.
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const supabase = require('../src/config/db');

const PASSWORD = 'Demo@2026';
const DOMAIN = '@profolio.demo';

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * DAY).toISOString();
const daysFromNow = (n) => new Date(Date.now() + n * DAY).toISOString();

// ── small helpers ───────────────────────────────────────────────────────────
const must = (label) => ({ data, error }) => {
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
};
const insert = (table, rows) =>
  supabase.from(table).insert(rows).select().then(must(`insert into ${table}`));
const insertOne = async (table, row) => (await insert(table, [row]))[0];

// Deletes rows but doesn't stop on a table that doesn't exist in this
// database (older setups), so --reset works everywhere.
const remove = async (table, column, values) => {
  if (!values.length) return;
  const { error } = await supabase.from(table).delete().in(column, values);
  if (error && !/does not exist|schema cache/i.test(error.message)) {
    throw new Error(`delete from ${table}: ${error.message}`);
  }
};

const ids = (rows) => (rows || []).map((r) => r.id);

// ── reset ───────────────────────────────────────────────────────────────────
const reset = async () => {
  const users = await supabase.from('users').select('id').ilike('email', `%${DOMAIN}`).then(must('find demo users'));
  const userIds = ids(users);
  if (!userIds.length) { console.log('  no demo data to remove'); return; }

  const profiles = await supabase.from('student_profiles').select('id').in('user_id', userIds).then(must('find profiles'));
  const profileIds = ids(profiles);
  const portfolios = profileIds.length
    ? await supabase.from('portfolios').select('id').in('student_id', profileIds).then(must('find portfolios'))
    : [];
  const portfolioIds = ids(portfolios);
  const tests = await supabase.from('tests').select('id').in('professor_id', userIds).then(must('find tests'));
  const testIds = ids(tests);
  const convos = await supabase.from('conversations').select('id')
    .or(`student_id.in.(${userIds.join(',')}),professor_id.in.(${userIds.join(',')})`)
    .then(({ data }) => data || []);

  // Children first, then the rows they point to
  await remove('messages', 'conversation_id', ids(convos));
  await remove('conversations', 'id', ids(convos));
  for (const t of ['projects', 'skills', 'certifications', 'experiences', 'achievements', 'ai_evaluations', 'human_evaluations', 'evaluator_assignments']) {
    await remove(t, 'portfolio_id', portfolioIds);
  }
  await remove('portfolios', 'id', portfolioIds);
  await remove('cvs', 'student_id', profileIds);
  await remove('assessment_results', 'test_id', testIds);
  await remove('test_assignments', 'test_id', testIds);
  for (const t of ['assessment_results', 'proctoring_events', 'recommendations', 'originality_checks']) {
    await remove(t, 'user_id', userIds);
  }
  await remove('test_assignments', 'student_id', userIds);
  await remove('tests', 'id', testIds);
  await remove('student_profiles', 'user_id', userIds);
  await remove('professor_profiles', 'user_id', userIds);
  await remove('users', 'id', userIds);
  console.log(`  removed ${userIds.length} demo accounts and everything that belonged to them`);
};

// ── create ──────────────────────────────────────────────────────────────────
const createUser = async (full_name, email, role) => {
  const password_hash = await bcrypt.hash(PASSWORD, 10);
  const user = await insertOne('users', { full_name, email, password_hash, role, is_approved: true });
  if (role === 'student') await insertOne('student_profiles', { user_id: user.id });
  if (role === 'evaluator') await insertOne('professor_profiles', { user_id: user.id });
  return user;
};

const seed = async () => {
  const existing = await supabase.from('users').select('id').ilike('email', `%${DOMAIN}`).then(must('check existing'));
  if (existing.length) {
    console.log('  demo data already exists — run with --reset to start fresh');
    return false;
  }

  // Accounts
  await createUser('Demo Admin', `admin.demo${DOMAIN}`, 'admin');
  const prof = await createUser('Prof. Ana Reyes', `prof.demo${DOMAIN}`, 'evaluator');
  const maria = await createUser('Maria Santos', `maria.demo${DOMAIN}`, 'student');
  const juan = await createUser('Juan Dela Cruz', `juan.demo${DOMAIN}`, 'student');

  // Maria: a complete profile
  await supabase.from('student_profiles').update({
    professional_title: 'Aspiring Backend Developer',
    phone: '0917 555 0142',
    location: 'Morong, Rizal',
    course: 'BS Computer Science',
    school: 'Tomas Claudio Colleges',
    year_level: '4th Year',
    specialization: 'Software Engineering',
    expected_graduation: 'June 2027',
    academic_honors: 'Dean\u2019s Lister, 2024\u20132026',
    bio: 'Final-year Computer Science student who enjoys designing databases and building reliable back-end services.',
    career_goal: 'An entry-level back-end or full-stack developer role in a team that reviews code carefully.',
    github_url: 'https://github.com/example-maria',
    linkedin_url: 'https://www.linkedin.com/in/example-maria',
  }).eq('user_id', maria.id).then(must('update Maria\u2019s profile'));

  const mariaProfile = await supabase.from('student_profiles').select('id').eq('user_id', maria.id).single().then(must('find Maria\u2019s profile'));
  const portfolio = await insertOne('portfolios', { student_id: mariaProfile.id, status: 'draft' });
  const pf = portfolio.id;

  await insert('projects', [
    { portfolio_id: pf, title: 'Barangay Clearance Request System', description: 'Residents request clearances online; staff approve and print them. Cut the queue at the barangay hall from a morning to minutes.', tech_stack: 'PHP, MySQL, Bootstrap', github_url: 'https://github.com/example-maria/clearance', live_url: null },
    { portfolio_id: pf, title: 'Campus Event Finder', description: 'A mobile-first web app listing campus events with reminders and RSVPs.', tech_stack: 'React, Node.js, PostgreSQL', github_url: 'https://github.com/example-maria/events', live_url: 'https://example.com/events' },
  ]);
  await insert('skills', [
    { portfolio_id: pf, skill_name: 'Python', category: 'Language', self_rating: 8 },
    { portfolio_id: pf, skill_name: 'SQL', category: 'Database', self_rating: 9 },
    { portfolio_id: pf, skill_name: 'PostgreSQL', category: 'Database', self_rating: 7 },
    { portfolio_id: pf, skill_name: 'Node.js', category: 'Backend', self_rating: 7 },
    { portfolio_id: pf, skill_name: 'React', category: 'Frontend', self_rating: 6 },
    { portfolio_id: pf, skill_name: 'Git', category: 'Tools', self_rating: 8 },
  ]);
  await insert('certifications', [
    { portfolio_id: pf, title: 'Responsive Web Design', issuer: 'freeCodeCamp', issued_date: '2025-03-15', credential_url: 'https://www.freecodecamp.org/certification' },
    { portfolio_id: pf, title: 'SQL (Intermediate)', issuer: 'HackerRank', issued_date: '2025-08-02', credential_url: null },
  ]);
  await insert('experiences', [
    { portfolio_id: pf, company: 'Tomas Claudio Colleges', role: 'Student Assistant, IT Office', description: 'Maintained the lab inventory database and helped students with account issues.', start_date: '2025-08-01', is_current: true },
  ]);
  await insert('achievements', [
    { portfolio_id: pf, title: 'Finalist, Campus Hackathon 2025', description: 'Built a lost-and-found app in 24 hours with two classmates.', category: 'Competition', achieved_date: '2025-05-10' },
  ]);

  // The professor's tests — one of each kind a demo needs
  const T = async (type, title, level, minutes, config, description) =>
    insertOne('tests', { professor_id: prof.id, type, title, description, time_limit_minutes: minutes, is_published: true, config: { ...config, level } });

  const typing = await T('typing', 'Typing: technical documentation', 'medium', 2, {
    text_passage: 'A good commit message explains why a change was made, not only what changed. Keep the summary under fifty characters, leave a blank line, and describe the reasoning in the body so the next developer understands the decision.',
    duration_seconds: 60,
  }, 'Type the passage as quickly and accurately as you can.');
  const coding = await T('programming', 'Arrays: second largest value', 'hard', 20, {
    language: 'Python',
    problem_statement: 'Write second_largest(nums) that returns the second largest distinct value in a list of integers, or None if there is no such value. Do not sort the whole list.',
    starter_code: 'def second_largest(nums):\n    # your code here\n    pass\n',
  }, 'Handle duplicates and short lists.');
  const sql = await T('sql', 'SQL: enrolment report', 'medium', 15, {
    schema_sql: 'CREATE TABLE students (id INT PRIMARY KEY, name TEXT, program TEXT);\nCREATE TABLE enrolments (student_id INT, course TEXT, units INT);\nINSERT INTO students VALUES (1,\'Ana\',\'BSCS\'),(2,\'Ben\',\'BSIT\'),(3,\'Cai\',\'BSCS\');\nINSERT INTO enrolments VALUES (1,\'CS101\',3),(1,\'CS102\',3),(2,\'IT101\',3),(3,\'CS101\',3);',
    question: 'List each BSCS student with their total units, highest first.',
    solution_sql: 'SELECT s.name, SUM(e.units) AS total_units FROM students s JOIN enrolments e ON e.student_id = s.id WHERE s.program = \'BSCS\' GROUP BY s.name ORDER BY total_units DESC;',
  }, 'Join, filter and aggregate.');
  const comms = await T('communication', 'Email: explaining a delayed release', 'easy', 10, {
    prompt: 'Your team will miss Friday\u2019s release because of a failing payment test. Write a short email to the client explaining the delay, what you are doing about it, and the new date.',
    rubric: ['Apologises without over-explaining', 'Gives a specific new date'],
  }, 'Professional tone, clear next steps.');
  const bugfix = await T('bugfix', 'Debugging: shopping cart total', 'easy', 15, {
    language: 'JavaScript',
    buggy_code: 'function cartTotal(items) {\n  let total = 0;\n  for (let i = 0; i <= items.length; i++) {\n    total += items[i].price * items[i].qty;\n  }\n  return total.toFixed(2);\n}\n',
  }, 'Find and fix the bugs without rewriting the function.');

  // Assignments: Maria has finished four; Juan has two waiting
  await insert('test_assignments', [
    ...[typing, coding, sql, comms].map((t) => ({ test_id: t.id, student_id: maria.id, due_date: daysAgo(2), status: 'submitted' })),
    // Every row names its status: in a multi-row insert, a column one row
    // leaves out is sent as null (not the column default) for that row.
    { test_id: bugfix.id, student_id: juan.id, due_date: daysFromNow(7), status: 'pending' },
    { test_id: typing.id, student_id: juan.id, due_date: daysFromNow(7), status: 'pending' },
  ]);

  // Maria's graded results. Scores follow utils/rubrics.js exactly.
  await insert('assessment_results', [
    { user_id: maria.id, type: 'typing', test_id: typing.id, score: 77, created_at: daysAgo(12),
      metadata: { wpm: 64, accuracy: 97, difficulty: 'medium', violation_count: 0, penalty_applied: 0 } },
    { user_id: maria.id, type: 'programming', test_id: coding.id, score: 86, created_at: daysAgo(9),
      metadata: {
        language: 'Python', difficulty: 'hard', ai_score: 79, penalty_applied: 0, violation_count: 0, correctness: 'partial',
        criteria: { correctness: 8, problem_solving: 8, code_quality: 9, documentation: 6 },
        code: 'def second_largest(nums):\n    first = second = None\n    for n in nums:\n        if first is None or n > first:\n            first, second = n, first\n        elif n != first and (second is None or n > second):\n            second = n\n    return second\n',
        feedback: 'Single pass and handles duplicates. Clear names; a short comment on the tuple swap would help readers.',
        review: { status: 'adjusted', system_score: 79, final_score: 86, note: 'Handles the all-equal and single-item cases correctly on re-check; the AI missed that.', reviewed_by: prof.id, reviewed_at: daysAgo(8) },
      } },
    { user_id: maria.id, type: 'sql', test_id: sql.id, score: 88, created_at: daysAgo(6),
      metadata: {
        difficulty: 'medium', ai_score: 93, penalty_applied: 5, violation_count: 1, matches: true,
        criteria: { result: 10, query_design: 9, efficiency: 8, readability: 8 },
        sql_code: 'SELECT s.name, SUM(e.units) AS total_units\nFROM students s\nJOIN enrolments e ON e.student_id = s.id\nWHERE s.program = \'BSCS\'\nGROUP BY s.name\nORDER BY total_units DESC;',
        feedback: 'Correct result with a clean join and grouping. One tab switch was recorded during the attempt.',
      } },
    { user_id: maria.id, type: 'communication', test_id: comms.id, score: 77, created_at: daysAgo(3),
      metadata: {
        difficulty: 'easy', topic: 'client email', ai_score: 77, penalty_applied: 0, violation_count: 0, unproctored: true,
        criteria: { clarity: 7, structure: 7, professionalism: 8, grammar: 9 },
        clarity_score: 7, structure_score: 7, professionalism_score: 8, grammar_score: 9,
        feedback: 'Polite and well written. State the new release date earlier, in the first paragraph.',
      } },
    // Practice history — never reaches the CV, but shows up in results and levels
    { user_id: maria.id, type: 'sql', test_id: null, score: 72, created_at: daysAgo(20), metadata: { difficulty: 'easy', topic: 'joins' } },
    { user_id: maria.id, type: 'sql', test_id: null, score: 90, created_at: daysAgo(16), metadata: { difficulty: 'easy', topic: 'joins' } },
    { user_id: maria.id, type: 'typing', test_id: null, score: 70, created_at: daysAgo(18), metadata: { wpm: 55, accuracy: 94, difficulty: 'easy' } },
  ]);

  // A short conversation, so Messages isn't empty
  const convo = await insertOne('conversations', { student_id: maria.id, professor_id: prof.id });
  await insert('messages', [
    { conversation_id: convo.id, sender_id: prof.id, content: 'Hi Maria, I raised your programming score to 86 — your solution handles the edge cases the AI missed.', created_at: daysAgo(8) },
    { conversation_id: convo.id, sender_id: maria.id, content: 'Thank you, Ma\u2019am! I\u2019ll add a comment on the swap like the feedback said.', created_at: daysAgo(8) },
  ]);

  return true;
};

// ── run ─────────────────────────────────────────────────────────────────────
(async () => {
  const doReset = process.argv.includes('--reset');
  try {
    if (doReset) { console.log('Resetting demo data…'); await reset(); }
    console.log('Creating demo data…');
    const created = await seed();
    if (created) {
      console.log('\nDone. Sign in with any of these (password for all: ' + PASSWORD + '):\n');
      console.log('  Admin        admin.demo' + DOMAIN);
      console.log('  Professor    prof.demo' + DOMAIN + '    5 tests, Maria\u2019s submissions to review');
      console.log('  Student      maria.demo' + DOMAIN + '   full portfolio, 4 graded tests — generate her CV live');
      console.log('  New student  juan.demo' + DOMAIN + '    2 tests waiting to be taken');
    }
  } catch (err) {
    console.error('\nFailed:', err.message);
    console.error('Nothing outside the @profolio.demo accounts was changed.');
    // exitCode rather than process.exit(): on Windows, forcing an exit while
    // the Supabase connection is still closing crashes Node with
    // "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)".
    process.exitCode = 1;
  }
  // No process.exit() on success either: Node finishes on its own once the
  // connection closes, usually within a few seconds.
})();