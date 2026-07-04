const API = import.meta.env.VITE_API_URL;

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

// ─── TYPING ───────────────────────────────────────────────────────────────────

export const getTypingText = async (difficulty = 'easy') => {
  const res = await fetch(`${API}/api/assessments/typing/text?difficulty=${difficulty}`, {
    headers: authHeader()
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data.text;
};

export const submitTypingResult = async ({ wpm, accuracy, time_seconds, difficulty, camera_violation_count = 0 }) => {
  const res = await fetch(`${API}/api/assessments/typing/submit`, {
    method: 'POST', headers: authHeader(),
    body: JSON.stringify({ wpm, accuracy, time_seconds, difficulty, camera_violation_count })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

// ─── PROGRAMMING ──────────────────────────────────────────────────────────────

export const generateChallenge = async ({ language, difficulty }) => {
  const res = await fetch(`${API}/api/assessments/coding/generate`, {
    method: 'POST', headers: authHeader(),
    body: JSON.stringify({ language, difficulty })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
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

export const generateFlowchartProblem = async (difficulty = 'easy') => {
  const res = await fetch(`${API}/api/assessments/flowchart/generate?difficulty=${difficulty}`, {
    headers: authHeader()
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const submitFlowchartResult = async ({ problem_title, difficulty, imageFile, camera_violation_count = 0 }) => {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
  const res = await fetch(`${API}/api/assessments/flowchart/submit`, {
    method: 'POST', headers: authHeader(),
    body: JSON.stringify({ problem_title, difficulty, image_base64: base64, image_type: imageFile.type, camera_violation_count })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

// ─── SQL ──────────────────────────────────────────────────────────────────────

export const generateSQLChallenge = async ({ difficulty }) => {
  const res = await fetch(`${API}/api/assessments/sql/generate`, {
    method: 'POST', headers: authHeader(),
    body: JSON.stringify({ difficulty })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
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

export const generateBugFixChallenge = async ({ language, difficulty }) => {
  const res = await fetch(`${API}/api/assessments/bugfix/generate`, {
    method: 'POST', headers: authHeader(),
    body: JSON.stringify({ language, difficulty })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
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