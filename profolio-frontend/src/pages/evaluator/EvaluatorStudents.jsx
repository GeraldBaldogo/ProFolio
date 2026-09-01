import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faFlaskVial, faComments, faBars, faTimes, faUsers,
  faRightFromBracket, faSpinner, faTriangleExclamation, faRotateRight,
  faMagnifyingGlass, faChevronDown, faCircleCheck, faClock,
  faHourglassHalf, faShield, faVideoSlash, faKeyboard, faCode,
  faDiagramProject, faDatabase, faBug, faRobot, faChartSimple,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

const navItems = [
  { label: 'Dashboard', icon: faHouse, path: '/evaluator/dashboard' },
  { label: 'My Tests', icon: faFlaskVial, path: '/evaluator/tests' },
  { label: 'Students', icon: faUsers, path: '/evaluator/students' },
  { label: 'Messages', icon: faComments, path: '/evaluator/messages' },
]

const TYPE_META = {
  typing: { label: 'Typing', icon: faKeyboard, accent: 'text-blue-400' },
  programming: { label: 'Coding', icon: faCode, accent: 'text-violet-400' },
  bugfix: { label: 'Bug fix', icon: faBug, accent: 'text-rose-400' },
  sql: { label: 'SQL', icon: faDatabase, accent: 'text-emerald-400' },
  flowchart: { label: 'Flowchart', icon: faDiagramProject, accent: 'text-amber-400' },
  communication: { label: 'Communication', icon: faComments, accent: 'text-cyan-400' },
}

const statusConfig = {
  pending: { label: 'Not started', color: 'text-gray-400', icon: faHourglassHalf },
  in_progress: { label: 'In progress', color: 'text-amber-400', icon: faClock },
  submitted: { label: 'Submitted', color: 'text-green-400', icon: faCircleCheck },
}

const scoreColor = (s) =>
  s === null || s === undefined ? 'text-gray-600'
    : s >= 80 ? 'text-green-400'
      : s >= 60 ? 'text-blue-400'
        : s >= 40 ? 'text-amber-400'
          : 'text-rose-400'

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
  month: 'short', day: 'numeric',
})

