const API = import.meta.env.VITE_API_URL

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
})

// The CV routes return the row directly, not wrapped in { success, data } like
// the assessment routes do — so there's no .data to unwrap here.
const handle = async (res) => {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

// exclude: { projects: [ids], skills: [ids], certifications: [ids],
// experiences: [ids], achievements: [ids] } — what the student unticked.
export const generateCV = async (exclude) => {
  const res = await fetch(`${API}/api/cv/generate`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(exclude ? { exclude } : {}),
  })
  return handle(res)
}

// Everything that can go on the CV, for the "choose what to include" step.
export const getCVSources = async () => {
  const res = await fetch(`${API}/api/cv/sources`, { headers: authHeader() })
  return handle(res)
}

export const getLatestCV = async () => {
  const res = await fetch(`${API}/api/cv/latest`, { headers: authHeader() })
  return handle(res)
}

export const getCVHistory = async () => {
  const res = await fetch(`${API}/api/cv/history`, { headers: authHeader() })
  return handle(res)
}