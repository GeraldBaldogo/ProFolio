import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import StudentDashboard from './pages/student/StudentDashboard'
import PortfolioBuilder from './pages/student/PortfolioBuilder'
import AIFeedbackPage from './pages/student/AIFeedbackPage'
import EvaluationResultPage from './pages/student/EvaluationResultPage'
import ProtectedRoutes from './routes/ProtectedRoutes'
import EvaluatorDashboard from './pages/evaluator/EvaluatorDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'

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
      <Route path="/evaluator/dashboard" element={
        <ProtectedRoutes role="evaluator"><EvaluatorDashboard /></ProtectedRoutes   >
      } />
      <Route path="/evaluator/assigned" element={
        <ProtectedRoutes role="evaluator"><EvaluatorDashboard /></ProtectedRoutes>
      } />
      <Route path="/evaluator/history" element={
        <ProtectedRoutes role="evaluator"><EvaluatorDashboard /></ProtectedRoutes>
      } />
      <Route path="/admin/dashboard" element={
        <ProtectedRoutes role="admin"><AdminDashboard /></ProtectedRoutes>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoutes role="admin"><AdminDashboard /></ProtectedRoutes>
      } />
      <Route path="/admin/analytics" element={
        <ProtectedRoutes role="admin"><AdminDashboard /></ProtectedRoutes>
      } />
    </Routes>
  )
}

export default App