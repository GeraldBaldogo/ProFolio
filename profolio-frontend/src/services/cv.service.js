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

export const generateCV = async () => {
  const res = await fetch(`${API}/api/cv/generate`, {
    method: 'POST',
    headers: authHeader(),
  })
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