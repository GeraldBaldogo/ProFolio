import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faFolder, faRobot, faStar, faUser, faBars, faTimes,
  faTrophy, faRightFromBracket, faKeyboard, faCode, faDiagramProject,
  faDatabase, faBug, faComments, faSpinner, faClipboardList,
  faDumbbell, faFileAlt, faFingerprint, faLightbulb, faChartLine,
  faTriangleExclamation, faRotateRight, faShield, faVideoSlash, faWandMagicSparkles, 
  faChevronDown, faArrowTrendUp, faArrowTrendDown, faUserTie,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

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

const TYPE_META = {
  typing: { label: 'Typing Speed', icon: faKeyboard, accent: 'text-blue-400', gradient: 'from-blue-500 to-cyan-500' },
  programming: { label: 'Coding Challenge', icon: faCode, accent: 'text-violet-400', gradient: 'from-violet-500 to-purple-600' },
  flowchart: { label: 'Flowchart', icon: faDiagramProject, accent: 'text-amber-400', gradient: 'from-amber-500 to-orange-500' },
  sql: { label: 'SQL Query', icon: faDatabase, accent: 'text-emerald-400', gradient: 'from-emerald-500 to-teal-600' },
  bugfix: { label: 'Bug Fixing', icon: faBug, accent: 'text-rose-400', gradient: 'from-rose-500 to-pink-600' },
  communication: { label: 'Communication', icon: faComments, accent: 'text-cyan-400', gradient: 'from-cyan-500 to-blue-600' },
}

const scoreColor = (s) =>
  s === null || s === undefined ? 'text-gray-500'
    : s >= 80 ? 'text-emerald-400'
      : s >= 60 ? 'text-blue-400'
        : s >= 40 ? 'text-amber-400'
          : 'text-rose-400'

const formatDate = (d) => new Date(d).toLocaleString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
})

