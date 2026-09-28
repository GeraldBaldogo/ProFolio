const supabase = require('../config/db');

const saveResult = async ({ user_id, type, score, metadata, session_id = null, test_id = null }) => {
  const { data, error } = await supabase
    .from('assessment_results')
    .insert({ user_id, type, score, metadata, session_id, test_id })
    .select()
    .single();

  if (error) throw { status: 500, message: error.message };
  return data;
};

const getResultsByUser = async (user_id) => {
  const { data, error } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) throw { status: 500, message: error.message };
  return data;
};

const getLatestByType = async (user_id, type) => {
  const { data, error } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('user_id', user_id)
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw { status: 500, message: error.message };
  return data || null;
};

const getLatestGradedByType = async (user_id, type) => {
  const { data: graded, error: gradedErr } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('user_id', user_id)
    .eq('type', type)
    .not('test_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);
 
  if (gradedErr) throw { status: 500, message: gradedErr.message };
  if (graded?.length) return { ...graded[0], is_graded: true };
 
  const { data: practice, error: practiceErr } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('user_id', user_id)
    .eq('type', type)
    .is('test_id', null)
    .order('score', { ascending: false })
    .limit(1);
 
  if (practiceErr) throw { status: 500, message: practiceErr.message };
  if (practice?.length) return { ...practice[0], is_graded: false };
 
  return null;
};

// Practice results only, and only the fields level-unlocking needs. Pulling
// difficulty and topic out of the JSON column here keeps the code and feedback
// text — often the bulk of a row — from being fetched just to be ignored.
const getPracticeScores = async (user_id) => {
  const { data, error } = await supabase
    .from('assessment_results')
    .select('type, score, difficulty:metadata->>difficulty, topic:metadata->>topic')
    .eq('user_id', user_id)
    .is('test_id', null);

  if (error) throw { status: 500, message: error.message };
  return data || [];
};

// Every result from a professor-assigned test, with the test's title and
// level and the name of the professor who set it — what a verified title is
// worked out from. Three small queries rather than a join, so it doesn't
// depend on how the foreign keys happen to be declared.
const getGradedResults = async (user_id) => {
  const { data: rows, error } = await supabase
    .from('assessment_results')
    .select('id, type, score, test_id, created_at')
    .eq('user_id', user_id)
    .not('test_id', 'is', null)
    .order('created_at', { ascending: false });
  if (error) throw { status: 500, message: error.message };
  if (!rows?.length) return [];

  const testIds = [...new Set(rows.map((r) => r.test_id))];
  const { data: tests, error: tErr } = await supabase
    .from('tests')
    .select('id, title, config, professor_id')
    .in('id', testIds);
  if (tErr) throw { status: 500, message: tErr.message };

  const profIds = [...new Set((tests || []).map((t) => t.professor_id).filter(Boolean))];
  let profs = [];
  if (profIds.length) {
    const { data, error: pErr } = await supabase.from('users').select('id, full_name').in('id', profIds);
    if (pErr) throw { status: 500, message: pErr.message };
    profs = data || [];
  }

  const testById = new Map((tests || []).map((t) => [t.id, t]));
  const profById = new Map(profs.map((p) => [p.id, p.full_name]));

  return rows.map((r) => {
    const t = testById.get(r.test_id);
    return {
      ...r,
      test: t ? {
        title: t.title,
        level: t.config?.level || null,
        professor_name: profById.get(t.professor_id) || null,
      } : null,
    };
  });
};

module.exports = { saveResult, getResultsByUser, getLatestByType, getLatestGradedByType, getPracticeScores, getGradedResults };