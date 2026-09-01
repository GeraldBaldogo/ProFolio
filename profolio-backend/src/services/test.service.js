const testRepo = require('../repositories/test.repo');
const supabase = require('../config/db');

const VALID_TYPES = ['typing', 'programming', 'flowchart', 'sql', 'bugfix', 'communication'];

// Minimum required config fields per type - matches the shapes documented
// in profolio_tests_schema.sql
const REQUIRED_CONFIG_FIELDS = {
  typing: ['text_passage', 'duration_seconds'],
  programming: ['problem_statement', 'starter_code', 'language'],
  flowchart: ['scenario_description'],
  sql: ['schema_sql', 'question'],
  bugfix: ['buggy_code', 'language'],
  communication: ['prompt'],
};

const validateConfig = (type, config) => {
  if (!config || typeof config !== 'object') {
    throw { status: 400, message: 'config is required and must be an object.' };
  }
  const required = REQUIRED_CONFIG_FIELDS[type] || [];
  const missing = required.filter((field) => !config[field]);
  if (missing.length > 0) {
    throw { status: 400, message: `config is missing required field(s) for type "${type}": ${missing.join(', ')}` };
  }
};

const assertOwnsTest = (test, professor_id) => {
  if (test.professor_id !== professor_id) {
    throw { status: 403, message: 'You do not have permission to modify this test.' };
  }
};

const assertNotOverdue = (assignment) => {
  if (!assignment?.due_date) return;               // no deadline set
  if (assignment.status !== 'pending') return;     // already started, let them finish
  if (new Date(assignment.due_date) >= new Date()) return;
 
  const when = new Date(assignment.due_date).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
  throw { status: 403, message: `This test closed on ${when}.` };
};

const createTest = async (professor_id, { type, title, description, config, time_limit_minutes, is_published }) => {
  if (!VALID_TYPES.includes(type)) {
    throw { status: 400, message: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` };
  }
  if (!title || !title.trim()) throw { status: 400, message: 'title is required.' };
  validateConfig(type, config);

  return testRepo.createTest({ professor_id, type, title: title.trim(), description, config, time_limit_minutes, is_published });
};

const updateTest = async (test_id, professor_id, updates) => {
  const test = await testRepo.findById(test_id);
  if (!test) throw { status: 404, message: 'Test not found.' };
  assertOwnsTest(test, professor_id);

  if (updates.type && !VALID_TYPES.includes(updates.type)) {
    throw { status: 400, message: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` };
  }
  if (updates.config) {
    validateConfig(updates.type || test.type, updates.config);
  }

  return testRepo.updateTest(test_id, updates);
};

const listStudents = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('role', 'student')
    // A deactivated student can't sign in, so there's no point assigning to them.
    .neq('is_active', false)
    .order('full_name', { ascending: true });
  if (error) throw error;
  return data || [];
};

const deleteTest = async (test_id, professor_id) => {
  const test = await testRepo.findById(test_id);
  if (!test) throw { status: 404, message: 'Test not found.' };
  assertOwnsTest(test, professor_id);

  return testRepo.deleteTest(test_id);
};

const getById = async (test_id, requestingUser) => {
  const test = await testRepo.findById(test_id);
  if (!test) throw { status: 404, message: 'Test not found.' };

  if (requestingUser.role === 'admin') return test;
  if (requestingUser.role === 'evaluator' && test.professor_id === requestingUser.id) return test;

  // Students can only view a test if they've been assigned it
  if (requestingUser.role === 'student') {
    const assignment = await testRepo.findAssignment(test_id, requestingUser.id);
    if (assignment) return test;
  }

  throw { status: 403, message: 'You do not have permission to view this test.' };
};

const listMyTests = async (professor_id) => {
  return testRepo.findByProfessorId(professor_id);
};

const assignTest = async (test_id, professor_id, studentUserIds, due_date) => {
  const test = await testRepo.findById(test_id);
  if (!test) throw { status: 404, message: 'Test not found.' };
  assertOwnsTest(test, professor_id);

  if (!Array.isArray(studentUserIds) || studentUserIds.length === 0) {
    throw { status: 400, message: 'studentUserIds must be a non-empty array.' };
  }

  // Confirm every id actually belongs to a student - prevents accidentally
  // assigning a test to a non-student account.
  const { data: users, error } = await supabase
    .from('users')
    .select('id, role')
    .in('id', studentUserIds);
  if (error) throw error;

  const invalid = studentUserIds.filter((id) => {
    const u = users.find((u) => u.id === id);
    return !u || u.role !== 'student';
  });
  if (invalid.length > 0) {
    throw { status: 400, message: `These IDs are not valid students: ${invalid.join(', ')}` };
  }

  return testRepo.assignToStudents(test_id, studentUserIds, due_date);
};

