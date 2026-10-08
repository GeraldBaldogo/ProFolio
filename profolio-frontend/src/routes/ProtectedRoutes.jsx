import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { checkProfileComplete } from '../utils/profileSetup'

const Spinner = () => (
  <div className="min-h-screen bg-[#060612] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

// Students finish the setup page once before anything else. The check runs
// once per sign-in (it's remembered), so moving between pages stays instant.
const RequireProfile = ({ user, children }) => {
  const [state, setState] = useState('checking') // checking | ok | incomplete

  useEffect(() => {
    let alive = true
    checkProfileComplete(user)
      .then((ok) => { if (alive) setState(ok ? 'ok' : 'incomplete') })
      // If the check itself fails (server asleep, offline), let them in rather
      // than locking them out — the next page load will check again.
      .catch(() => { if (alive) setState('ok') })
    return () => { alive = false }
  }, [user])

  if (state === 'checking') return <Spinner />
  if (state === 'incomplete') return <Navigate to="/student/setup" replace />
  return children
}

// allowIncompleteProfile: only the setup page itself uses this.
const ProtectedRoute = ({ children, role, allowIncompleteProfile = false }) => {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />

  if (!user) return <Navigate to="/login" replace />

  if (role && user.role !== role) {
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />
    if (user.role === 'evaluator') return <Navigate to="/evaluator/dashboard" replace />
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  }

  if (user.role === 'student' && !allowIncompleteProfile) {
    return <RequireProfile user={user}>{children}</RequireProfile>
  }

  return children
}

export default ProtectedRoute