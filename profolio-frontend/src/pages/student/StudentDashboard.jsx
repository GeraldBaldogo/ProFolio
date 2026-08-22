import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faFolder, faRobot, faStar, faUser, faBars, faTimes,
  faArrowRight, faChevronRight, faCircleCheck, faCircleExclamation,
  faClockRotateLeft, faPlus, faRightFromBracket, faBriefcase,
  faCode, faCertificate, faTrophy, faChartLine, faSpinner, faClipboardList, 
  faFileAlt, faUserTie, faBell, faComments, faFingerprint, faLightbulb,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

const navItems = [
  { label: 'Dashboard', icon: faHouse, path: '/student/dashboard' },
  { label: 'My Portfolio', icon: faFolder, path: '/student/portfolio' },
  { label: 'AI Feedback', icon: faRobot, path: '/student/ai-feedback' },
  { label: 'Evaluation', icon: faStar, path: '/student/evaluation' },
  { label: 'Assigned Tests', icon: faClipboardList, path: '/student/assigned-tests' },
  { label: 'Assessment', icon: faTrophy, path: '/student/assessment' },
  { label: 'Messages', icon: faComments, path: '/student/messages' },
  { label: 'CV Builder', icon: faFileAlt, path: '/student/cv' },
  { label: 'Originality Check', icon: faFingerprint, path: '/student/originality' },
  { label: 'My Results', icon: faChartLine, path: '/student/results' },
  { label: 'Recommendations', icon: faLightbulb, path: '/student/recommendations' },
  { label: 'Profile', icon: faUser, path: '/student/profile' },
]

