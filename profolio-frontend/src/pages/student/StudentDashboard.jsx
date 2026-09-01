import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faFolder, faRobot, faStar, faUser, faBars, faTimes,
  faArrowRight, faCircleCheck, faClock, faRightFromBracket,
  faTrophy, faChartLine, faSpinner, faClipboardList, faFileAlt,
  faComments, faFingerprint, faLightbulb, faTriangleExclamation,
  faRotateRight, faKeyboard, faCode, faDiagramProject, faDatabase, faDumbbell, 
  faBug, faPlay, faWandMagicSparkles,
  faSquare,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import ThemePicker from '../../components/ThemePicker'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

// Ordered to follow what a student actually does: work set for them, their own
// practice, what came of it, then what they walk away with.
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

const ASSESSMENT_TYPES = [
  { type: 'typing', label: 'Typing', icon: faKeyboard, accent: 'text-blue-400' },
  { type: 'programming', label: 'Coding', icon: faCode, accent: 'text-violet-400' },
  { type: 'bugfix', label: 'Bug fix', icon: faBug, accent: 'text-rose-400' },
  { type: 'sql', label: 'SQL', icon: faDatabase, accent: 'text-sky-400' },
  { type: 'flowchart', label: 'Flowchart', icon: faDiagramProject, accent: 'text-emerald-400' },
  { type: 'communication', label: 'Comms', icon: faComments, accent: 'text-cyan-400' },
]

const TYPE_TO_ROUTE = {
  typing: 'typing', programming: 'coding', flowchart: 'flowchart',
  sql: 'sql', bugfix: 'bugfix', communication: 'communication',
}

