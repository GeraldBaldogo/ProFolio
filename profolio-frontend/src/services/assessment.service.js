const API = import.meta.env.VITE_API_URL;

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

// Keeps the HTTP status on the error, so a page can tell "this level is
// locked" (403) apart from "the server is down".
const fail = (res, data) => Object.assign(new Error(data?.message || 'Request failed.'), { status: res.status });

// ─── TITLES ───────────────────────────────────────────────────────────────────

// Practice ranks and verified titles for every assessment type, each with the
// history of professor tests behind it.
export const getTitles = async () => {
  const res = await fetch(`${API}/api/assessments/titles`, { headers: authHeader() });
  const data = await res.json();
  if (!data.success) throw fail(res, data);
  return data.data;
};

// ─── PRACTICE PROGRESS ────────────────────────────────────────────────────────

// Which levels are open and which topics are passed. With a type, just that
// assessment; without, all of them.
export const getPracticeProgress = async (type = null) => {
  const res = await fetch(`${API}/api/assessments/progress${type ? `/${type}` : ''}`, {
    headers: authHeader()
  });
  const data = await res.json();
  if (!data.success) throw fail(res, data);
  return data.data;
};

// ─── TYPING ───────────────────────────────────────────────────────────────────

export const getTypingText = async (difficulty = 'easy') => {
  const res = await fetch(`${API}/api/assessments/typing/text?difficulty=${difficulty}`, {
    headers: authHeader()
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data.text;
};

export const submitTypingResult = async (payload) => {
  const res = await fetch(`${API}/api/assessments/typing/submit`, {
    method: 'POST', headers: authHeader(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

// ─── PROGRAMMING ──────────────────────────────────────────────────────────────

export const generateChallenge = async ({ language, difficulty, topic = null }) => {
  const res = await fetch(`${API}/api/assessments/coding/generate`, {
    method: 'POST', headers: authHeader(),
    body: JSON.stringify({ language, difficulty, topic })
  });
  const data = await res.json();
  if (!data.success) throw fail(res, data);
  return data.data;
};

export const submitCodingResult = async (payload) => {
  const res = await fetch(`${API}/api/assessments/coding/submit`, {
    method: 'POST', headers: authHeader(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

// ─── FLOWCHART ────────────────────────────────────────────────────────────────

export const generateFlowchartProblem = async ({ difficulty = null, topic = null } = {}) => {
  const q = new URLSearchParams();
  if (difficulty) q.set('difficulty', difficulty);
  if (topic) q.set('topic', topic);
  const res = await fetch(`${API}/api/assessments/flowchart/generate${q.toString() ? `?${q}` : ''}`, {
    headers: authHeader()
  });
  const data = await res.json();
  if (!data.success) throw fail(res, data);
  return data.data;
};

// A drawn flowchart sends its structure in `rest.diagram` alongside the image,
// so marking can read the shapes rather than only look at the picture.
export const submitFlowchartResult = async ({ imageFile, ...rest }) => {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
  const res = await fetch(`${API}/api/assessments/flowchart/submit`, {
    method: 'POST', headers: authHeader(),
    body: JSON.stringify({
      ...rest,
      image_base64: base64,
      image_type: imageFile.type,
    })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

// ─── SQL ──────────────────────────────────────────────────────────────────────

export const generateSQLChallenge = async ({ difficulty, topic = null }) => {
  const res = await fetch(`${API}/api/assessments/sql/generate`, {
    method: 'POST', headers: authHeader(),
    body: JSON.stringify({ difficulty, topic })
  });
  const data = await res.json();
  if (!data.success) throw fail(res, data);
  return data.data;
};

export const submitSQLResult = async (payload) => {
  const res = await fetch(`${API}/api/assessments/sql/submit`, {
    method: 'POST', headers: authHeader(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

// ─── BUG FIXING ───────────────────────────────────────────────────────────────

export const generateBugFixChallenge = async ({ language, difficulty, topic = null }) => {
  const res = await fetch(`${API}/api/assessments/bugfix/generate`, {
    method: 'POST', headers: authHeader(),
    body: JSON.stringify({ language, difficulty, topic })
  });
  const data = await res.json();
  if (!data.success) throw fail(res, data);
  return data.data;
};

export const submitBugFixResult = async (payload) => {
  const res = await fetch(`${API}/api/assessments/bugfix/submit`, {
    method: 'POST', headers: authHeader(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

// ─── SUMMARY & RESET ──────────────────────────────────────────────────────────

export const getAssessmentSummary = async () => {
  const res = await fetch(`${API}/api/assessments/summary`, {
    headers: authHeader()
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const resetAssessmentScores = async () => {
  const res = await fetch(`${API}/api/assessments/reset`, {
    method: 'DELETE', headers: authHeader()
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};