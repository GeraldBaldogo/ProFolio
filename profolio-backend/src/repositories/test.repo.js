const supabase = require('../config/db');

// ─── TESTS (professor-authored) ────────────────────────────────────────────

const createTest = async ({ professor_id, type, title, description, config, time_limit_minutes, is_published }) => {
  const { data, error } = await supabase
    .from('tests')
    .insert([{ professor_id, type, title, description, config, time_limit_minutes, is_published: !!is_published }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

const findById = async (id) => {
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
};

const findByProfessorId = async (professor_id) => {
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('professor_id', professor_id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

const updateTest = async (id, updates) => {
  const { data, error } = await supabase
    .from('tests')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const deleteTest = async (id) => {
  const { error } = await supabase.from('tests').delete().eq('id', id);
  if (error) throw error;
  return true;
};

// ─── TEST ASSIGNMENTS ───────────────────────────────────────────────────────

const assignToStudents = async (test_id, studentUserIds, due_date) => {
  const rows = studentUserIds.map((student_id) => ({
    test_id,
    student_id,
    due_date: due_date || null,
  }));

  const { data, error } = await supabase
    .from('test_assignments')
    .upsert(rows, { onConflict: 'test_id,student_id', ignoreDuplicates: true })
    .select();
  if (error) throw error;
  return data;
};

const findAssignmentsByTest = async (test_id) => {
  const { data, error } = await supabase
    .from('test_assignments')
    .select(`
      *,
      users:student_id (full_name, email)
    `)
    .eq('test_id', test_id)
    .order('assigned_at', { ascending: false });

  if (error) {
    const { data: fallback, error: err2 } = await supabase
      .from('test_assignments')
      .select('*')
      .eq('test_id', test_id)
      .order('assigned_at', { ascending: false });
    if (err2) throw err2;
    return fallback;
  }
  return data;
};

const findAssignmentsForStudent = async (student_id) => {
  const { data, error } = await supabase
    .from('test_assignments')
    .select(`
      *,
      tests (*)
    `)
    .eq('student_id', student_id)
    .order('assigned_at', { ascending: false });
  if (error) throw error;
  return data;
};

const findAssignment = async (test_id, student_id) => {
  const { data, error } = await supabase
    .from('test_assignments')
    .select('*')
    .eq('test_id', test_id)
    .eq('student_id', student_id)
    .single();
  if (error) return null;
  return data;
};

const updateAssignmentStatus = async (test_id, student_id, status) => {
  const { data, error } = await supabase
    .from('test_assignments')
    .update({ status })
    .eq('test_id', test_id)
    .eq('student_id', student_id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const findResultsByTest = async (test_id) => {
  const { data, error } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('test_id', test_id)
    .order('created_at', { ascending: false });
 
  if (error) throw error;
  return data || [];
};

const findAssignmentsByProfessor = async (professor_id) => {
  const { data: tests, error: testErr } = await supabase
    .from('tests')
    .select('id')
    .eq('professor_id', professor_id);
 
  if (testErr) throw testErr;
  const testIds = (tests || []).map(t => t.id);
  if (!testIds.length) return [];
 
  const { data, error } = await supabase
    .from('test_assignments')
    .select(`
      *,
      users:student_id (id, full_name, email),
      tests (id, title, type)
    `)
    .in('test_id', testIds)
    .order('assigned_at', { ascending: false });
 
  if (error) throw error;
  return data || [];
};
 
const findResultsByTestIds = async (testIds) => {
  if (!testIds?.length) return [];
 
  const { data, error } = await supabase
    .from('assessment_results')
    .select('*')
    .in('test_id', testIds)
    .order('created_at', { ascending: false });
 
  if (error) throw error;
  return data || [];
};

module.exports = {
  createTest,
  findById,
  findByProfessorId,
  updateTest,
  deleteTest,
  assignToStudents,
  findAssignmentsByTest,
  findAssignmentsForStudent,
  findAssignment,
  findResultsByTest,
  findAssignmentsByProfessor,
  findResultsByTestIds,
  updateAssignmentStatus,
};