const portfolioStatus = {
  draft: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
  submitted: { label: 'Submitted', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  ai_reviewed: { label: 'AI Reviewed', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  under_review: { label: 'Under Review', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  revision_requested: { label: 'Needs Revision', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  completed: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
}

const timeUntil = (due) => {
  const ms = new Date(due) - new Date()
  if (ms <= 0) return null
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins} min left`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} left`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} left`
}

const StudentDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [assignments, setAssignments] = useState([])
  const [summary, setSummary] = useState(null)
  const [portfolio, setPortfolio] = useState(null)
  const [cv, setCv] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    setLoadError('')

    // allSettled, not all — a student with no CV yet shouldn't blank the whole
    // dashboard. Each piece is optional on its own.
    const [assignRes, summaryRes, portfolioRes, cvRes] = await Promise.allSettled([
      api.get('/tests/assigned/mine'),
      api.get('/assessments/summary'),
      api.get('/portfolios/my'),
      api.get('/cv/latest'),
    ])

    if (assignRes.status === 'fulfilled') setAssignments(assignRes.value.data.data || [])
    if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data.data)
    if (portfolioRes.status === 'fulfilled') setPortfolio(portfolioRes.value.data.data?.[0] || null)
    if (cvRes.status === 'fulfilled') setCv(cvRes.value.data || null)

    // Only complain when the two things this page is built around both fail —
    // that's a connection problem, not an empty account.
    if (assignRes.status === 'rejected' && summaryRes.status === 'rejected') {
      setLoadError('Couldn\u2019t reach the server. Check your connection.')
    }

    setLoading(false)
  }

  const handleLogout = () => { logout(); navigate('/') }

  // What a student needs to act on: professor-set tests that aren't done and
  // aren't closed. Soonest deadline first.
  const openTests = useMemo(() => {
    const now = new Date()
    return assignments
      .filter(a => {
        if (a.status === 'submitted') return false
        if (a.due_date && a.status === 'pending' && new Date(a.due_date) < now) return false
        return true
      })
      .sort((a, b) => {
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date) - new Date(b.due_date)
      })
  }, [assignments])

  const doneCount = useMemo(
    () => ASSESSMENT_TYPES.filter(a => summary?.[a.type]?.score !== null && summary?.[a.type]?.score !== undefined).length,
    [summary]
  )

  const pStatus = portfolio ? (portfolioStatus[portfolio.status] || portfolioStatus.draft) : null

  const startTest = (assignment) => {
    const test = assignment.tests
    if (!test) return
    navigate(`/student/assessment/${TYPE_TO_ROUTE[test.type] || test.type}?test_id=${test.id}`)
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
            const badge = item.path === '/student/assigned-tests' ? openTests.length : 0
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-blue-500/15 text-white border border-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <FontAwesomeIcon icon={item.icon} className={`text-sm ${isActive ? 'text-blue-400' : ''}`} />
                {item.label}
                {/* A count here means waiting work is visible without opening
                    the page. */}
                {badge > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-amber-500 text-black px-1.5 py-0.5 rounded-full">
                    {badge}
                  </span>
                )}
                {isActive && badge === 0 && <div className="ml-auto w-1.5 h-1.5 bg-blue-400 rounded-full" />}
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

        <header className="sticky top-0 z-30 bg-[#060612]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <FontAwesomeIcon icon={faBars} className="text-lg" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">Welcome back, {user?.full_name?.split(' ')[0]}</h1>
            <p className="text-gray-500 text-xs">Here&apos;s where you stand</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemePicker />
            {!loading && (
              <button
                onClick={fetchData}
                aria-label="Refresh"
                className="w-9 h-9 border border-white/8 bg-white/[0.03] rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                <FontAwesomeIcon icon={faRotateRight} className="text-sm" />
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 px-6 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <FontAwesomeIcon icon={faSpinner} className="text-blue-400 text-3xl animate-spin" />
            </div>

          ) : loadError ? (
            <div className="max-w-md mx-auto text-center py-16">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 text-3xl mb-4" />
              <p className="text-white font-bold mb-1">{loadError}</p>
              <button
                onClick={fetchData}
                className="mt-4 inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
              >
                <FontAwesomeIcon icon={faRotateRight} /> Try again
              </button>
            </div>

          ) : (
            <div className="flex flex-col gap-4">

              {/* ── 1. Work set by a professor — the only thing with a deadline ── */}
              {openTests.length > 0 && (
                <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-amber-500/10">
                    <FontAwesomeIcon icon={faClipboardList} className="text-amber-400 text-sm" />
                    <p className="text-white font-bold text-sm">Waiting for you</p>
                    <span className="ml-auto text-amber-400 text-xs font-semibold">
                      {openTests.length} test{openTests.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="divide-y divide-white/5">
                    {openTests.slice(0, 3).map((a) => {
                      const test = a.tests
                      const meta = ASSESSMENT_TYPES.find(t => t.type === test?.type)
                      const remaining = a.due_date ? timeUntil(a.due_date) : null
                      const late = a.due_date && new Date(a.due_date) < new Date()

                      return (
                        <div key={a.id} className="flex items-center gap-4 px-5 py-4">
                          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FontAwesomeIcon icon={meta?.icon || faTrophy} className={meta?.accent || 'text-gray-400'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{test?.title}</p>
                            <p className="text-gray-500 text-xs">
                              {meta?.label || test?.type}
                              {remaining && <span className="text-amber-400 font-semibold"> · {remaining}</span>}
                              {late && !remaining && <span className="text-amber-400 font-semibold"> · past due, you can still finish</span>}
                            </p>
                          </div>
                          <button
                            onClick={() => startTest(a)}
                            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all flex-shrink-0"
                          >
                            <FontAwesomeIcon icon={faPlay} />
                            {a.status === 'in_progress' ? 'Continue' : 'Start'}
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {openTests.length > 3 && (
                    <Link
                      to="/student/assigned-tests"
                      className="block px-5 py-3 text-amber-400 hover:text-amber-300 text-xs font-semibold border-t border-amber-500/10 transition-colors"
                    >
                      See all {openTests.length} assigned tests →
                    </Link>
                  )}
                </div>
              )}

              {/* ── 2. Progress through the six ── */}
              <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                  <div>
                    <p className="text-white font-bold text-sm">Your assessments</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {doneCount === 0
                        ? 'Practise any of these on your own, any time'
                        : `${doneCount} of ${ASSESSMENT_TYPES.length} attempted`}
                    </p>
                  </div>
                  {summary?.overall_score !== null && summary?.overall_score !== undefined && (
                    <div className="text-right">
                      <p className="text-gray-500 text-xs">Overall</p>
                      <p className="text-white font-black text-2xl">{summary.overall_score}</p>
                    </div>
                  )}
                </div>

                <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-700"
                    style={{ width: `${(doneCount / ASSESSMENT_TYPES.length) * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {ASSESSMENT_TYPES.map((a) => {
                    const score = summary?.[a.type]?.score
                    const done = score !== null && score !== undefined
                    return (
                      <Link
                        key={a.type}
                        to={`/student/assessment/${TYPE_TO_ROUTE[a.type]}`}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                          done
                            ? 'border-white/8 bg-white/[0.03] hover:border-white/15'
                            : 'border-white/5 hover:border-white/15 hover:bg-white/[0.02]'
                        }`}
                      >
                        <FontAwesomeIcon icon={a.icon} className={done ? a.accent : 'text-gray-600'} />
                        <span className="text-[10px] text-gray-500 text-center leading-tight">{a.label}</span>
                        {done
                          ? <span className="text-white text-xs font-bold">{score}</span>
                          : <span className="text-gray-700 text-xs">—</span>}
                      </Link>
                    )
                  })}
                </div>

                <Link
                  to="/student/results"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs font-semibold mt-4 transition-colors"
                >
                  See every attempt <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
                </Link>
              </div>

              {/* ── 3. Portfolio and CV — the two halves of what you walk away with ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faFolder} className="text-white text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm mb-0.5">Portfolio</p>
                      {pStatus ? (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${pStatus.bg} ${pStatus.border} ${pStatus.color}`}>
                          {pStatus.label}
                        </span>
                      ) : (
                        <p className="text-gray-500 text-xs">Not started</p>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed mb-4 flex-1">
                    {portfolio
                      ? 'Your projects, skills, certificates and achievements. This feeds your CV.'
                      : 'Add your projects and skills here. Your CV is written from this and from your assessments.'}
                  </p>
                  <Link
                    to="/student/portfolio"
                    className="flex items-center justify-center gap-2 border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] text-gray-400 hover:text-white text-xs font-semibold py-2.5 rounded-xl transition-all"
                  >
                    {portfolio ? 'Open portfolio' : 'Start your portfolio'}
                    <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
                  </Link>
                </div>

                <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faFileAlt} className="text-white text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm mb-0.5">CV</p>
                      <p className="text-gray-500 text-xs">
                        {cv
                          ? `Updated ${new Date(cv.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                          : 'Not generated yet'}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed mb-4 flex-1">
                    {cv
                      ? 'Written from your portfolio and the tests your professor set. Regenerate it after new work.'
                      : 'Once you\u2019ve filled your portfolio and taken a test, this writes itself.'}
                  </p>
                  <Link
                    to="/student/cv"
                    className="flex items-center justify-center gap-2 border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] text-gray-400 hover:text-white text-xs font-semibold py-2.5 rounded-xl transition-all"
                  >
                    {cv ? 'View CV' : 'Generate CV'}
                    <FontAwesomeIcon icon={cv ? faArrowRight : faWandMagicSparkles} className="text-[10px]" />
                  </Link>
                </div>
              </div>

              {/* ── 4. Nothing waiting — say so plainly ── */}
              {openTests.length === 0 && (
                <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={assignments.length ? faCircleCheck : faClock} className="text-green-400 text-sm" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm mb-1">
                      {assignments.length ? 'Nothing due right now' : 'No tests assigned yet'}
                    </p>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      {assignments.length
                        ? 'You\u2019ve done everything your professor has set. Practising on your own still counts toward your progress.'
                        : 'When your professor assigns a test, it\u2019ll appear here with its deadline. In the meantime you can practise any assessment.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default StudentDashboard