const API = import.meta.env.VITE_API_URL;

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

export const sendChatMessage = async (message) => {
  const res = await fetch(`${API}/api/chatbot/message`, {
    method: 'POST', headers: authHeader(),
    body: JSON.stringify({ message })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data; // { reply }
};

export const getChatHistory = async () => {
  const res = await fetch(`${API}/api/chatbot/history`, {
    headers: authHeader()
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data; // [{ role, content, created_at }, ...]
};

export const clearChatHistory = async () => {
  const res = await fetch(`${API}/api/chatbot/history`, {
    method: 'DELETE', headers: authHeader()
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};