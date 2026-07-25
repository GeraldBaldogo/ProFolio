import { useEffect, useRef, useCallback, useState } from 'react';

const API = import.meta.env.VITE_API_URL;

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

// Maps ProctoringCamera.jsx's violation names to this project's DB event_type values.
// ProctoringCamera reports: 'no_face' | 'multiple_faces' | 'looking_away'
const CAMERA_EVENT_MAP = {
  no_face: 'camera_no_face',
  multiple_faces: 'camera_multiple_faces',
  looking_away: 'camera_looking_away',
};
const CAMERA_EVENT_TYPES = ['camera_no_face', 'camera_multiple_faces', 'camera_looking_away'];

// Informational only — "back to normal" events aren't themselves violations,
// only the departure (tab_blur) is.
const NON_VIOLATION_EVENT_TYPES = ['tab_focus'];

/**
 * useProctoring
 *
 * Call this at the top of an assessment page. Generates a session_id for
 * this attempt, auto-logs tab-switch / fullscreen / copy-paste events, and
 * tracks camera vs tab/paste violation counts separately (matching your
 * backend's `camera_violation_count` and `violation_count` fields).
 *
 * Returns:
 *   - sessionId: pass to your "save result" API call
 *   - logEvent(type, data): call for camera-based flags, e.g.
 *     <ProctoringCamera onViolation={logEvent} ... />
 *   - resetSession(): call at the START of every new attempt (including
 *     retries) — otherwise session_id and counts leak across attempts
 *   - cameraViolationCount / tabViolationCount: reactive, for display
 *   - violationCount: combined total (kept for pages that only track one type)
 *   - getViolationCounts(): { camera_violation_count, violation_count } —
 *     reads directly from refs, safe to call at submit time even if a
 *     violation fired in the same tick as the submit click
 */
export function useProctoring(assessmentType) {
  const sessionIdRef = useRef(crypto.randomUUID());
  const cameraCountRef = useRef(0);
  const tabCountRef = useRef(0);

  const [cameraViolationCount, setCameraViolationCount] = useState(0);
  const [tabViolationCount, setTabViolationCount] = useState(0);

  const logEvent = useCallback((rawType, event_data = null) => {
    const event_type = CAMERA_EVENT_MAP[rawType] || rawType;

    if (!NON_VIOLATION_EVENT_TYPES.includes(event_type)) {
      if (CAMERA_EVENT_TYPES.includes(event_type)) {
        cameraCountRef.current += 1;
        setCameraViolationCount(cameraCountRef.current);
      } else {
        tabCountRef.current += 1;
        setTabViolationCount(tabCountRef.current);
      }
    }

    fetch(`${API}/api/proctoring/events`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({
        session_id: sessionIdRef.current,
        assessment_type: assessmentType,
        event_type,
        event_data,
      }),
    }).catch((err) => {
      console.error('Proctoring log failed:', err);
    });
  }, [assessmentType]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      logEvent(document.hidden ? 'tab_blur' : 'tab_focus');
    };
    const handleWindowBlur = () => logEvent('tab_blur');
    const handleWindowFocus = () => logEvent('tab_focus');
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) logEvent('fullscreen_exit');
    };
    const handleCopy = () => logEvent('copy_paste', { action: 'copy' });
    const handlePaste = () => logEvent('copy_paste', { action: 'paste' });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, [logEvent]);

  const resetSession = useCallback(() => {
    sessionIdRef.current = crypto.randomUUID();
    cameraCountRef.current = 0;
    tabCountRef.current = 0;
    setCameraViolationCount(0);
    setTabViolationCount(0);
  }, []);

  const getViolationCounts = useCallback(() => ({
    camera_violation_count: cameraCountRef.current,
    violation_count: tabCountRef.current,
  }), []);

  return {
    sessionId: sessionIdRef.current,
    logEvent,
    resetSession,
    cameraViolationCount,
    tabViolationCount,
    violationCount: cameraViolationCount + tabViolationCount, // combined, for pages tracking one type only
    getViolationCounts,
  };
}