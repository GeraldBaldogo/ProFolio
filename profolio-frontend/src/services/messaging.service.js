const API = import.meta.env.VITE_API_URL

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

export const startConversation = async (other_user_id) => {
  const res = await fetch(`${API}/api/messages/conversations`, {
    method: 'POST', headers: authHeader(),
    body: JSON.stringify({ other_user_id })
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data.data
}

export const listConversations = async () => {
  const res = await fetch(`${API}/api/messages/conversations`, { headers: authHeader() })
  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data.data
}

export const getMessages = async (conversationId) => {
  const res = await fetch(`${API}/api/messages/conversations/${conversationId}/messages`, { headers: authHeader() })
  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data.data
}