const StudentResults = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { fetchResults() }, [])

  const fetchResults = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await api.get('/assessments/history')
      setResults(res.data.data || [])
    } catch (err) {
      // A first-time student and a broken connection shouldn't look the same.
      setLoadError(err.response?.data?.message || 'Couldn\u2019t load your results.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  // Newest first, so "how did I do last time" is the first thing on screen.
  const sorted = useMemo(
    () => [...results].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [results]
  )

  const visible = useMemo(
    () => filter === 'all' ? sorted : sorted.filter(r => r.type === filter),
    [sorted, filter]
  )

  // Comparing each attempt to the one before it in the same type is the whole
  // point of keeping history — a list of scores without direction says little.
  const trendFor = (result) => {
    const sameType = sorted.filter(r => r.type === result.type)
    const idx = sameType.findIndex(r => r.id === result.id)
    const previous = sameType[idx + 1]        // sorted newest first
    if (!previous || previous.score === null || result.score === null) return null
    const diff = result.score - previous.score
    if (diff === 0) return { diff: 0, label: 'Same as last time' }
    return {
      diff,
      label: `${diff > 0 ? '+' : ''}${diff} vs last attempt`,
    }
  }

  const typesTaken = useMemo(
    () => [...new Set(sorted.map(r => r.type))],
    [sorted]
  )

  const stats = useMemo(() => {
    const scores = sorted.map(r => r.score).filter(s => s !== null && s !== undefined)
    return {
      attempts: sorted.length,
      best: scores.length ? Math.max(...scores) : null,
      average: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      graded: sorted.filter(r => r.test_id).length,
    }
  }, [sorted])

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
            <h1 className="text-white font-bold text-lg">My results</h1>
            <p className="text-gray-500 text-xs">Every attempt you&apos;ve made, and how you did</p>
          </div>
          {!loading && (
            <button onClick={fetchResults} aria-label="Refresh"
              className="ml-auto w-9 h-9 border border-white/8 bg-white/[0.03] rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all">
              <FontAwesomeIcon icon={faRotateRight} className="text-sm" />
            </button>
          )}
        </header>

        <main className="flex-1 px-6 py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <FontAwesomeIcon icon={faSpinner} className="text-blue-400 text-3xl animate-spin" />
              <p className="text-gray-500 text-sm">Loading your results...</p>
            </div>

          ) : loadError ? (
            <div className="max-w-md mx-auto mt-16 text-center">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 text-3xl mb-4" />
              <p className="text-white font-bold mb-1">{loadError}</p>
              <p className="text-gray-500 text-sm mb-6">This is a connection problem, not an empty history.</p>
              <button onClick={fetchResults}
                className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-2xl transition-colors">
                <FontAwesomeIcon icon={faRotateRight} /> Try again
              </button>
            </div>

          ) : sorted.length === 0 ? (
            <div className="max-w-md mx-auto mt-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mx-auto mb-5">
                <FontAwesomeIcon icon={faChartLine} className="text-blue-400 text-xl" />
              </div>
              <p className="text-white font-bold text-lg mb-2">Nothing here yet</p>
              <p className="text-gray-500 text-sm mb-6">
                Take an assessment and every attempt will be kept here — your score, the
                feedback, and whether you improved.
              </p>
              <Link to="/student/assessment"
                className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold px-5 py-3 rounded-2xl transition-colors">
                <FontAwesomeIcon icon={faTrophy} /> Take your first assessment
              </Link>
            </div>

          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Attempts', value: stats.attempts, icon: faChartLine, color: 'text-blue-400' },
                  { label: 'Best score', value: stats.best ?? '—', icon: faTrophy, color: scoreColor(stats.best) },
                  { label: 'Average', value: stats.average ?? '—', icon: faStar, color: scoreColor(stats.average) },
                  { label: 'Graded tests', value: stats.graded, icon: faUserTie, color: 'text-amber-400' },
                ].map((s, i) => (
                  <div key={i} className="border border-white/8 bg-white/[0.03] rounded-2xl p-4">
                    <FontAwesomeIcon icon={s.icon} className={`${s.color} text-sm mb-2`} />
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-gray-500 text-xs">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Filter */}
              <div className="flex flex-wrap gap-2 mb-5">
                <button
                  onClick={() => setFilter('all')}
                  className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                    filter === 'all'
                      ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                      : 'border-white/8 text-gray-500 hover:text-white hover:border-white/20'
                  }`}>
                  All ({sorted.length})
                </button>
                {typesTaken.map(type => {
                  const meta = TYPE_META[type] || {}
                  const count = sorted.filter(r => r.type === type).length
                  return (
                    <button
                      key={type}
                      onClick={() => setFilter(type)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                        filter === type
                          ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                          : 'border-white/8 text-gray-500 hover:text-white hover:border-white/20'
                      }`}>
                      <FontAwesomeIcon icon={meta.icon} className={filter === type ? '' : meta.accent} />
                      {meta.label || type} ({count})
                    </button>
                  )
                })}
              </div>

              {/* List */}
              <div className="flex flex-col gap-3">
                {visible.map((r) => {
                  const meta = TYPE_META[r.type] || { label: r.type, icon: faTrophy, accent: 'text-gray-400', gradient: 'from-gray-600 to-gray-700' }
                  const m = r.metadata || {}
                  const flags = (m.violation_count || 0) + (m.camera_violation_count || 0)
                  const trend = trendFor(r)
                  const open = expanded === r.id

                  return (
                    <div key={r.id} className="border border-white/8 bg-white/[0.03] rounded-2xl overflow-hidden">

                      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                        <div className={`w-10 h-10 bg-gradient-to-br ${meta.gradient} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <FontAwesomeIcon icon={meta.icon} className="text-white text-sm" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-white text-sm font-semibold">{meta.label}</p>
                            {/* A graded test and a practice run are not the same
                                thing, and the student should be able to tell. */}
                            {r.test_id ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                Assigned test
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 border border-white/10 bg-white/5 px-2 py-0.5 rounded-full">
                                Practice
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 text-xs mt-0.5">
                            {formatDate(r.created_at)}
                            {m.difficulty && <span className="capitalize"> · {m.difficulty}</span>}
                          </p>
                        </div>

                        {trend && (
                          <span className={`flex items-center gap-1.5 text-xs font-semibold flex-shrink-0 ${
                            trend.diff > 0 ? 'text-emerald-400' : trend.diff < 0 ? 'text-rose-400' : 'text-gray-500'
                          }`}>
                            {trend.diff !== 0 && (
                              <FontAwesomeIcon icon={trend.diff > 0 ? faArrowTrendUp : faArrowTrendDown} />
                            )}
                            {trend.label}
                          </span>
                        )}

                        {flags > 0 && (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 border border-rose-500/25 bg-rose-500/10 px-2.5 py-1 rounded-full flex-shrink-0">
                            <FontAwesomeIcon icon={faShield} /> {flags}
                          </span>
                        )}

                        {m.unproctored && (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 rounded-full flex-shrink-0">
                            <FontAwesomeIcon icon={faVideoSlash} /> No camera
                          </span>
                        )}

                        <div className="w-16 text-right flex-shrink-0">
                          <p className={`text-2xl font-black ${scoreColor(r.score)}`}>{r.score}</p>
                        </div>

                        <button
                          onClick={() => setExpanded(open ? null : r.id)}
                          aria-expanded={open}
                          aria-label={`${open ? 'Hide' : 'Show'} details`}
                          className="w-9 h-9 rounded-xl border border-white/8 text-gray-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center flex-shrink-0">
                          <FontAwesomeIcon icon={faChevronDown}
                            className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {open && (
                        <div className="border-t border-white/5 px-5 py-5 flex flex-col gap-4">

                          {m.challenge_title && (
                            <p className="text-gray-400 text-sm">
                              <span className="text-gray-600">Task:</span> {m.challenge_title}
                            </p>
                          )}

                          {/* Type-specific numbers */}
                          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
                            {m.wpm !== null && m.wpm !== undefined && (
                              <span>WPM: <span className="text-white font-mono">{m.wpm}</span></span>
                            )}
                            {m.accuracy !== null && m.accuracy !== undefined && (
                              <span>Accuracy: <span className="text-white font-mono">{m.accuracy}%</span></span>
                            )}
                            {m.correctness && (
                              <span>Correctness: <span className="text-white capitalize">{m.correctness}</span></span>
                            )}
                            {m.bugs_fixed && (
                              <span>Bugs fixed: <span className="text-white capitalize">{m.bugs_fixed}</span></span>
                            )}
                            {m.logical_flow && (
                              <span>Logic: <span className="text-white capitalize">{m.logical_flow}</span></span>
                            )}
                            {m.time_taken_seconds ? (
                              <span>Took: <span className="text-white font-mono">
                                {m.time_taken_seconds < 60 ? `${m.time_taken_seconds}s` : `${Math.round(m.time_taken_seconds / 60)} min`}
                              </span></span>
                            ) : null}
                            {m.penalty_applied > 0 && (
                              <span>Penalty: <span className="text-rose-400 font-mono">−{m.penalty_applied}</span></span>
                            )}
                          </div>

                          {m.strengths && (
                            <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-4">
                              <p className="text-emerald-400 text-xs font-semibold mb-1.5">What you did well</p>
                              <p className="text-gray-300 text-sm leading-relaxed">{m.strengths}</p>
                            </div>
                          )}

                          {m.improvements && (
                            <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-4">
                              <p className="text-amber-400 text-xs font-semibold mb-1.5">What to work on</p>
                              <p className="text-gray-300 text-sm leading-relaxed">{m.improvements}</p>
                            </div>
                          )}

                          {m.feedback && (
                            <div className="border border-violet-500/20 bg-violet-500/5 rounded-2xl p-4">
                              <p className="text-violet-400 text-xs font-semibold mb-1.5 flex items-center gap-2">
                                <FontAwesomeIcon icon={faRobot} /> AI feedback
                              </p>
                              <p className="text-gray-300 text-sm leading-relaxed">{m.feedback}</p>
                            </div>
                          )}

                          {flags > 0 && (
                            <p className="text-rose-400 text-xs">
                              {m.violation_count > 0 && `${m.violation_count} tab switch or paste attempt${m.violation_count > 1 ? 's' : ''}`}
                              {m.violation_count > 0 && m.camera_violation_count > 0 && ' · '}
                              {m.camera_violation_count > 0 && `${m.camera_violation_count} camera violation${m.camera_violation_count > 1 ? 's' : ''}`}
                            </p>
                          )}

                          {!m.feedback && !m.strengths && (
                            <p className="text-gray-600 text-xs">No written feedback was recorded for this attempt.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {visible.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-12">
                  No attempts of that type yet.
                </p>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default StudentResults