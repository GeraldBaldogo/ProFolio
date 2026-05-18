import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import StudentDashboard from './pages/student/StudentDashboard'
import PortfolioBuilder from './pages/student/PortfolioBuilder'
import AIFeedbackPage from './pages/student/AIFeedbackPage'
import EvaluationResultPage from './pages/student/EvaluationResultPage'
import ProtectedRoutes from './routes/ProtectedRoutes'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/student/dashboard" element={
        <ProtectedRoutes role="student"><StudentDashboard /></ProtectedRoutes>
      } />
      <Route path="/student/portfolio" element={
        <ProtectedRoutes role="student"><PortfolioBuilder /></ProtectedRoutes>
      } />
      <Route path="/student/ai-feedback" element={
        <ProtectedRoutes role="student"><AIFeedbackPage /></ProtectedRoutes>
      } />
      <Route path="/student/evaluation" element={
        <ProtectedRoutes role="student"><EvaluationResultPage /></ProtectedRoutes>
      } />
    </Routes>
  )
}

export default App