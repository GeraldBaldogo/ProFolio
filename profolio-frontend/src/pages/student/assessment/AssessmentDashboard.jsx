import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faFolder, faUser, faBars, faTimes,
  faTrophy, faRightFromBracket, faKeyboard, faCode, faDiagramProject, faWandMagicSparkles, 
  faDatabase, faBug, faComments, faChevronRight, faSpinner, faClipboardList, 
  faCircleCheck, faDumbbell, faBell, faChartLine, faCertificate, faFileAlt, faFingerprint, faLightbulb,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../../context/AuthContext'
import api from '../../../services/api'
import logo from '../../../assets/ProFolio_-_Logo-removebg-preview.png'

const navItems = [
  { label: 'Dashboard', icon: faHouse, path: '/student/dashboard' },
  { label: 'Assigned Tests', icon: faClipboardList, path: '/student/assigned-tests' },
  { label: 'Practices', icon: faDumbbell, path: '/student/assessment' },
  { label: 'My Results', icon: faChartLine, path: '/student/results' },
  { label: 'My Portfolio', icon: faFolder, path: '/student/portfolio' },
  { label: 'CV Builder', icon: faFileAlt, path: '/student/cv' },
  { label: 'Recommendations', icon: faLightbulb, path: '/student/recommendations' },
  { label: 'Originality Check', icon: faFingerprint, path: '/student/originality' },
  { label: 'Assistant', icon: faWandMagicSparkles, path: '/student/assistant' },
  { label: 'Messages', icon: faComments, path: '/student/messages' },
  { label: 'Profile', icon: faUser, path: '/student/profile' },
]

const ASSESSMENTS = [
  {
    id: 'typing',
    label: 'Typing Speed',
    description: 'Test your WPM and accuracy with real programming texts.',
    icon: faKeyboard,
    gradient: 'from-blue-500 to-cyan-500',
    path: '/student/assessment/typing',
    type: 'typing',
  },
  {
    id: 'programming',
    label: 'Coding Challenge',
    description: 'Solve AI-generated coding problems in your chosen language.',
    icon: faCode,
    gradient: 'from-violet-500 to-purple-600',
    path: '/student/assessment/coding',
    type: 'programming',
  },
  {
    id: 'flowchart',
    label: 'Flowchart Analysis',
    description: 'Draw and submit a flowchart for a given process or algorithm.',
    icon: faDiagramProject,
    gradient: 'from-amber-500 to-orange-500',
    path: '/student/assessment/flowchart',
    type: 'flowchart',
  },
  {
    id: 'sql',
    label: 'SQL Query',
    description: 'Write SQL queries against a defined schema under time pressure.',
    icon: faDatabase,
    gradient: 'from-emerald-500 to-teal-600',
    path: '/student/assessment/sql',
    type: 'sql',
  },
  {
    id: 'bugfix',
    label: 'Bug Fixing',
    description: 'Find and fix bugs in intentionally broken code snippets.',
    icon: faBug,
    gradient: 'from-rose-500 to-pink-600',
    path: '/student/assessment/bugfix',
    type: 'bugfix',
  },
  {
    id: 'communication',
    label: 'Communication Skills',
    description: 'Write professional responses to real-world workplace prompts.',
    icon: faComments,
    gradient: 'from-cyan-500 to-blue-600',
    path: '/student/assessment/communication',
    type: 'communication',
  },
]

const ScoreBadge = ({ score }) => {
  if (score === null || score === undefined) return (
    <span className="text-gray-600 text-xs">Not taken</span>
  )
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400'
  return <span className={`font-black text-lg ${color}`}>{score}<span className="text-gray-500 text-xs font-normal">/100</span></span>
}

