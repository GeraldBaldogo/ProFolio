import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import StudentDashboard from './pages/student/StudentDashboard'
import ProtectedRoutes from './routes/ProtectedRoutes'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/student/dashboard" element={
        <ProtectedRoutes role="student">
          <StudentDashboard />
        </ProtectedRoutes>
      } />
    </Routes>
  )
}

export default App