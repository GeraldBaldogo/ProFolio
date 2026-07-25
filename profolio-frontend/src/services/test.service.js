const API = import.meta.env.VITE_API_URL

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

// ─── PROFESSOR ────────────────────────────────────────────────────────────────

export const createTest = async (payload) => {
  const res = await fetch(`${API}/api/tests`, {
    method: 'POST', headers: authHeader(),
    body: JSON.stringify(payload)
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data.data
}

export const listMyTests = async () => {
  const res = await fetch(`${API}/api/tests/mine`, { headers: authHeader() })
  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data.data
}

export const updateTest = async (id, updates) => {
  const res = await fetch(`${API}/api/tests/${id}`, {
    method: 'PATCH', headers: authHeader(),
    body: JSON.stringify(updates)
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data.data
}

export const deleteTest = async (id) => {
  const res = await fetch(`${API}/api/tests/${id}`, {
    method: 'DELETE', headers: authHeader()
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data
}

export const assignTest = async (id, student_ids, due_date) => {
  const res = await fetch(`${API}/api/tests/${id}/assign`, {
    method: 'POST', headers: authHeader(),
    body: JSON.stringify({ student_ids, due_date })
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data.data
}

export const getAssignmentsForTest = async (id) => {
  const res = await fetch(`${API}/api/tests/${id}/assignments`, { headers: authHeader() })
  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data.data
}

// ─── STUDENT ──────────────────────────────────────────────────────────────────

export const getMyAssignedTests = async () => {
  const res = await fetch(`${API}/api/tests/assigned/mine`, { headers: authHeader() })
  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data.data
}

export const startAssignment = async (id) => {
  const res = await fetch(`${API}/api/tests/${id}/start`, {
    method: 'POST', headers: authHeader()
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data.data
}

// ─── SHARED ───────────────────────────────────────────────────────────────────

export const getTestById = async (id) => {
  const res = await fetch(`${API}/api/tests/${id}`, { headers: authHeader() })
  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data.data
}