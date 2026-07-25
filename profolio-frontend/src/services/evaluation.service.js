const API = import.meta.env.VITE_API_URL

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

// ASSUMPTION: endpoint path guessed from evaluation.controller.js's
// getAssignedPortfolios function name - confirm/adjust if your actual
// evaluation.routes.js uses a different path.
export const getAssignedPortfolios = async () => {
  const res = await fetch(`${API}/api/evaluations/assigned`, { headers: authHeader() })
  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data.data
}