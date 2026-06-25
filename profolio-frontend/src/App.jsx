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
import StudentProfile from './pages/student/StudentProfile'
import EvaluatorHistory from './pages/evaluator/EvaluatorHistory'
import EvaluatorAssigned from './pages/evaluator/EvaluatorAssigned'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminUsers from './pages/admin/AdminUsers'

// Assessment pages
import AssessmentDashboard from './pages/student/assessment/AssessmentDashboard'
import TypingAssessment from './pages/student/assessment/TypingAssessment'
import CodingAssessment from './pages/student/assessment/CodingAssessment'
import FlowchartAssessment from './pages/student/assessment/FlowchartAssessment'

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
      <Route path="/student/profile" element={
        <ProtectedRoutes role="student"><StudentProfile /></ProtectedRoutes>
      } />

      {/* Assessment routes */}
      <Route path="/student/assessment" element={
        <ProtectedRoutes role="student"><AssessmentDashboard /></ProtectedRoutes>
      } />
      <Route path="/student/assessment/typing" element={
        <ProtectedRoutes role="student"><TypingAssessment /></ProtectedRoutes>
      } />
      <Route path="/student/assessment/coding" element={
        <ProtectedRoutes role="student"><CodingAssessment /></ProtectedRoutes>
      } />
      <Route path="/student/assessment/flowchart" element={
        <ProtectedRoutes role="student"><FlowchartAssessment /></ProtectedRoutes>
      } />

      <Route path="/evaluator/dashboard" element={
        <ProtectedRoutes role="evaluator"><EvaluatorDashboard /></ProtectedRoutes>
      } />
      <Route path="/evaluator/assigned" element={
        <ProtectedRoutes role="evaluator"><EvaluatorAssigned /></ProtectedRoutes>
      } />
      <Route path="/evaluator/history" element={
        <ProtectedRoutes role="evaluator"><EvaluatorHistory /></ProtectedRoutes>
      } />
      <Route path="/admin/dashboard" element={
        <ProtectedRoutes role="admin"><AdminDashboard /></ProtectedRoutes>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoutes role="admin"><AdminUsers /></ProtectedRoutes>
      } />
      <Route path="/admin/analytics" element={
        <ProtectedRoutes role="admin"><AdminAnalytics /></ProtectedRoutes>
      } />
    </Routes>
  )
}

export default App