const getAssignmentsForTest = async (test_id, professor_id) => {
  const test = await testRepo.findById(test_id);
  if (!test) throw { status: 404, message: 'Test not found.' };
  assertOwnsTest(test, professor_id);
 
  const [assignments, results] = await Promise.all([
    testRepo.findAssignmentsByTest(test_id),
    testRepo.findResultsByTest(test_id),
  ]);

  const resultByStudent = new Map();
  for (const r of results) {
    if (!resultByStudent.has(r.user_id)) resultByStudent.set(r.user_id, r);
  }
 
  return assignments.map((a) => ({
    ...a,
    result: resultByStudent.get(a.student_id) || null,
  }));
};
 
const getMyAssignedTests = async (student_id) => {
  return testRepo.findAssignmentsForStudent(student_id);
};

const startAssignment = async (test_id, student_id) => {
  const assignment = await testRepo.findAssignment(test_id, student_id);
  if (!assignment) throw { status: 404, message: 'This test was not assigned to you.' };
 
  assertNotOverdue(assignment);
 
  if (assignment.status === 'pending') {
    await testRepo.updateAssignmentStatus(test_id, student_id, 'in_progress');
  }
 
  const test = await testRepo.findById(test_id);
  return test;
};

const markAssignmentSubmitted = async (test_id, student_id) => {
  return testRepo.updateAssignmentStatus(test_id, student_id, 'submitted');
};

const getMyStudents = async (professor_id) => {
  const assignments = await testRepo.findAssignmentsByProfessor(professor_id);
  if (!assignments.length) return [];
 
  const testIds = [...new Set(assignments.map(a => a.test_id))];
  const results = await testRepo.findResultsByTestIds(testIds);
 
  // Newest result per student per test — a student could in principle have
  // more than one row, and the latest is the one that counts.
  const resultKey = (user_id, test_id) => `${user_id}::${test_id}`;
  const latest = new Map();
  for (const r of results) {
    const key = resultKey(r.user_id, r.test_id);
    if (!latest.has(key)) latest.set(key, r);
  }
 
  const byStudent = new Map();
 
  for (const a of assignments) {
    const id = a.student_id;
    if (!byStudent.has(id)) {
      byStudent.set(id, {
        id,
        full_name: a.users?.full_name || 'Student',
        email: a.users?.email || null,
        assignments: [],
      });
    }
 
    const result = latest.get(resultKey(id, a.test_id)) || null;
 
    byStudent.get(id).assignments.push({
      assignment_id: a.id,
      test_id: a.test_id,
      title: a.tests?.title || 'Test',
      type: a.tests?.type || null,
      status: a.status,
      due_date: a.due_date,
      assigned_at: a.assigned_at,
      score: result?.score ?? null,
      submitted_at: result?.created_at || null,
      flags: (result?.metadata?.violation_count || 0)
        + (result?.metadata?.camera_violation_count || 0),
      unproctored: !!result?.metadata?.unproctored,
      feedback: result?.metadata?.overall_feedback || result?.metadata?.feedback || null,
    });
  }
 
  // Each student's own numbers, worked out here so the page doesn't have to.
  return [...byStudent.values()].map((s) => {
    const scored = s.assignments.filter(a => a.score !== null);
    const submitted = s.assignments.filter(a => a.status === 'submitted');
    const overdue = s.assignments.filter(a =>
      a.status !== 'submitted' && a.due_date && new Date(a.due_date) < new Date()
    );
 
    return {
      ...s,
      assigned_count: s.assignments.length,
      submitted_count: submitted.length,
      overdue_count: overdue.length,
      flagged_count: s.assignments.filter(a => a.flags > 0 || a.unproctored).length,
      average: scored.length
        ? Math.round(scored.reduce((sum, a) => sum + a.score, 0) / scored.length)
        : null,
    };
  }).sort((a, b) => a.full_name.localeCompare(b.full_name));
};

const getMyProfessors = async (student_id) => {
  return testRepo.findProfessorsForStudent(student_id);
};

module.exports = {
  createTest,
  updateTest,
  deleteTest,
  getById,
  listMyTests,
  assignTest,
  getAssignmentsForTest,
  getMyAssignedTests,
  startAssignment,
  listStudents,
  assertNotOverdue,
  getMyStudents,
  getMyProfessors,
  markAssignmentSubmitted,
};