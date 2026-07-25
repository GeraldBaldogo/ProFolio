const supabase = require('../config/db');

/**
 * Insert a single proctoring event (tab_blur, camera_no_face, copy_paste, etc.)
 */
async function createEvent({ session_id, assessment_type, event_type, event_data }) {
  const { data, error } = await supabase
    .from('proctoring_events')
    .insert([{ session_id, assessment_type, event_type, event_data }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all events for a given proctoring session (one attempt).
 */
async function getEventsBySession(session_id) {
  const { data, error } = await supabase
    .from('proctoring_events')
    .select('*')
    .eq('session_id', session_id)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Count violations for a session, split by camera vs tab/paste type,
 * matching the camera_violation_count / violation_count fields used
 * on the frontend (useProctoring.js).
 */
async function getViolationCounts(session_id) {
  const CAMERA_EVENT_TYPES = ['camera_no_face', 'camera_multiple_faces', 'camera_looking_away'];

  const { data, error } = await supabase
    .from('proctoring_events')
    .select('event_type')
    .eq('session_id', session_id);

  if (error) throw error;

  const camera_violation_count = data.filter((e) => CAMERA_EVENT_TYPES.includes(e.event_type)).length;
  const violation_count = data.filter(
    (e) => !CAMERA_EVENT_TYPES.includes(e.event_type) && e.event_type !== 'tab_focus'
  ).length;

  return { camera_violation_count, violation_count };
}

module.exports = {
  createEvent,
  getEventsBySession,
  getViolationCounts,
};