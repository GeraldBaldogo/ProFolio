const API = import.meta.env.VITE_API_URL

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

export const startConversation = async (other_user_id) => {
  const res = await fetch(`${API}/api/messages/conversations`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ other_user_id }),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Couldn\u2019t start the conversation.')
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

// Sends through a normal request rather than the live connection, so a
// message still goes out when the connection has dropped. The server then
// pushes it live to everyone in the conversation.
export const postMessage = async (conversationId, content) => {
  let res
  try {
    res = await fetch(`${API}/api/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ content }),
    })
  } catch {
    throw new Error('Couldn\u2019t reach the server. Check your connection and try again.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) throw new Error(data.message || 'Message not sent. Please try again.')
  return data.data
}

// who: 'student' | 'professor'. An empty nickname clears it.
export const setNickname = async (conversationId, who, nickname) => {
  let res
  try {
    res = await fetch(`${API}/api/messages/conversations/${conversationId}/nickname`, {
      method: 'PATCH',
      headers: authHeader(),
      body: JSON.stringify({ who, nickname }),
    })
  } catch {
    throw new Error('Couldn\u2019t reach the server. Check your connection and try again.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) throw new Error(data.message || 'Couldn\u2019t save the nickname.')
  return data.data
}