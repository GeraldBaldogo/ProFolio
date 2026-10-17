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

// Ask the server to open an attempt. The id comes back inside a token the
// server signed, so it can't be made up or swapped at submit time.
const openAttempt = async (assessmentType) => {
  const res = await fetch(`${API}/api/proctoring/sessions`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ assessment_type: assessmentType }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.data?.session_token) throw new Error(json?.message || 'Couldn’t start this attempt.');
  return json.data; // { session_id, session_token }
};

/**
 * useProctoring
 *
 * Call this at the top of an assessment page. Opens an attempt on the server,
 * logs tab-switch / fullscreen / copy-paste (and, through logEvent, camera)
 * flags to it as they happen, and keeps counts for display.
 *
 * The server counts the flags itself when the result is submitted, so the
 * numbers sent from the browser can only ever add to the total.
 *
 * Options:
 *   - autoListen (default true): attach the document-level tab/copy/paste
 *     listeners. Pages that already watch these themselves pass false and
 *     call logEvent from their own handlers.
 *
 * Returns:
 *   - sessionId: the server's attempt id (null until it arrives)
 *   - getSessionToken(): resolves to the attempt token — send it as
 *     `session_token` with the result
 *   - logEvent(type, data): records a flag (camera types included)
 *   - resetSession(): call at the START of every new attempt (including
 *     retries); opens a fresh attempt and clears the counts
 *   - cameraViolationCount / tabViolationCount / violationCount: for display
 *   - getViolationCounts(): { camera_violation_count, violation_count }
 */
export function useProctoring(assessmentType, { autoListen = true } = {}) {
  const attemptRef = useRef(null);         // { session_id, session_token }
  const pendingRef = useRef(null);         // the open-attempt request in flight
  const queueRef = useRef([]);             // flags raised before the attempt arrived
  const generationRef = useRef(0);         // ignores replies for attempts already replaced
  const cameraCountRef = useRef(0);
  const tabCountRef = useRef(0);

  const [sessionId, setSessionId] = useState(null);
  const [cameraViolationCount, setCameraViolationCount] = useState(0);
  const [tabViolationCount, setTabViolationCount] = useState(0);

  const send = useCallback((session_id, event_type, event_data) => {
    fetch(`${API}/api/proctoring/events`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ session_id, assessment_type: assessmentType, event_type, event_data }),
    }).catch((err) => console.error('Proctoring log failed:', err));
  }, [assessmentType]);

  const start = useCallback(() => {
    const generation = ++generationRef.current;
    attemptRef.current = null;
    setSessionId(null);
    const tryOpen = (left) => openAttempt(assessmentType).catch((err) => {
      if (left <= 0) throw err;
      return new Promise((r) => setTimeout(r, 1500)).then(() => tryOpen(left - 1));
    });
    const p = tryOpen(2).then((attempt) => {
      if (generation !== generationRef.current) return attempt; // a newer attempt took over
      attemptRef.current = attempt;
      setSessionId(attempt.session_id);
      const queued = queueRef.current.splice(0);
      queued.forEach(({ event_type, event_data }) => send(attempt.session_id, event_type, event_data));
      return attempt;
    });
    p.catch((err) => console.error('Proctoring: could not open attempt —', err.message));
    pendingRef.current = p;
    return p;
  }, [assessmentType, send]);

  // Open an attempt as soon as the page loads.
  useEffect(() => { start() }, [start]);

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

    const attempt = attemptRef.current;
    if (attempt) send(attempt.session_id, event_type, event_data);
    else queueRef.current.push({ event_type, event_data });
  }, [send]);

  useEffect(() => {
    if (!autoListen) return undefined;
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
  }, [logEvent, autoListen]);

  const resetSession = useCallback(() => {
    queueRef.current = [];
    cameraCountRef.current = 0;
    tabCountRef.current = 0;
    setCameraViolationCount(0);
    setTabViolationCount(0);
    return start();
  }, [start]);

  // The token to submit with. Waits for the attempt if it's still opening,
  // and tries once more if opening failed (e.g. the server was waking up).
  const getSessionToken = useCallback(async () => {
    if (attemptRef.current) return attemptRef.current.session_token;
    try {
      return (await pendingRef.current).session_token;
    } catch {
      return (await start()).session_token;
    }
  }, [start]);

  const getViolationCounts = useCallback(() => ({
    camera_violation_count: cameraCountRef.current,
    violation_count: tabCountRef.current,
  }), []);

  return {
    sessionId,
    getSessionToken,
    logEvent,
    resetSession,
    cameraViolationCount,
    tabViolationCount,
    violationCount: cameraViolationCount + tabViolationCount, // combined, for pages tracking one type only
    getViolationCounts,
  };
}
