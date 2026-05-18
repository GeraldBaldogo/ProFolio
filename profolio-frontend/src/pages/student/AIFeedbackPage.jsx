import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faFolder, faRobot, faStar, faUser, faBars, faTimes,
  faChartLine, faRightFromBracket, faSpinner, faArrowRight,
  faCircleCheck, faTriangleExclamation, faLightbulb, faBolt,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logo from '../../assets/logo.jpg'

const navItems = [
  { label: 'Dashboard', icon: faHouse, path: '/student/dashboard' },
  { label: 'My Portfolio', icon: faFolder, path: '/student/portfolio' },
  { label: 'AI Feedback', icon: faRobot, path: '/student/ai-feedback' },
  { label: 'Evaluation', icon: faStar, path: '/student/evaluation' },
  { label: 'Profile', icon: faUser, path: '/student/profile' },
]

const AIFeedbackPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [portfolio, setPortfolio] = useState(null)
  const [aiEval, setAiEval] = useState(null)
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchData() }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = async () => {
    try {
      const res = await api.get('/portfolios/my')
      const portfolios = res.data.data
      if (portfolios.length > 0) {
        setPortfolio(portfolios[0])
        try {
          const aiRes = await api.get(`/evaluations/ai/${portfolios[0].id}`)
          setAiEval(aiRes.data.data)
        } catch {}
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const triggerAI = async () => {
    setTriggering(true)
    try {
      const res = await api.post(`/evaluations/ai/${portfolio.id}`)
      setAiEval(res.data.data)
      showToast('AI evaluation complete!')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to trigger AI evaluation.', 'error')
    } finally {
      setTriggering(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-blue-400'
    if (score >= 40) return 'text-amber-400'
    return 'text-red-400'
  }

  const getScoreGradient = (score) => {
    if (score >= 80) return 'from-green-500 to-teal-500'
    if (score >= 60) return 'from-blue-500 to-cyan-500'
    if (score >= 40) return 'from-amber-500 to-orange-500'
    return 'from-red-500 to-rose-500'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Work'
  }

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
            const isActive = location.pathname === item.path
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
            <FontAwesomeIcon icon={faRightFromBracket} className="text-sm" />
            Sign Out
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
            <h1 className="text-white font-bold text-lg">AI Feedback</h1>
            <p className="text-gray-500 text-xs">Powered by Claude AI</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {portfolio && !aiEval && portfolio.status !== 'draft' && (
              <button onClick={triggerAI} disabled={triggering}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-60">
                {triggering ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faRobot} />}
                {triggering ? 'Evaluating...' : 'Run AI Evaluation'}
              </button>
            )}
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-6 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <FontAwesomeIcon icon={faSpinner} className="text-violet-400 text-3xl animate-spin" />
            </div>
          ) : !portfolio ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-4">
                <FontAwesomeIcon icon={faRobot} className="text-violet-400 text-2xl" />
              </div>
              <h2 className="text-white font-bold text-lg mb-2">No portfolio found</h2>
              <p className="text-gray-500 text-sm mb-6">Create and submit your portfolio first to get AI feedback.</p>
              <Link to="/student/portfolio" className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition-all">
                Go to Portfolio <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
          ) : !aiEval ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-4">
                <FontAwesomeIcon icon={faRobot} className="text-violet-400 text-2xl" />
              </div>
              <h2 className="text-white font-bold text-lg mb-2">No AI evaluation yet</h2>
              <p className="text-gray-500 text-sm mb-6 max-w-sm">
                {portfolio.status === 'draft'
                  ? 'Submit your portfolio first before getting AI feedback.'
                  : 'Click "Run AI Evaluation" to get instant feedback from Claude AI.'}
              </p>
              {portfolio.status === 'draft' ? (
                <Link to="/student/portfolio" className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition-all">
                  Complete Portfolio <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              ) : (
                <button onClick={triggerAI} disabled={triggering}
                  className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-60">
                  {triggering ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faRobot} />}
                  {triggering ? 'Evaluating...' : 'Run AI Evaluation'}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">

              {/* Overall score */}
              <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-center gap-5">
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <circle cx="50" cy="50" r="40" fill="none"
                          stroke={aiEval.overall_score >= 80 ? '#10b981' : aiEval.overall_score >= 60 ? '#3b82f6' : '#f59e0b'}
                          strokeWidth="8" strokeLinecap="round"
                          strokeDasharray={`${(aiEval.overall_score / 100) * 251.2} 251.2`} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-black ${getScoreColor(aiEval.overall_score)}`}>{aiEval.overall_score}</span>
                        <span className="text-gray-500 text-xs">/ 100</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Overall Score</p>
                      <p className={`text-3xl font-black ${getScoreColor(aiEval.overall_score)}`}>{getScoreLabel(aiEval.overall_score)}</p>
                      <p className="text-gray-500 text-xs mt-1">AI Portfolio Assessment</p>
                    </div>
                  </div>
                  <div className="md:ml-auto text-right">
                    <p className="text-gray-500 text-xs">Evaluated</p>
                    <p className="text-white text-sm font-semibold">{new Date(aiEval.evaluated_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              {/* Feedback cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-green-500/20 bg-green-500/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 text-sm" />
                    </div>
                    <p className="text-green-400 font-bold text-sm">Strengths</p>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{aiEval.strengths}</p>
                </div>

                <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-400 text-sm" />
                    </div>
                    <p className="text-red-400 font-bold text-sm">Weaknesses</p>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{aiEval.weaknesses}</p>
                </div>

                <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faLightbulb} className="text-amber-400 text-sm" />
                    </div>
                    <p className="text-amber-400 font-bold text-sm">Suggestions</p>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{aiEval.suggestions}</p>
                </div>
              </div>

              {/* Skill scores */}
              {aiEval.skill_scores && Object.keys(aiEval.skill_scores).length > 0 && (
                <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                  <h2 className="text-white font-bold text-sm mb-4">Skill Scores</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(aiEval.skill_scores).map(([skill, score], i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-300 font-medium">{skill}</span>
                            <span className={getScoreColor(score * 10)}>{score}/10</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${getScoreGradient(score * 10)} rounded-full transition-all`}
                              style={{ width: `${score * 10}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Project scores */}
              {aiEval.project_scores && Object.keys(aiEval.project_scores).length > 0 && (
                <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                  <h2 className="text-white font-bold text-sm mb-4">Project Scores</h2>
                  <div className="flex flex-col gap-3">
                    {Object.entries(aiEval.project_scores).map(([project, score], i) => (
                      <div key={i} className="flex items-center gap-4 p-3 border border-white/8 bg-white/5 rounded-xl">
                        <div className={`w-10 h-10 bg-gradient-to-br ${getScoreGradient(score * 10)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-black text-sm">{score}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-semibold">{project}</p>
                          <p className={`text-xs ${getScoreColor(score * 10)}`}>{getScoreLabel(score * 10)}</p>
                        </div>
                        <div className="w-24">
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${getScoreGradient(score * 10)} rounded-full`}
                              style={{ width: `${score * 10}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl text-sm font-semibold ${toast.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-green-500/30 bg-green-500/10 text-green-400'}`}>
          <FontAwesomeIcon icon={toast.type === 'error' ? faTriangleExclamation : faCircleCheck} />
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default AIFeedbackPage