const EvaluatorStudents = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { fetchStudents() }, [])

  const fetchStudents = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await api.get('/tests/my-students')
      setStudents(res.data.data || [])
    } catch (err) {
      // A class with nobody in it and a failed request are different things.
      setLoadError(err.response?.data?.message || 'Couldn\u2019t load your students.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return students.filter(s => {
      if (q && !s.full_name?.toLowerCase().includes(q) && !s.email?.toLowerCase().includes(q)) return false
      // "Who hasn't submitted?" is the question a professor asks most often, so
      // it gets a filter rather than a scan down the list.
      if (filter === 'overdue') return s.overdue_count > 0
      if (filter === 'waiting') return s.submitted_count < s.assigned_count
      if (filter === 'flagged') return s.flagged_count > 0
      return true
    })
  }, [students, search, filter])

  const totals = useMemo(() => ({
    students: students.length,
    overdue: students.filter(s => s.overdue_count > 0).length,
    waiting: students.filter(s => s.submitted_count < s.assigned_count).length,
    flagged: students.filter(s => s.flagged_count > 0).length,
  }), [students])

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
              <p className="text-amber-400 text-xs">Professor</p>
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
            <h1 className="text-white font-bold text-lg">Students</h1>
            <p className="text-gray-500 text-xs">Everyone you&apos;ve set work for</p>
          </div>
          {!loading && (
            <button onClick={fetchStudents}
              className="ml-auto w-9 h-9 border border-white/8 bg-white/[0.03] rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all">
              <FontAwesomeIcon icon={faRotateRight} className="text-sm" />
            </button>
          )}
        </header>

        <main className="flex-1 px-6 py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <FontAwesomeIcon icon={faSpinner} className="text-amber-400 text-3xl animate-spin" />
              <p className="text-gray-500 text-sm">Loading...</p>
            </div>

          ) : loadError ? (
            <div className="max-w-md mx-auto text-center py-16">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 text-3xl mb-4" />
              <p className="text-white font-bold mb-1">{loadError}</p>
              <p className="text-gray-500 text-sm mb-6">This is a connection problem, not an empty class.</p>
              <button onClick={fetchStudents}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all">
                <FontAwesomeIcon icon={faRotateRight} /> Try again
              </button>
            </div>

          ) : students.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-16">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faUsers} className="text-gray-600 text-xl" />
              </div>
              <p className="text-white font-bold text-lg mb-2">No students yet</p>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Students appear here once you assign them a test. Create one, publish it,
                then use Assign.
              </p>
              <Link to="/evaluator/tests"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-5 py-3 rounded-xl transition-all">
                <FontAwesomeIcon icon={faFlaskVial} /> Go to My Tests
              </Link>
            </div>

          ) : (
            <div className="flex flex-col gap-4">

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Students', value: totals.students, icon: faUsers, color: 'text-blue-400' },
                  { label: 'Yet to submit', value: totals.waiting, icon: faHourglassHalf, color: totals.waiting ? 'text-amber-400' : 'text-gray-500' },
                  { label: 'Overdue', value: totals.overdue, icon: faClock, color: totals.overdue ? 'text-rose-400' : 'text-gray-500' },
                  { label: 'Flagged', value: totals.flagged, icon: faShield, color: totals.flagged ? 'text-rose-400' : 'text-gray-500' },
                ].map((s, i) => (
                  <div key={i} className="border border-white/8 bg-white/[0.03] rounded-2xl p-4">
                    <FontAwesomeIcon icon={s.icon} className={`${s.color} text-sm mb-2`} />
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-gray-500 text-xs">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Search and filter */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: 'all', label: `All (${students.length})` },
                  { key: 'waiting', label: `Yet to submit (${totals.waiting})` },
                  { key: 'overdue', label: `Overdue (${totals.overdue})` },
                  { key: 'flagged', label: `Flagged (${totals.flagged})` },
                ].map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key)}
                    className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                      filter === f.key
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                        : 'border-white/8 text-gray-500 hover:text-white hover:border-white/20'
                    }`}>
                    {f.label}
                  </button>
                ))}

                <div className="relative ml-auto w-full sm:w-64">
                  <FontAwesomeIcon icon={faMagnifyingGlass}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none" />
                  <input
                    type="search" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search name or email" aria-label="Search students"
                    className="w-full bg-white/5 border border-white/8 hover:border-white/15 focus:border-amber-500/40 rounded-xl pl-9 pr-3 py-2 text-white text-xs placeholder-gray-600 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Students */}
              {visible.length === 0 ? (
                <div className="border border-white/8 bg-white/[0.03] rounded-2xl py-12 text-center">
                  <p className="text-gray-500 text-sm">
                    {search ? `Nobody matches "${search}".` : 'Nobody in that group.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {visible.map((s) => {
                    const open = expanded === s.id
                    const allIn = s.submitted_count === s.assigned_count

                    return (
                      <div key={s.id} className="border border-white/8 bg-white/[0.03] rounded-2xl overflow-hidden">

                        <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {s.full_name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{s.full_name}</p>
                            <p className="text-gray-500 text-xs truncate">{s.email}</p>
                          </div>

                          {s.overdue_count > 0 && (
                            <span className="text-xs font-semibold text-rose-400 border border-rose-500/25 bg-rose-500/10 px-2.5 py-1 rounded-full flex-shrink-0">
                              {s.overdue_count} overdue
                            </span>
                          )}

                          {s.flagged_count > 0 && (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 border border-rose-500/25 bg-rose-500/10 px-2.5 py-1 rounded-full flex-shrink-0">
                              <FontAwesomeIcon icon={faShield} /> {s.flagged_count}
                            </span>
                          )}

                          <div className="text-right flex-shrink-0">
                            <p className={`text-sm font-bold ${allIn ? 'text-green-400' : 'text-white'}`}>
                              {s.submitted_count}<span className="text-gray-600 font-normal">/{s.assigned_count}</span>
                            </p>
                            <p className="text-gray-600 text-[10px]">submitted</p>
                          </div>

                          <div className="w-14 text-right flex-shrink-0">
                            <p className={`text-2xl font-black ${scoreColor(s.average)}`}>
                              {s.average ?? '—'}
                            </p>
                            <p className="text-gray-600 text-[10px]">average</p>
                          </div>

                          <button
                            onClick={() => setExpanded(open ? null : s.id)}
                            aria-expanded={open}
                            aria-label={`${open ? 'Hide' : 'Show'} ${s.full_name}'s tests`}
                            className="w-9 h-9 rounded-xl border border-white/8 text-gray-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center flex-shrink-0">
                            <FontAwesomeIcon icon={faChevronDown}
                              className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`} />
                          </button>
                        </div>

                        {/* Every test this student was given, in one place —
                            the thing that used to take six page loads. */}
                        {open && (
                          <div className="border-t border-white/5 divide-y divide-white/5">
                            {s.assignments.map((a) => {
                              const meta = TYPE_META[a.type] || { label: a.type, icon: faFlaskVial, accent: 'text-gray-400' }
                              const st = statusConfig[a.status] || statusConfig.pending
                              const late = a.status !== 'submitted' && a.due_date && new Date(a.due_date) < new Date()

                              return (
                                <div key={a.assignment_id} className="px-5 py-3.5">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <FontAwesomeIcon icon={meta.icon} className={`${meta.accent} text-sm flex-shrink-0`} />

                                    <div className="flex-1 min-w-0">
                                      <p className="text-white text-xs font-semibold truncate">{a.title}</p>
                                      <p className="text-gray-600 text-[11px]">
                                        {meta.label}
                                        {a.submitted_at && ` · ${formatDate(a.submitted_at)}`}
                                        {late && <span className="text-rose-400"> · overdue</span>}
                                      </p>
                                    </div>

                                    {a.unproctored && (
                                      <FontAwesomeIcon icon={faVideoSlash} className="text-amber-400 text-xs flex-shrink-0"
                                        title="Taken without a camera" />
                                    )}

                                    {a.flags > 0 && (
                                      <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 flex-shrink-0">
                                        <FontAwesomeIcon icon={faShield} /> {a.flags}
                                      </span>
                                    )}

                                    <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${st.color} flex-shrink-0`}>
                                      <FontAwesomeIcon icon={st.icon} /> {st.label}
                                    </span>

                                    <div className="w-10 text-right flex-shrink-0">
                                      <span className={`text-sm font-bold ${scoreColor(a.score)}`}>
                                        {a.score ?? '—'}
                                      </span>
                                    </div>

                                    <button
                                      onClick={() => navigate(`/evaluator/tests/${a.test_id}/submissions`)}
                                      aria-label={`Open results for ${a.title}`}
                                      className="w-8 h-8 rounded-lg border border-white/8 text-gray-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center flex-shrink-0">
                                      <FontAwesomeIcon icon={faChartSimple} className="text-xs" />
                                    </button>
                                  </div>

                                  {a.feedback && (
                                    <div className="mt-2.5 flex items-start gap-2">
                                      <FontAwesomeIcon icon={faRobot} className="text-violet-400 text-[11px] mt-0.5 flex-shrink-0" />
                                      <p className="text-gray-400 text-[11px] leading-relaxed">{a.feedback}</p>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default EvaluatorStudents