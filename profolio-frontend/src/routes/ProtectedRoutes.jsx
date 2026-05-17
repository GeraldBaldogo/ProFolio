import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060612] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (role && user.role !== role) {
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />
    if (user.role === 'evaluator') return <Navigate to="/evaluator/dashboard" replace />
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  }

  return children
}

export default ProtectedRoute