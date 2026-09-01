import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import StudentDashboard from './pages/student/StudentDashboard'
import PortfolioBuilder from './pages/student/PortfolioBuilder'
import ProtectedRoutes from './routes/ProtectedRoutes'
import EvaluatorDashboard from './pages/evaluator/EvaluatorDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import StudentProfile from './pages/student/StudentProfile'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminUsers from './pages/admin/AdminUsers'
import RecommendationsPage from './pages/student/RecommendationsPage'
import SQLAssessment from './pages/student/assessment/SQLAssessment'
import BugFixAssessment from './pages/student/assessment/BugFixAssessment'
import CVPage from './pages/student/CVPage'
import OriginalityCheck from './pages/student/OriginalityCheck'
import StudentAssignedTests from './pages/student/StudentAssignedTests'
import StudentResults from './pages/student/StudentResults'
import StudentAssistant from './pages/student/StudentAssistant'

// Assessment pages
import AssessmentDashboard from './pages/student/assessment/AssessmentDashboard'
import TypingAssessment from './pages/student/assessment/TypingAssessment'
import CodingAssessment from './pages/student/assessment/CodingAssessment'
import FlowchartAssessment from './pages/student/assessment/FlowchartAssessment'
import CommunicationAssessment from './pages/student/assessment/CommunicationAssessment'

// Messaging pages (student <-> professor chat)
import StudentMessagesPage from './pages/student/StudentMessagesPage'
import EvaluatorMessagesPage from './pages/evaluator/EvaluatorMessagesPage'
import ProfessorTests from './pages/evaluator/ProfessorTests'
import TestSubmissions from './pages/evaluator/TestSubmission'
import EvaluatorStudents from './pages/evaluator/EvaluatorStudents'

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
      <Route path="/student/profile" element={
        <ProtectedRoutes role="student"><StudentProfile /></ProtectedRoutes>
      } />
      <Route path="/student/recommendations" element={
        <ProtectedRoutes role="student"><RecommendationsPage /></ProtectedRoutes>
      } />
      <Route path="/student/assessment/sql" element={
        <ProtectedRoutes role="student"><SQLAssessment /></ProtectedRoutes>
      } />
      <Route path="/student/assessment/bugfix" element={
        <ProtectedRoutes role="student"><BugFixAssessment /></ProtectedRoutes>
      } />
      <Route path="/student/cv" element={
        <ProtectedRoutes role="student"><CVPage /></ProtectedRoutes>
      } />
      <Route path="/student/originality" element={
        <ProtectedRoutes role="student"><OriginalityCheck /></ProtectedRoutes>
      } />
      <Route path="/student/messages" element={
        <ProtectedRoutes role="student"><StudentMessagesPage /></ProtectedRoutes>
      } />
      <Route path="/student/assigned-tests" element={
        <ProtectedRoutes role="student"><StudentAssignedTests /></ProtectedRoutes>
      } />
      <Route path="/student/results" element={
        <ProtectedRoutes role="student"><StudentResults /></ProtectedRoutes>
      } />
      <Route path="/student/assistant" element={
        <ProtectedRoutes role="student"><StudentAssistant /></ProtectedRoutes>
      } />

      {/* Assessment routes */}
      <Route path="/student/assessment" element={
        <ProtectedRoutes role="student"><AssessmentDashboard /></ProtectedRoutes>
      } />
      <Route path="/student/assessment/communication" element={
        <ProtectedRoutes role="student"><CommunicationAssessment /></ProtectedRoutes>
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
      <Route path="/evaluator/students" element={
        <ProtectedRoutes role="evaluator"><EvaluatorStudents /></ProtectedRoutes>
      } />
      <Route path="/evaluator/tests" element={
        <ProtectedRoutes role="evaluator"><ProfessorTests /></ProtectedRoutes>
      } />
      <Route path="/evaluator/messages" element={
        <ProtectedRoutes role="evaluator"><EvaluatorMessagesPage /></ProtectedRoutes>
      } />
      <Route path="/evaluator/tests/:id/submissions" element={
        <ProtectedRoutes role="evaluator"><TestSubmissions /></ProtectedRoutes>
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