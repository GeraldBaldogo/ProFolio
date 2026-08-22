const proctoringRepo = require('../repositories/proctoring.repo');

const VALID_ASSESSMENT_TYPES = ['typing', 'programming', 'flowchart', 'sql', 'bugfix', 'communication'];
const VALID_EVENT_TYPES = [
  'tab_blur', 'tab_focus', 'fullscreen_exit', 'copy_paste',
  'camera_no_face', 'camera_multiple_faces', 'camera_looking_away',
  'devtools_open'
];

const logEvent = async (user_id, { session_id, assessment_type, event_type, event_data }) => {
  if (!session_id) throw { status: 400, message: 'session_id is required.' };
  if (!VALID_ASSESSMENT_TYPES.includes(assessment_type)) {
    throw { status: 400, message: `Invalid assessment_type. Must be one of: ${VALID_ASSESSMENT_TYPES.join(', ')}` };
  }
  if (!VALID_EVENT_TYPES.includes(event_type)) {
    throw { status: 400, message: `Invalid event_type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}` };
  }

  return proctoringRepo.createEvent({ session_id, user_id, assessment_type, event_type, event_data: event_data || null });
};

const getSessionReport = async (session_id) => {
  const [events, summary] = await Promise.all([
    proctoringRepo.getEventsBySession(session_id),
    proctoringRepo.getViolationCounts(session_id),
  ]);
  return { session_id, summary, events };
};

const getStudentFlagHistory = async (user_id) => {
  throw { status: 501, message: 'Flag history is not available yet.' };
};

module.exports = { logEvent, getSessionReport, getStudentFlagHistory };