import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faClipboardList, faSpinner, faPlay, faCircleCheck,
  faClock, faTriangleExclamation, faLock, faRotateRight,
  faHouse, faFolder, faUser, faBars, faTimes, faTrophy, faChartLine,
  faFileAlt, faComments, faFingerprint, faLightbulb, faRightFromBracket,
  faDumbbell, faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons'
import { getMyAssignedTests, startAssignment } from '../../services/test.service'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

// Must match the other student pages exactly, or the sidebar reorders itself
// as the student moves between pages.
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

// Maps a test's DB `type` to the route segment for its assessment page.
// Note: 'programming' (DB/type value) -> 'coding' (route segment)
const TYPE_TO_ROUTE = {
  typing: 'typing',
  programming: 'coding',
  flowchart: 'flowchart',
  sql: 'sql',
  bugfix: 'bugfix',
  communication: 'communication',
}

const TYPE_LABELS = {
  typing: 'Speed Typing',
  programming: 'Coding Challenge',
  flowchart: 'Flowchart Analysis',
  sql: 'SQL Query',
  bugfix: 'Bug Fixing',
  communication: 'Communication Skills',
}

const statusConfig = {
  pending: { label: 'Not started', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
  in_progress: { label: 'In progress', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  submitted: { label: 'Submitted', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  closed: { label: 'Closed', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  overdue: { label: 'Overdue', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
}

const formatDue = (d) => new Date(d).toLocaleString('en-US', {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
})

// "Due in 3 hours" is easier to act on than a date you have to work out.
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

const StudentAssignedTests = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { totalUnread } = useNotifications()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(null)
  const [error, setError] = useState(null)
  // Ticks once a minute so a countdown doesn't sit there going stale, and a
  // test that closes while the page is open actually locks.
  const [, setTick] = useState(0)

  useEffect(() => {
    fetchAssignments()
    const t = setInterval(() => setTick(n => n + 1), 60000)
    return () => clearInterval(t)
  }, [])

  const fetchAssignments = () => {
    setLoading(true)
    setError(null)
    getMyAssignedTests()
      .then(setAssignments)
      .catch((err) => setError(err.message || 'Failed to load assigned tests.'))
      .finally(() => setLoading(false))
  }

  // Mirrors assertNotOverdue on the server: a deadline only blocks a test you
  // haven't opened yet. Once you've started, you're allowed to finish.
  const isLocked = (assignment) => {
    if (!assignment.due_date) return false
    if (assignment.status !== 'pending') return false
    return new Date(assignment.due_date) < new Date()
  }

  const isLate = (assignment) => {
    if (!assignment.due_date || assignment.status === 'submitted') return false
    return new Date(assignment.due_date) < new Date()
  }

  const handleStart = async (assignment) => {
    const test = assignment.tests
    if (!test) return
    setStarting(assignment.test_id)
    setError(null)
    try {
      await startAssignment(test.id)
      const routeSegment = TYPE_TO_ROUTE[test.type] || test.type
      navigate(`/student/assessment/${routeSegment}?test_id=${test.id}`)
    } catch (err) {
      // The server has the final say on the deadline — the client clock can be
      // wrong, or the test could close between render and click.
      setError(err.message || 'Failed to start test.')
      setStarting(null)
      fetchAssignments()
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-[#060612] flex font-sans">

      {/* This page had no sidebar at all, so opening it made the whole
          navigation disappear — and this is the page students visit most. */}
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
                {item.path === '/student/messages' && totalUnread > 0 ? (
                  <span className="ml-auto text-[10px] font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded-full">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                ) : isActive ? (
                  <div className="ml-auto w-1.5 h-1.5 bg-blue-400 rounded-full" />
                ) : null}
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

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* The sticky header the other student pages use. Back is gone — the
            sidebar carries Dashboard now, and two routes to one place is a
            question nobody needs to answer. */}
        <header className="sticky top-0 z-30 bg-[#060612]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open menu"
            className="lg:hidden text-gray-400 hover:text-white">
            <FontAwesomeIcon icon={faBars} className="text-lg" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">Assigned Tests</h1>
            <p className="text-gray-500 text-xs">Tests your professor has assigned to you</p>
          </div>
          {!loading && (
            <button onClick={fetchAssignments} aria-label="Refresh"
              className="ml-auto w-9 h-9 rounded-xl border border-white/8 bg-white/[0.03] text-gray-400 hover:text-white transition-all flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faRotateRight} className="text-sm" />
            </button>
          )}
        </header>

        <main className="flex-1 px-6 py-8">
        <div className="max-w-3xl mx-auto">

      {error && (
        <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 flex-shrink-0" />
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <FontAwesomeIcon icon={faSpinner} className="text-gray-500 text-2xl animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-10 text-center">
          <FontAwesomeIcon icon={faClipboardList} className="text-gray-600 text-3xl mb-3" />
          <p className="text-gray-400 text-sm font-medium mb-1">No assigned tests yet</p>
          <p className="text-gray-600 text-xs">When your professor assigns you a test, it&apos;ll show up here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {assignments.map((assignment) => {
            const test = assignment.tests
            if (!test) return null

            const locked = isLocked(assignment)
            const late = isLate(assignment)
            const done = assignment.status === 'submitted'

            const status = done ? statusConfig.submitted
              : locked ? statusConfig.closed
                : late ? statusConfig.overdue
                  : (statusConfig[assignment.status] || statusConfig.pending)

            const isStarting = starting === assignment.test_id
            const remaining = assignment.due_date && !done ? timeUntil(assignment.due_date) : null

            return (
              <div key={assignment.id}
                className={`border rounded-2xl p-5 flex items-center gap-4 transition-all ${
                  locked ? 'border-white/8 bg-white/[0.02] opacity-60' : 'border-white/8 bg-white/[0.03]'
                }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-white font-semibold text-sm truncate">{test.title}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status.bg} ${status.border} ${status.color} flex-shrink-0`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs">{TYPE_LABELS[test.type] || test.type}</p>

                  {test.description && (
                    <p className="text-gray-600 text-xs mt-1 overflow-hidden"
                      style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {test.description}
                    </p>
                  )}

                  {assignment.due_date && (
                    <p className={`text-xs mt-1.5 flex items-center gap-1.5 flex-wrap ${
                      locked || late ? 'text-rose-400' : 'text-gray-500'
                    }`}>
                      <FontAwesomeIcon icon={locked || late ? faTriangleExclamation : faClock} className="text-[10px]" />
                      {locked ? `Closed ${formatDue(assignment.due_date)}` : `Due ${formatDue(assignment.due_date)}`}
                      {remaining && !locked && (
                        <span className="text-amber-400 font-semibold">· {remaining}</span>
                      )}
                    </p>
                  )}

                  {/* Says plainly why they can still finish, so a student who
                      started in time isn't left wondering. */}
                  {late && !locked && !done && (
                    <p className="text-amber-400 text-xs mt-1">
                      Past due, but you started in time — you can still finish and submit.
                    </p>
                  )}
                </div>

                {done ? (
                  <div className="flex items-center gap-2 text-green-400 text-xs font-semibold flex-shrink-0">
                    <FontAwesomeIcon icon={faCircleCheck} /> Done
                  </div>
                ) : locked ? (
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold flex-shrink-0"
                    title="The deadline passed before you started this one">
                    <FontAwesomeIcon icon={faLock} /> Closed
                  </div>
                ) : (
                  <button
                    onClick={() => handleStart(assignment)}
                    disabled={isStarting}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex-shrink-0"
                  >
                    {isStarting ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faPlay} />}
                    {assignment.status === 'in_progress' ? 'Continue' : 'Start'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
        </div>
        </main>
      </div>
    </div>
  )
}

export default StudentAssignedTests