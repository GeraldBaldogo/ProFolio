/*
 * ─────────────────────────────────────────────────────────────────────────────
 * scripts/seed-demo.js — ready-made accounts and data for demonstrations
 *
 *   node scripts/seed-demo.js           create the demo data (skips if present)
 *   node scripts/seed-demo.js --reset   delete all demo data, then create it fresh
 *
 * Every demo account uses an @profolio.demo email. The script only ever
 * touches those accounts and what belongs to them — nobody else's data.
 * (--reset also clears out older demo accounts, e.g. maria.demo / juan.demo.)
 *
 * What it creates:
 *   admin.demo@profolio.demo   Admin
 *   roy@profolio.demo      Professor Roy Castillo, approved, 5 published tests
 *   gerald@profolio.demo       Student with a full profile and portfolio,
 *                              4 graded tests (one reviewed by the professor),
 *                              practice history and a message
 *   rafaela@profolio.demo      Student with a full profile and portfolio,
 *                              3 graded tests and 1 still to take
 *   jedrick@profolio.demo      Student with a full profile, 2 tests still to take
 *
 * All three students have complete profiles, so they go straight to the
 * dashboard instead of the first-time setup page.
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

// Fills in a student's profile and returns their student_profiles id.
const setProfile = async (user, fields) => {
  await supabase.from('student_profiles').update(fields).eq('user_id', user.id)
    .then(must(`update ${user.full_name}’s profile`));
  const row = await supabase.from('student_profiles').select('id').eq('user_id', user.id).single()
    .then(must(`find ${user.full_name}’s profile`));
  return row.id;
};

const seed = async () => {
  const existing = await supabase.from('users').select('id').ilike('email', `%${DOMAIN}`).then(must('check existing'));
  if (existing.length) {
    console.log('  demo data already exists — run with --reset to start fresh');
    return false;
  }

  // Accounts
  await createUser('Demo Admin', `admin.demo${DOMAIN}`, 'admin');
  const prof = await createUser('Roy Castillo', `roy${DOMAIN}`, 'evaluator');
  const gerald = await createUser('Gerald Baldogo', `gerald${DOMAIN}`, 'student');
  const rafaela = await createUser('Rafaela Morelos', `rafaela${DOMAIN}`, 'student');
  const jedrick = await createUser('Jedrick Peñaredondo', `jedrick${DOMAIN}`, 'student');

  // ── Gerald: complete profile and portfolio (back-end leaning) ─────────────
  const geraldProfile = await setProfile(gerald, {
    professional_title: 'Aspiring Backend Developer',
    phone: '0917 555 0142',
    location: 'Morong, Rizal',
    course: 'Bachelor of Science in Computer Science',
    school: 'Tomas Claudio Colleges',
    year_level: '4th Year',
    specialization: 'Software Engineering',
    expected_graduation: 'June 2027',
    academic_honors: 'Dean’s Lister, 2024–2026',
    bio: 'Final-year Computer Science student who enjoys designing databases and building reliable back-end services.',
    career_goal: 'An entry-level back-end or full-stack developer role in a team that reviews code carefully.',
    github_url: 'https://github.com/example-gerald',
    linkedin_url: 'https://www.linkedin.com/in/example-gerald',
  });

  const gp = (await insertOne('portfolios', { student_id: geraldProfile, status: 'draft' })).id;

  await insert('projects', [
    { portfolio_id: gp, title: 'Barangay Clearance Request System', description: 'Residents request clearances online; staff approve and print them. Cut the queue at the barangay hall from a morning to minutes.', tech_stack: 'PHP, MySQL, Bootstrap', github_url: 'https://github.com/example-gerald/clearance', live_url: null },
    { portfolio_id: gp, title: 'Campus Event Finder', description: 'A mobile-first web app listing campus events with reminders and RSVPs.', tech_stack: 'React, Node.js, PostgreSQL', github_url: 'https://github.com/example-gerald/events', live_url: 'https://example.com/events' },
  ]);
  await insert('skills', [
    { portfolio_id: gp, skill_name: 'Python', category: 'Language', self_rating: 8 },
    { portfolio_id: gp, skill_name: 'SQL', category: 'Database', self_rating: 9 },
    { portfolio_id: gp, skill_name: 'PostgreSQL', category: 'Database', self_rating: 7 },
    { portfolio_id: gp, skill_name: 'Node.js', category: 'Backend', self_rating: 7 },
    { portfolio_id: gp, skill_name: 'React', category: 'Frontend', self_rating: 6 },
    { portfolio_id: gp, skill_name: 'Git', category: 'Tools', self_rating: 8 },
  ]);
  await insert('certifications', [
    { portfolio_id: gp, title: 'Responsive Web Design', issuer: 'freeCodeCamp', issued_date: '2025-03-15', credential_url: 'https://www.freecodecamp.org/certification' },
    { portfolio_id: gp, title: 'SQL (Intermediate)', issuer: 'HackerRank', issued_date: '2025-08-02', credential_url: null },
  ]);
  await insert('experiences', [
    { portfolio_id: gp, company: 'Tomas Claudio Colleges', role: 'Student Assistant, IT Office', description: 'Maintained the lab inventory database and helped students with account issues.', start_date: '2025-08-01', is_current: true },
  ]);
  await insert('achievements', [
    { portfolio_id: gp, title: 'Finalist, Campus Hackathon 2025', description: 'Built a lost-and-found app in 24 hours with two classmates.', category: 'Competition', achieved_date: '2025-05-10' },
  ]);

  // ── Rafaela: complete profile and portfolio (front-end leaning) ───────────
  const rafaelaProfile = await setProfile(rafaela, {
    professional_title: 'Aspiring Front-End Developer',
    phone: '0918 555 0187',
    location: 'Morong, Rizal',
    course: 'Bachelor of Science in Computer Science',
    school: 'Tomas Claudio Colleges',
    year_level: '4th Year',
    specialization: 'Web Development',
    expected_graduation: 'June 2027',
    academic_honors: null,
    bio: 'Computer Science student who likes turning rough ideas into clean, accessible interfaces.',
    career_goal: 'A junior front-end or UI developer role where design and code are reviewed together.',
    github_url: 'https://github.com/example-rafaela',
    linkedin_url: 'https://www.linkedin.com/in/example-rafaela',
  });

  const rp = (await insertOne('portfolios', { student_id: rafaelaProfile, status: 'draft' })).id;

  await insert('projects', [
    { portfolio_id: rp, title: 'Café Ordering Kiosk', description: 'A touch-friendly ordering screen for a campus café, with a live queue board for the counter.', tech_stack: 'React, Tailwind CSS, Firebase', github_url: 'https://github.com/example-rafaela/kiosk', live_url: 'https://example.com/kiosk' },
    { portfolio_id: rp, title: 'Accessible Portfolio Template', description: 'A personal portfolio template that scores 100 on Lighthouse accessibility and works with a keyboard alone.', tech_stack: 'HTML, CSS, JavaScript', github_url: 'https://github.com/example-rafaela/portfolio', live_url: null },
  ]);
  await insert('skills', [
    { portfolio_id: rp, skill_name: 'JavaScript', category: 'Language', self_rating: 8 },
    { portfolio_id: rp, skill_name: 'React', category: 'Frontend', self_rating: 8 },
    { portfolio_id: rp, skill_name: 'Tailwind CSS', category: 'Frontend', self_rating: 9 },
    { portfolio_id: rp, skill_name: 'Figma', category: 'Design', self_rating: 7 },
    { portfolio_id: rp, skill_name: 'SQL', category: 'Database', self_rating: 6 },
  ]);
  await insert('certifications', [
    { portfolio_id: rp, title: 'JavaScript Algorithms and Data Structures', issuer: 'freeCodeCamp', issued_date: '2025-06-20', credential_url: 'https://www.freecodecamp.org/certification' },
  ]);
  await insert('achievements', [
    { portfolio_id: rp, title: 'Best UI, Campus Hackathon 2025', description: 'Designed and built the interface of a lost-and-found app in 24 hours.', category: 'Competition', achieved_date: '2025-05-10' },
  ]);

  // ── Jedrick: complete profile, nothing taken yet ──────────────────────────
  await setProfile(jedrick, {
    professional_title: 'Aspiring Software Developer',
    phone: '0919 555 0163',
    location: 'Morong, Rizal',
    course: 'Bachelor of Science in Computer Science',
    school: 'Tomas Claudio Colleges',
    year_level: '4th Year',
    expected_graduation: 'June 2027',
    career_goal: 'A software developer role where I can keep learning from senior engineers.',
  });

  // ── The professor's tests — one of each kind a demo needs ────────────────
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
    prompt: 'Your team will miss Friday’s release because of a failing payment test. Write a short email to the client explaining the delay, what you are doing about it, and the new date.',
    rubric: ['Apologises without over-explaining', 'Gives a specific new date'],
  }, 'Professional tone, clear next steps.');
  const bugfix = await T('bugfix', 'Debugging: shopping cart total', 'easy', 15, {
    language: 'JavaScript',
    buggy_code: 'function cartTotal(items) {\n  let total = 0;\n  for (let i = 0; i <= items.length; i++) {\n    total += items[i].price * items[i].qty;\n  }\n  return total.toFixed(2);\n}\n',
  }, 'Find and fix the bugs without rewriting the function.');

  // Assignments. Every row names its status: in a multi-row insert, a column
  // one row leaves out is sent as null (not the column default) for that row.
  await insert('test_assignments', [
    // Gerald has finished four
    ...[typing, coding, sql, comms].map((t) => ({ test_id: t.id, student_id: gerald.id, due_date: daysAgo(2), status: 'submitted' })),
    // Rafaela has finished three and has one waiting
    ...[comms, sql, coding].map((t) => ({ test_id: t.id, student_id: rafaela.id, due_date: daysAgo(2), status: 'submitted' })),
    { test_id: bugfix.id, student_id: rafaela.id, due_date: daysFromNow(5), status: 'pending' },
    // Jedrick has two waiting
    { test_id: bugfix.id, student_id: jedrick.id, due_date: daysFromNow(7), status: 'pending' },
    { test_id: typing.id, student_id: jedrick.id, due_date: daysFromNow(7), status: 'pending' },
  ]);

  // Graded results. Scores follow utils/rubrics.js: Gerald's are the original
  // demo figures; Rafaela's use the same mark on every criterion, so the
  // weighted score is exactly ten times that mark whatever the weights are.
  await insert('assessment_results', [
    // Gerald
    { user_id: gerald.id, type: 'typing', test_id: typing.id, score: 77, created_at: daysAgo(12),
      metadata: { wpm: 64, accuracy: 97, difficulty: 'medium', violation_count: 0, penalty_applied: 0 } },
    { user_id: gerald.id, type: 'programming', test_id: coding.id, score: 86, created_at: daysAgo(9),
      metadata: {
        language: 'Python', difficulty: 'hard', ai_score: 79, penalty_applied: 0, violation_count: 0, correctness: 'partial',
        criteria: { correctness: 8, problem_solving: 8, code_quality: 9, documentation: 6 },
        code: 'def second_largest(nums):\n    first = second = None\n    for n in nums:\n        if first is None or n > first:\n            first, second = n, first\n        elif n != first and (second is None or n > second):\n            second = n\n    return second\n',
        feedback: 'Single pass and handles duplicates. Clear names; a short comment on the tuple swap would help readers.',
        review: { status: 'adjusted', system_score: 79, final_score: 86, note: 'Handles the all-equal and single-item cases correctly on re-check; the AI missed that.', reviewed_by: prof.id, reviewed_at: daysAgo(8) },
      } },
    { user_id: gerald.id, type: 'sql', test_id: sql.id, score: 88, created_at: daysAgo(6),
      metadata: {
        difficulty: 'medium', ai_score: 93, penalty_applied: 5, violation_count: 1, matches: true,
        criteria: { result: 10, query_design: 9, efficiency: 8, readability: 8 },
        sql_code: 'SELECT s.name, SUM(e.units) AS total_units\nFROM students s\nJOIN enrolments e ON e.student_id = s.id\nWHERE s.program = \'BSCS\'\nGROUP BY s.name\nORDER BY total_units DESC;',
        feedback: 'Correct result with a clean join and grouping. One tab switch was recorded during the attempt.',
      } },
    { user_id: gerald.id, type: 'communication', test_id: comms.id, score: 77, created_at: daysAgo(3),
      metadata: {
        difficulty: 'easy', topic: 'client email', ai_score: 77, penalty_applied: 0, violation_count: 0, unproctored: true,
        criteria: { clarity: 7, structure: 7, professionalism: 8, grammar: 9 },
        clarity_score: 7, structure_score: 7, professionalism_score: 8, grammar_score: 9,
        feedback: 'Polite and well written. State the new release date earlier, in the first paragraph.',
      } },
    // Gerald's practice history — never reaches the CV, but shows up in results and levels
    { user_id: gerald.id, type: 'sql', test_id: null, score: 72, created_at: daysAgo(20), metadata: { difficulty: 'easy', topic: 'joins' } },
    { user_id: gerald.id, type: 'sql', test_id: null, score: 90, created_at: daysAgo(16), metadata: { difficulty: 'easy', topic: 'joins' } },
    { user_id: gerald.id, type: 'typing', test_id: null, score: 70, created_at: daysAgo(18), metadata: { wpm: 55, accuracy: 94, difficulty: 'easy' } },

    // Rafaela — strongest in communication, still growing in programming
    { user_id: rafaela.id, type: 'communication', test_id: comms.id, score: 90, created_at: daysAgo(10),
      metadata: {
        difficulty: 'easy', topic: 'client email', ai_score: 90, penalty_applied: 0, violation_count: 0,
        criteria: { clarity: 9, structure: 9, professionalism: 9, grammar: 9 },
        clarity_score: 9, structure_score: 9, professionalism_score: 9, grammar_score: 9,
        feedback: 'Clear and well organised: the new date is in the first paragraph and the next steps are easy to follow.',
      } },
    { user_id: rafaela.id, type: 'sql', test_id: sql.id, score: 80, created_at: daysAgo(7),
      metadata: {
        difficulty: 'medium', ai_score: 80, penalty_applied: 0, violation_count: 0, matches: false,
        criteria: { result: 8, query_design: 8, efficiency: 8, readability: 8 },
        sql_code: 'SELECT s.name, SUM(e.units) AS total_units\nFROM students s\nJOIN enrolments e ON e.student_id = s.id\nWHERE s.program = \'BSCS\'\nGROUP BY s.name\nORDER BY total_units;',
        feedback: 'Right join, filter and totals, but the list is lowest first. Add DESC to the ORDER BY.',
      } },
    { user_id: rafaela.id, type: 'programming', test_id: coding.id, score: 70, created_at: daysAgo(4),
      metadata: {
        language: 'Python', difficulty: 'hard', ai_score: 70, penalty_applied: 0, violation_count: 0, correctness: 'partial',
        criteria: { correctness: 7, problem_solving: 7, code_quality: 7, documentation: 7 },
        code: 'def second_largest(nums):\n    unique = list(set(nums))\n    if len(unique) < 2:\n        return None\n    unique.remove(max(unique))\n    return max(unique)\n',
        feedback: 'Correct on duplicates and short lists. It makes extra passes over the data; try tracking the top two values in one loop.',
      } },
    // Rafaela's practice history
    { user_id: rafaela.id, type: 'typing', test_id: null, score: 80, created_at: daysAgo(14), metadata: { wpm: 68, accuracy: 96, difficulty: 'easy' } },
  ]);

  // A short conversation, so Messages isn't empty
  const convo = await insertOne('conversations', { student_id: gerald.id, professor_id: prof.id });
  await insert('messages', [
    { conversation_id: convo.id, sender_id: prof.id, content: 'Hi Gerald, I raised your programming score to 86 — your solution handles the edge cases the AI missed.', created_at: daysAgo(8) },
    { conversation_id: convo.id, sender_id: gerald.id, content: 'Thank you, Sir! I’ll add a comment on the swap like the feedback said.', created_at: daysAgo(8) },
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
      console.log('  Admin      admin.demo' + DOMAIN);
      console.log('  Professor  roy' + DOMAIN + '   Roy Castillo — 5 tests, submissions to review');
      console.log('  Student    gerald' + DOMAIN + '    Gerald Baldogo — full portfolio, 4 graded tests');
      console.log('  Student    rafaela' + DOMAIN + '   Rafaela Morelos — full portfolio, 3 graded, 1 to take');
      console.log('  Student    jedrick' + DOMAIN + '   Jedrick Peñaredondo — 2 tests waiting to be taken');
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