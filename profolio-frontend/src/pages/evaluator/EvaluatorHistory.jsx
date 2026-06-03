import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faClipboardCheck, faClockRotateLeft, faBars, faTimes,
  faRightFromBracket, faSpinner, faCircleCheck, faRobot,
  faTriangleExclamation, faEye, faChevronDown, faChevronUp,
  faMagnifyingGlass, faFilter, faStar, faCalendar, faUser,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

const navItems = [
  { label: 'Dashboard', icon: faHouse, path: '/evaluator/dashboard' },
  { label: 'Assigned Portfolios', icon: faClipboardCheck, path: '/evaluator/assigned' },
  { label: 'History', icon: faClockRotateLeft, path: '/evaluator/history' },
]

const verdictConfig = {
  passed: { label: 'Passed', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  failed: { label: 'Failed', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  needs_revision: { label: 'Needs Revision', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
}

const readinessConfig = {
  not_ready: { label: 'Not Ready', color: 'text-rose-400' },
  developing: { label: 'Developing', color: 'text-amber-400' },
  ready: { label: 'Ready', color: 'text-blue-400' },
  highly_ready: { label: 'Highly Ready', color: 'text-green-400' },
}

const inputClass = "w-full bg-white/5 border border-white/8 hover:border-white/15 focus:border-blue-500/50 focus:bg-blue-500/5 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none transition-all"

const EvaluatorHistory = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterVerdict, setFilterVerdict] = useState('all')
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchHistory() }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchHistory = async () => {
    try {
      // Fetch all assigned portfolios that are completed
      const res = await api.get('/evaluations/assigned')
      const completed = (res.data.data || []).filter(
        a => a.portfolios?.status === 'completed'
      )

      // For each completed portfolio, try to fetch the human evaluation details
      const detailed = await Promise.all(
        completed.map(async (assignment) => {
          try {
            const evalRes = await api.get(`/evaluations/human/${assignment.portfolio_id}`)
            return { ...assignment, evaluation: evalRes.data.data }
          } catch {
            return { ...assignment, evaluation: null }
          }
        })
      )
      setHistory(detailed)
    } catch (err) {
      console.error(err)
      showToast('Failed to load history.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id)

  const filtered = history.filter(item => {
    const name = item.portfolios?.student_profiles?.users?.full_name?.toLowerCase() || ''
    const course = item.portfolios?.student_profiles?.course?.toLowerCase() || ''
    const matchSearch = name.includes(search.toLowerCase()) || course.includes(search.toLowerCase())
    const verdict = item.evaluation?.verdict || ''
    const matchVerdict = filterVerdict === 'all' || verdict === filterVerdict
    return matchSearch && matchVerdict
  })

  const avgScore = history.length
    ? Math.round(history.reduce((sum, h) => sum + (h.evaluation?.final_score || 0), 0) / history.length)
    : 0

  const passRate = history.length
    ? Math.round((history.filter(h => h.evaluation?.verdict === 'passed').length / history.length) * 100)
    : 0

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
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.full_name}</p>
              <p className="text-amber-400 text-xs">Evaluator</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-amber-500/15 text-white border border-amber-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <FontAwesomeIcon icon={item.icon} className={`text-sm ${isActive ? 'text-amber-400' : ''}`} />
                {item.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-amber-400 rounded-full" />}
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
            <h1 className="text-white font-bold text-lg">Evaluation History</h1>
            <p className="text-gray-500 text-xs">All your completed evaluations</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-6 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <FontAwesomeIcon icon={faSpinner} className="text-amber-400 text-3xl animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-6">

              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    label: 'Total Evaluated',
                    value: history.length,
                    icon: faClipboardCheck,
                    gradient: 'from-amber-500 to-orange-500',
                  },
                  {
                    label: 'Average Score',
                    value: history.length ? `${avgScore}/100` : '—',
                    icon: faStar,
                    gradient: 'from-violet-500 to-purple-500',
                  },
                  {
                    label: 'Pass Rate',
                    value: history.length ? `${passRate}%` : '—',
                    icon: faCircleCheck,
                    gradient: 'from-green-500 to-teal-500',
                  },
                ].map((stat, i) => (
                  <div key={i} className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                    <div className={`w-10 h-10 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center mb-3`}>
                      <FontAwesomeIcon icon={stat.icon} className="text-white text-sm" />
                    </div>
                    <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
                    <p className="text-gray-500 text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-sm" />
                  <input
                    type="text"
                    placeholder="Search by student name or course..."
                    className={inputClass + ' pl-10'}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <FontAwesomeIcon icon={faFilter} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-sm" />
                  <select
                    className={inputClass + ' pl-10 sm:w-48'}
                    value={filterVerdict}
                    onChange={e => setFilterVerdict(e.target.value)}
                  >
                    <option value="all">All Verdicts</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                    <option value="needs_revision">Needs Revision</option>
                  </select>
                </div>
              </div>

              {/* History List */}
              <div className="border border-white/8 bg-white/[0.03] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-white font-bold text-sm">Completed Evaluations</h2>
                  <span className="text-xs text-gray-500">{filtered.length} records</span>
                </div>

                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FontAwesomeIcon icon={faClockRotateLeft} className="text-gray-700 text-4xl mb-4" />
                    <p className="text-gray-400 text-sm font-medium">No history found</p>
                    <p className="text-gray-600 text-xs mt-1">
                      {history.length === 0
                        ? "You haven't completed any evaluations yet."
                        : "No results match your search or filter."}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {filtered.map((item, i) => {
                      const isExpanded = expandedId === item.portfolio_id
                      const verdict = verdictConfig[item.evaluation?.verdict] || verdictConfig.passed
                      const readiness = readinessConfig[item.evaluation?.career_readiness] || readinessConfig.developing
                      const studentName = item.portfolios?.student_profiles?.users?.full_name || 'Student'
                      const course = item.portfolios?.student_profiles?.course || '—'
                      const school = item.portfolios?.student_profiles?.school || '—'
                      const score = item.evaluation?.final_score ?? '—'
                      const evalDate = item.evaluation?.created_at
                        ? new Date(item.evaluation.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : '—'

                      return (
                        <div key={i} className="transition-all">
                          {/* Row */}
                          <div className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-all">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {studentName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-semibold truncate">{studentName}</p>
                              <p className="text-gray-500 text-xs truncate">{course} · {school}</p>
                            </div>

                            {/* Score */}
                            <div className="hidden sm:flex flex-col items-center flex-shrink-0">
                              <span className="text-white font-black text-lg leading-none">{score}</span>
                              <span className="text-gray-600 text-[10px]">score</span>
                            </div>

                            {/* Verdict badge */}
                            <span className={`hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border ${verdict.bg} ${verdict.border} ${verdict.color} flex-shrink-0`}>
                              {verdict.label}
                            </span>

                            {/* Date */}
                            <div className="hidden md:flex items-center gap-1.5 text-gray-500 text-xs flex-shrink-0">
                              <FontAwesomeIcon icon={faCalendar} className="text-[10px]" />
                              {evalDate}
                            </div>

                            <button
                              onClick={() => toggleExpand(item.portfolio_id)}
                              className="flex items-center gap-2 border border-white/8 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all flex-shrink-0"
                            >
                              <FontAwesomeIcon icon={faEye} />
                              <span className="hidden sm:inline">Details</span>
                              <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="text-[10px]" />
                            </button>
                          </div>

                          {/* Expanded Detail */}
                          {isExpanded && (
                            <div className="px-5 pb-5 bg-white/[0.01] border-t border-white/5">
                              <div className="pt-4 flex flex-col gap-4">

                                {/* Meta row */}
                                <div className="flex flex-wrap gap-3">
                                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${verdict.bg} ${verdict.border} ${verdict.color}`}>
                                    {verdict.label}
                                  </span>
                                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10 bg-white/5 ${readiness.color}`}>
                                    {readiness.label}
                                  </span>
                                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-400">
                                    Score: {score}/100
                                  </span>
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <FontAwesomeIcon icon={faCalendar} className="text-[10px]" /> Evaluated {evalDate}
                                  </span>
                                </div>

                                {/* Comments & Recommendations */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {item.evaluation?.comments && (
                                    <div className="bg-white/5 border border-white/8 rounded-xl p-4">
                                      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Your Comments</p>
                                      <p className="text-gray-300 text-xs leading-relaxed">{item.evaluation.comments}</p>
                                    </div>
                                  )}
                                  {item.evaluation?.recommendations && (
                                    <div className="bg-white/5 border border-white/8 rounded-xl p-4">
                                      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Recommendations</p>
                                      <p className="text-gray-300 text-xs leading-relaxed">{item.evaluation.recommendations}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Student info */}
                                <div className="flex items-center gap-2 text-gray-500 text-xs">
                                  <FontAwesomeIcon icon={faUser} />
                                  <span>{studentName} · {item.portfolios?.student_profiles?.year_level || '—'} · {school}</span>
                                </div>

                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

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

export default EvaluatorHistory