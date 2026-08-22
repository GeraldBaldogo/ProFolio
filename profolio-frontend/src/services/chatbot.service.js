const API = import.meta.env.VITE_API_URL

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
})

const handle = async (res) => {
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Request failed')
  return data.data
}

export const sendChatMessage = async (message) => {
  const res = await fetch(`${API}/api/chatbot/message`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ message }),
  })
  return handle(res)
}

export const getChatHistory = async () => {
  const res = await fetch(`${API}/api/chatbot/history`, { headers: authHeader() })
  return handle(res)
}

export const clearChatHistory = async () => {
  const res = await fetch(`${API}/api/chatbot/history`, {
    method: 'DELETE',
    headers: authHeader(),
  })
  return handle(res)
}