export default function AssessmentDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchSummary() }, [])

  const fetchSummary = async () => {
    try {
      const res = await api.get('/assessments/summary')
      setSummary(res.data.data)
    } catch {
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const getScore = (type) => summary?.[type]?.score ?? null
  const completedCount = ASSESSMENTS.filter((a) => getScore(a.type) !== null).length
  const overallScore = summary?.overall_score ?? null

  return (
    <div className="min-h-screen bg-[#060612] flex font-sans">

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0a18] border-r border-white/5 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-blue-500/30 rounded-xl blur-md" />
            <img src={logo} alt="ProFolio" className="relative w-8 h-8 object-contain" />
          </div>
          <span className="text-lg font-black text-white tracking-tight">Pro<span className="text-blue-400">Folio</span></span>
          <button className="ml-auto lg:hidden text-gray-500 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.full_name}</p>
              <p className="text-gray-500 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path)
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-blue-500/15 text-white border border-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <FontAwesomeIcon icon={item.icon} className={`text-sm ${isActive ? 'text-blue-400' : ''}`} />
                {item.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-blue-400 rounded-full" />}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 py-4 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
            <FontAwesomeIcon icon={faRightFromBracket} className="text-sm" /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-[#060612]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <FontAwesomeIcon icon={faBars} className="text-lg" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">Assessments</h1>
            <p className="text-gray-500 text-xs">Prove your skills, earn your score</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="w-9 h-9 border border-white/8 bg-white/[0.03] rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all">
              <FontAwesomeIcon icon={faBell} className="text-sm" />
            </button>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <FontAwesomeIcon icon={faSpinner} className="text-blue-400 text-3xl animate-spin" />
            </div>
          ) : (
            <>
              {/* Overview cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center mb-3">
                    <FontAwesomeIcon icon={faTrophy} className="text-white text-sm" />
                  </div>
                  <p className="text-gray-500 text-xs mb-1">Overall Assessment Score</p>
                  {overallScore !== null
                    ? <p className="text-white font-black text-3xl">{overallScore}<span className="text-gray-500 text-lg font-normal">/100</span></p>
                    : <p className="text-gray-600 text-sm">Complete assessments to see your score</p>}
                </div>
                <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-3">
                    <FontAwesomeIcon icon={faCircleCheck} className="text-white text-sm" />
                  </div>
                  <p className="text-gray-500 text-xs mb-1">Completed</p>
                  <p className="text-white font-black text-3xl">{completedCount}<span className="text-gray-500 text-lg font-normal">/{ASSESSMENTS.length}</span></p>
                </div>
                <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-3">
                    <FontAwesomeIcon icon={faChartLine} className="text-white text-sm" />
                  </div>
                  <p className="text-gray-500 text-xs mb-1">Remaining</p>
                  <p className="text-white font-black text-3xl">{ASSESSMENTS.length - completedCount}<span className="text-gray-500 text-lg font-normal"> left</span></p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-8">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white font-bold text-sm">Your Progress</p>
                  <p className="text-gray-500 text-xs">{completedCount} of {ASSESSMENTS.length} completed</p>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-700"
                    style={{ width: `${(completedCount / ASSESSMENTS.length) * 100}%` }}
                  />
                </div>
                <div className="flex mt-3 gap-1">
                  {ASSESSMENTS.map((a) => {
                    const score = getScore(a.type)
                    const done = score !== null
                    return (
                      <div key={a.id} className="flex-1 flex flex-col items-center gap-1">
                        <div className={`w-full h-1 rounded-full ${done ? 'bg-gradient-to-r from-blue-500 to-violet-500' : 'bg-white/5'}`} />
                        <span className="text-gray-700 text-[9px] text-center leading-none">{a.label.split(' ')[0]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Assessment cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ASSESSMENTS.map((assessment) => {
                  const score = getScore(assessment.type)
                  const done = score !== null

                  return (
                    <div
                      key={assessment.id}
                      onClick={() => navigate(assessment.path)}
                      className="group relative border border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05] rounded-2xl p-5 cursor-pointer transition-all"
                    >
                      {/* New badge */}
                      {assessment.isNew && (
                        <div className="absolute top-3 right-3 px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-400 text-[10px] font-bold">
                          NEW
                        </div>
                      )}

                      {/* Done badge */}
                      {done && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
                          <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-400 text-xs" />
                        </div>
                      )}

                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${assessment.gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                          <FontAwesomeIcon icon={assessment.icon} className="text-white text-lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm mb-0.5">{assessment.label}</p>
                          <p className="text-gray-500 text-xs leading-relaxed">{assessment.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div>
                          <p className="text-gray-600 text-xs mb-0.5">Score</p>
                          <ScoreBadge score={score} />
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${done ? 'text-gray-400 group-hover:text-white' : 'text-blue-400 group-hover:text-blue-300'}`}>
                          {done ? 'Retake' : 'Start'}
                          <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Tip banner */}
              <div className="mt-8 border border-amber-500/20 bg-amber-500/5 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-9 h-9 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FontAwesomeIcon icon={faCertificate} className="text-amber-400 text-sm" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm mb-1">Assessment scores are added to your CV</p>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    Your typing speed, coding score, SQL proficiency, and communication scores are automatically reflected
                    in your generated CV and portfolio profile. Complete all assessments to maximize your career readiness score.
                  </p>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}