const statusConfig = {
  draft: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', dot: 'bg-gray-400' },
  submitted: { label: 'Submitted', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-400' },
  ai_reviewed: { label: 'AI Reviewed', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', dot: 'bg-violet-400' },
  under_review: { label: 'Under Review', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400' },
  revision_requested: { label: 'Needs Revision', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', dot: 'bg-rose-400' },
  completed: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', dot: 'bg-green-400' },
}

const StudentDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [portfolio, setPortfolio] = useState(null)
  const [aiEval, setAiEval] = useState(null)
  const [humanEval, setHumanEval] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const portfolioRes = await api.get('/portfolios/my')
      const portfolios = portfolioRes.data.data
      if (portfolios.length > 0) {
        const p = portfolios[0]
        setPortfolio(p)
        try {
          const aiRes = await api.get(`/evaluations/ai/${p.id}`)
          setAiEval(aiRes.data.data)
        } catch { }
        try {
          const humanRes = await api.get(`/evaluations/human/${p.id}`)
          setHumanEval(humanRes.data.data)
        } catch { }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const status = portfolio ? statusConfig[portfolio.status] || statusConfig.draft : null

  const quickStats = [
    {
      label: 'Portfolio Status',
      value: status ? status.label : 'No Portfolio',
      icon: faFolder,
      gradient: 'from-blue-500 to-cyan-500',
      sub: portfolio ? `Created ${new Date(portfolio.created_at).toLocaleDateString()}` : 'Create your first portfolio',
    },
    {
      label: 'AI Score',
      value: aiEval ? `${aiEval.overall_score}/100` : 'Not yet evaluated',
      icon: faRobot,
      gradient: 'from-violet-500 to-purple-600',
      sub: aiEval ? 'AI evaluation complete' : 'Submit portfolio to get AI feedback',
    },
    {
      label: 'Final Score',
      value: humanEval ? `${humanEval.final_score}/100` : 'Pending',
      icon: faStar,
      gradient: 'from-amber-500 to-orange-500',
      sub: humanEval ? `Verdict: ${humanEval.verdict}` : 'Awaiting human evaluation',
    },
    {
      label: 'Career Readiness',
      value: humanEval ? humanEval.career_readiness.replace('_', ' ') : 'Not assessed',
      icon: faChartLine,
      gradient: 'from-emerald-500 to-teal-600',
      sub: humanEval ? 'Assessment complete' : 'Complete evaluation to see result',
    },
  ]

  const quickActions = [
    { label: 'Add Project', icon: faCode, path: '/student/portfolio', color: 'from-blue-500 to-cyan-500' },
    { label: 'Add Skill', icon: faChartLine, path: '/student/portfolio', color: 'from-violet-500 to-purple-600' },
    { label: 'Add Certificate', icon: faCertificate, path: '/student/portfolio', color: 'from-amber-500 to-orange-500' },
    { label: 'Add Achievement', icon: faTrophy, path: '/student/portfolio', color: 'from-emerald-500 to-teal-600' },
  ]

  return (
    <div className="min-h-screen bg-[#060612] flex font-sans">

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0a18] border-r border-white/5 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        {/* Logo */}
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

        {/* User info */}
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

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-blue-500/15 text-white border border-blue-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <FontAwesomeIcon icon={item.icon} className={`text-sm ${isActive ? 'text-blue-400' : ''}`} />
                {item.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-blue-400 rounded-full" />}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="text-sm" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-[#060612]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
          <button className="lg:hidden text-gray-400 hover:text-white transition-colors" onClick={() => setSidebarOpen(true)}>
            <FontAwesomeIcon icon={faBars} className="text-lg" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">Dashboard</h1>
            <p className="text-gray-500 text-xs">Welcome back, {user?.full_name?.split(' ')[0]}!</p>
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

        {/* Content */}
        <main className="flex-1 px-6 py-8">

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <FontAwesomeIcon icon={faSpinner} className="text-blue-400 text-3xl animate-spin" />
            </div>
          ) : (
            <>
              {/* No portfolio banner */}
              {!portfolio && (
                <div className="border border-blue-500/20 bg-blue-500/5 rounded-2xl p-5 flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={faCircleExclamation} className="text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">You don't have a portfolio yet</p>
                    <p className="text-gray-400 text-xs mt-0.5">Create your portfolio to get started with ProFolio</p>
                  </div>
                  <Link
                    to="/student/portfolio"
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all flex-shrink-0"
                  >
                    Create Portfolio <FontAwesomeIcon icon={faArrowRight} />
                  </Link>
                </div>
              )}

              {/* Portfolio status banner */}
              {portfolio && (
                <div className={`border ${status.border} ${status.bg} rounded-2xl p-5 flex items-center gap-4 mb-8`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status.dot} animate-pulse`} />
                    <span className={`text-sm font-bold ${status.color}`}>{status.label}</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    {portfolio.status === 'draft' && 'Your portfolio is in draft. Add content and submit for evaluation.'}
                    {portfolio.status === 'submitted' && 'Your portfolio has been submitted. Waiting for AI evaluation.'}
                    {portfolio.status === 'ai_reviewed' && 'AI evaluation complete! Waiting for human evaluator.'}
                    {portfolio.status === 'under_review' && 'Your portfolio is being reviewed by a human evaluator.'}
                    {portfolio.status === 'revision_requested' && 'Your evaluator requested revisions. Please update your portfolio.'}
                    {portfolio.status === 'completed' && 'Evaluation complete! Check your results below.'}
                  </p>
                  {portfolio.status === 'draft' && (
                    <Link to="/student/portfolio" className="ml-auto flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all flex-shrink-0">
                      Complete Portfolio <FontAwesomeIcon icon={faArrowRight} />
                    </Link>
                  )}
                </div>
              )}

              {/* Stats grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {quickStats.map((stat, i) => (
                  <div key={i} className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 hover:border-white/15 hover:bg-white/[0.05] transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                        <FontAwesomeIcon icon={stat.icon} className="text-white text-sm" />
                      </div>
                    </div>
                    <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
                    <p className="text-white font-black text-lg leading-tight mb-1 capitalize">{stat.value}</p>
                    <p className="text-gray-600 text-xs">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Two column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Quick actions */}
                <div className="lg:col-span-1">
                  <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                    <h2 className="text-white font-bold text-sm mb-4">Quick Actions</h2>
                    <div className="flex flex-col gap-2">
                      {quickActions.map((action, i) => (
                        <Link
                          key={i}
                          to={action.path}
                          className="flex items-center gap-3 p-3 border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 rounded-xl transition-all group"
                        >
                          <div className={`w-8 h-8 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <FontAwesomeIcon icon={action.icon} className="text-white text-xs" />
                          </div>
                          <span className="text-gray-300 group-hover:text-white text-sm font-medium transition-colors">{action.label}</span>
                          <FontAwesomeIcon icon={faChevronRight} className="ml-auto text-gray-600 group-hover:text-gray-400 text-xs transition-colors" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Feedback preview */}
                <div className="lg:col-span-2">
                  <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 h-full">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-white font-bold text-sm">AI Evaluation Summary</h2>
                      {aiEval && (
                        <Link to="/student/ai-feedback" className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors">
                          View full report →
                        </Link>
                      )}
                    </div>

                    {!aiEval ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-4">
                          <FontAwesomeIcon icon={faRobot} className="text-violet-400 text-2xl" />
                        </div>
                        <p className="text-gray-400 text-sm font-medium mb-1">No AI evaluation yet</p>
                        <p className="text-gray-600 text-xs max-w-xs">Submit your portfolio to receive instant AI-powered feedback and scoring.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {/* Score */}
                        <div className="flex items-center gap-4 p-4 border border-violet-500/20 bg-violet-500/5 rounded-xl">
                          <div className="text-4xl font-black text-violet-400">{aiEval.overall_score}<span className="text-xl text-gray-500">/100</span></div>
                          <div>
                            <p className="text-white text-sm font-bold">Overall Score</p>
                            <p className="text-gray-500 text-xs">AI Portfolio Assessment</p>
                          </div>
                        </div>

                        {/* Strengths */}
                        <div className="p-4 border border-green-500/20 bg-green-500/5 rounded-xl">
                          <p className="text-green-400 text-xs font-bold mb-1.5">✓ Strengths</p>
                          <p className="text-gray-300 text-xs leading-relaxed line-clamp-3">{aiEval.strengths}</p>
                        </div>

                        {/* Suggestions */}
                        <div className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-xl">
                          <p className="text-amber-400 text-xs font-bold mb-1.5">⚡ Suggestions</p>
                          <p className="text-gray-300 text-xs leading-relaxed line-clamp-3">{aiEval.suggestions}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Human evaluation result */}
              {humanEval && (
                <div className="mt-6 border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-bold text-sm">Human Evaluation Result</h2>
                    <Link to="/student/evaluation" className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors">
                      View full result →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border border-white/8 bg-white/5 rounded-xl text-center">
                      <p className="text-gray-500 text-xs mb-1">Final Score</p>
                      <p className="text-3xl font-black text-white">{humanEval.final_score}<span className="text-lg text-gray-500">/100</span></p>
                    </div>
                    <div className={`p-4 border rounded-xl text-center ${humanEval.verdict === 'passed' ? 'border-green-500/20 bg-green-500/5' : humanEval.verdict === 'failed' ? 'border-red-500/20 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
                      <p className="text-gray-500 text-xs mb-1">Verdict</p>
                      <p className={`text-lg font-black capitalize ${humanEval.verdict === 'passed' ? 'text-green-400' : humanEval.verdict === 'failed' ? 'text-red-400' : 'text-amber-400'}`}>{humanEval.verdict.replace('_', ' ')}</p>
                    </div>
                    <div className="p-4 border border-white/8 bg-white/5 rounded-xl text-center">
                      <p className="text-gray-500 text-xs mb-1">Career Readiness</p>
                      <p className="text-lg font-black text-blue-400 capitalize">{humanEval.career_readiness.replace('_', ' ')}</p>
                    </div>
                  </div>
                  {humanEval.comments && (
                    <div className="mt-4 p-4 border border-white/8 bg-white/5 rounded-xl">
                      <p className="text-gray-500 text-xs font-bold mb-1">Evaluator Comments</p>
                      <p className="text-gray-300 text-sm leading-relaxed">"{humanEval.comments}"</p>
                    </div>
                  )}
                </div>
              )}

            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default StudentDashboard