import axios from 'axios'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 from the sign-in endpoints just means "wrong password" or "Google
    // said no" — let the page show the message instead of reloading it.
    const url = error.config?.url || ''
    const isSignIn = /^\/?auth\/(login|register|google)/.test(url)
    if (error.response?.status === 401 && !isSignIn) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api