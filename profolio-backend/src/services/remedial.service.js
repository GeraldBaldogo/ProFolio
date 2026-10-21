// ─────────────────────────────────────────────────────────────────────────────
// src/services/remedial.service.js
//
// When a student FAILS an assigned test and the deadline hasn't passed, the
// system automatically builds a NEW AI test based on the one they failed (same
// type and level, fresh content) and assigns it to that student with the same
// deadline — a second chance, handed to them without the professor lifting a
// finger.
//
// It runs fire-and-forget after the student's result is saved, so it never
// slows down or breaks a submission: any failure here is logged and ignored.
// ─────────────────────────────────────────────────────────────────────────────

const testRepo = require('../repositories/test.repo');
const testService = require('./test.service');
const testAssistant = require('./testAssistant.service');

const PASS_MARK = 75;

// True only when the assignment is still open: no deadline, or a deadline that
// is still in the future.
const withinDeadline = (assignment) => {
  if (!assignment) return true;            // assigned but no row detail — don't block
  if (!assignment.due_date) return true;   // no deadline set → always open
  return new Date(assignment.due_date) >= new Date();
};

// Does the student already have an un-submitted remedial for this exact test?
// Keeps one failing student from piling up a new remedial on every attempt.
const hasPendingRemedial = async (student_id, base_test_id) => {
  const rows = await testRepo.findAssignmentsForStudent(student_id);
  return (rows || []).some(
    (a) => a.status !== 'submitted' && a.tests?.config?.remedial_of === base_test_id
  );
};

// student_id — who failed; test_id — the assigned test they failed (the ORIGINAL,
// never a retake id); score — their score; isRetake — true if this was a retake.
const maybeAssignRemedial = async ({ student_id, test_id, score, isRetake }) => {
  try {
    if (isRetake) return;                      // a retake is already their second chance
    if (!test_id) return;                      // practice attempt, nothing to remediate
    if (Number(score) >= PASS_MARK) return;    // passed — no remedial needed

    const base = await testRepo.findById(test_id);
    if (!base) return;
    if (base.config?.remedial_of) return;      // don't build a remedial of a remedial

    const assignment = await testRepo.findAssignment(test_id, student_id);
    if (!withinDeadline(assignment)) return;   // deadline passed — the window is closed

    if (await hasPendingRemedial(student_id, test_id)) return;

    // Ask the AI to build a fresh test based on the one they failed.
    const seed = 'Create a new remedial test based on this one — same type and level, but with fresh content (a different question/problem/passage), for a student who needs to retake it. Give a complete draft.';
    const result = await testAssistant.draftTest(base.professor_id, {
      type: base.type,
      base: { type: base.type, title: base.title, description: base.description, config: base.config || {} },
      messages: [{ role: 'user', content: seed }],
    });

    const draft = result?.draft;
    if (!result?.ready || !draft || !draft.type) return;   // AI couldn't produce a usable test

    const config = {
      ...(draft.config || {}),
      level: draft.level || base.config?.level,
      remedial_of: test_id,       // ties it back to the failed test (used for dedup + context)
      auto_generated: true,       // marks it as system-built, not hand-authored
    };

    // createTest runs the same validation a professor's save does (including a
    // real SQL check for sql tests); if the AI's draft doesn't pass, this throws
    // and the catch below simply skips the remedial for this attempt.
    const newTest = await testService.createTest(base.professor_id, {
      type: draft.type,
      title: `${base.title} — Remedial`,
      description: draft.description || base.description,
      config,
      time_limit_minutes: base.time_limit_minutes,
      is_published: true,
    });

    await testRepo.assignToStudents(newTest.id, [student_id], assignment?.due_date || null);
  } catch (err) {
    // A remedial is a nicety — never let it affect the student's own result.
    console.error('Auto-remedial skipped:', err?.message || err);
  }
};

// Prof-triggered batch: assign ONE fresh AI remedial to every student who has
// failed this test and doesn't already have a pending remedial for it. Used for
// students who failed BEFORE the automatic path existed, or whenever the
// professor wants to push a second chance out by hand. One AI call, one new
// test, assigned to all eligible students.
const assignRemedialToFailed = async (professor_id, test_id) => {
  const base = await testRepo.findById(test_id);
  if (!base) throw { status: 404, message: 'Test not found.' };
  if (base.professor_id !== professor_id) throw { status: 403, message: 'You do not have permission for this test.' };
  if (base.config?.remedial_of) throw { status: 400, message: 'This is already a remedial test.' };

  const results = await testRepo.findResultsByTest(test_id);
  const best = new Map();
  for (const r of results || []) {
    const s = Number(r.score);
    if (!Number.isFinite(s)) continue;
    if (!best.has(r.user_id) || s > best.get(r.user_id)) best.set(r.user_id, s);
  }
  const failed = [...best.entries()].filter(([, s]) => s < PASS_MARK).map(([uid]) => uid);
  if (!failed.length) return { assigned: 0, total_failed: 0, message: 'No students have failed this test yet.' };

  const eligible = [];
  for (const sid of failed) {
    if (!(await hasPendingRemedial(sid, test_id))) eligible.push(sid);
  }
  if (!eligible.length) {
    return { assigned: 0, total_failed: failed.length, message: 'Everyone who failed already has a pending remedial.' };
  }

  const seed = 'Create a new remedial test based on this one — same type and level, but with fresh content (a different question/problem/passage), for students who need to retake it. Give a complete draft.';
  const result = await testAssistant.draftTest(base.professor_id, {
    type: base.type,
    base: { type: base.type, title: base.title, description: base.description, config: base.config || {} },
    messages: [{ role: 'user', content: seed }],
  });
  const draft = result?.draft;
  if (!result?.ready || !draft || !draft.type) {
    throw { status: 502, message: 'The AI could not build a remedial test right now. Please try again.' };
  }

  const config = {
    ...(draft.config || {}),
    level: draft.level || base.config?.level,
    remedial_of: test_id,
    auto_generated: true,
  };
  const newTest = await testService.createTest(base.professor_id, {
    type: draft.type,
    title: `${base.title} — Remedial`,
    description: draft.description || base.description,
    config,
    time_limit_minutes: base.time_limit_minutes,
    is_published: true,
  });

  await testRepo.assignToStudents(newTest.id, eligible, null);
  return { assigned: eligible.length, total_failed: failed.length };
};

module.exports = { maybeAssignRemedial, assignRemedialToFailed };
