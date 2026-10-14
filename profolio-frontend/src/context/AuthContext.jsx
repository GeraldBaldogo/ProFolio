import { createContext, useContext, useState, useEffect } from 'react'
import { disconnectSocket } from '../services/socket'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token')
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser))
      setToken(savedToken)
    }
    setLoading(false)
  }, [])

  const login = (userData, userToken) => {
    // A connection opened for whoever was signed in before is closed; the next
    // getSocket() opens a fresh one with this user's token.
    disconnectSocket()
    setUser(userData)
    setToken(userToken)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', userToken)
  }

  // Merge changes into the signed-in user (e.g. a corrected name) so every
  // page that shows it updates at once, and it survives a refresh.
  const updateUser = (changes) => {
    setUser((prev) => {
      const next = { ...prev, ...changes }
      localStorage.setItem('user', JSON.stringify(next))
      return next
    })
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    // Close the live message connection too, so the next person to sign in
    // on this tab doesn't inherit it.
    disconnectSocket()
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)