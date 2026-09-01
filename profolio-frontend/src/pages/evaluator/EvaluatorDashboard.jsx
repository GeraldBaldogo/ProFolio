import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faBars, faTimes,
  faRightFromBracket, faSpinner, faCircleCheck, faTriangleExclamation,
  faFlaskVial, faComments, faRotateRight, faPlus, faChartSimple,
  faArrowRight, faUsers, faInbox, faKeyboard, faCode,
  faDiagramProject, faDatabase, faBug, faHourglassHalf,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

// A professor sets tests, reads the results, and talks to students. That's the
// whole job — so that's the whole sidebar.
const navItems = [
  { label: 'Dashboard', icon: faHouse, path: '/evaluator/dashboard' },
  { label: 'My Tests', icon: faFlaskVial, path: '/evaluator/tests' },
  { label: 'Students', icon: faUsers, path: '/evaluator/students' },
  { label: 'Messages', icon: faComments, path: '/evaluator/messages' },
]

const TYPE_META = {
  typing: { label: 'Speed typing', icon: faKeyboard, accent: 'text-blue-400' },
  programming: { label: 'Coding', icon: faCode, accent: 'text-violet-400' },
  bugfix: { label: 'Bug fixing', icon: faBug, accent: 'text-rose-400' },
  sql: { label: 'SQL', icon: faDatabase, accent: 'text-emerald-400' },
  flowchart: { label: 'Flowchart', icon: faDiagramProject, accent: 'text-amber-400' },
  communication: { label: 'Communication', icon: faComments, accent: 'text-cyan-400' },
}

const EvaluatorDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tests, setTests] = useState([])
  const [submissionCounts, setSubmissionCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    setLoadError('')

    let myTests = []
    try {
      const res = await api.get('/tests/mine')
      myTests = res.data.data || []
      setTests(myTests)
    } catch (err) {
      // A failed request used to fall through to an empty page — telling a
      // professor they have no tests when the truth is we couldn't check.
      setLoadError(err.response?.data?.message || 'Couldn\u2019t reach the server.')
      setLoading(false)
      return
    }

    // How many students have answered each published test. Without this the
    // professor has to open every test one by one to find out.
    const published = myTests.filter(t => t.is_published)
    const counts = {}
    await Promise.all(published.map(async (t) => {
      try {
        const res = await api.get(`/tests/${t.id}/assignments`)
        const rows = res.data.data || []
        counts[t.id] = {
          assigned: rows.length,
          submitted: rows.filter(r => r.status === 'submitted').length,
        }
      } catch {
        counts[t.id] = null   // a failed count shouldn't blank the whole card
      }
    }))
    setSubmissionCounts(counts)

    setLoading(false)
  }

  const handleLogout = () => { logout(); navigate('/') }

  const published = useMemo(() => tests.filter(t => t.is_published), [tests])
  const drafts = useMemo(() => tests.filter(t => !t.is_published), [tests])

  const totals = useMemo(() => {
    let assigned = 0
    let submitted = 0
    for (const c of Object.values(submissionCounts)) {
      if (!c) continue
      assigned += c.assigned
      submitted += c.submitted
    }
    return { assigned, submitted, waiting: assigned - submitted }
  }, [submissionCounts])

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
            <h1 className="text-white font-bold text-lg">Professor Dashboard</h1>
            <p className="text-gray-500 text-xs">Welcome, {user?.full_name?.split(' ')[0]}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {!loading && (
              <>
                <button onClick={fetchData}
                  className="w-9 h-9 border border-white/8 bg-white/[0.03] rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all">
                  <FontAwesomeIcon icon={faRotateRight} className="text-sm" />
                </button>
                <Link to="/evaluator/tests"
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
                  <FontAwesomeIcon icon={faPlus} /> New test
                </Link>
              </>
            )}
          </div>
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
              <button onClick={fetchData}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all">
                <FontAwesomeIcon icon={faRotateRight} /> Try again
              </button>
            </div>

          ) : (
            <div className="flex flex-col gap-4">

              {/* ── 1. Numbers about the work they set ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Published tests', value: published.length, sub: drafts.length ? `${drafts.length} still draft` : 'None in draft', icon: faFlaskVial, gradient: 'from-amber-500 to-orange-500' },
                  { label: 'Students assigned', value: totals.assigned, sub: 'Across all tests', icon: faUsers, gradient: 'from-blue-500 to-cyan-500' },
                  { label: 'Submitted', value: totals.submitted, sub: 'Answers received', icon: faCircleCheck, gradient: 'from-green-500 to-teal-500' },
                  { label: 'Still waiting', value: totals.waiting, sub: 'Not yet answered', icon: faHourglassHalf, gradient: 'from-violet-500 to-purple-600' },
                ].map((stat, i) => (
                  <div key={i} className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                    <div className={`w-10 h-10 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center mb-3`}>
                      <FontAwesomeIcon icon={stat.icon} className="text-white text-sm" />
                    </div>
                    <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
                    <p className="text-gray-400 text-xs mb-0.5">{stat.label}</p>
                    <p className="text-gray-600 text-xs">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* ── 2. Their tests, with how many have answered ──
                  This is the professor's actual work, and the old dashboard
                  didn't show it at all. */}
              <div className="border border-white/8 bg-white/[0.03] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                  <FontAwesomeIcon icon={faFlaskVial} className="text-amber-400 text-sm" />
                  <h2 className="text-white font-bold text-sm">Your tests</h2>
                  {tests.length > 0 && (
                    <Link to="/evaluator/tests"
                      className="ml-auto flex items-center gap-2 text-amber-400 hover:text-amber-300 text-xs font-semibold transition-colors">
                      Manage all <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
                    </Link>
                  )}
                </div>

                {tests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                    <FontAwesomeIcon icon={faFlaskVial} className="text-gray-600 text-3xl mb-3" />
                    <p className="text-gray-300 text-sm font-semibold">No tests yet</p>
                    <p className="text-gray-600 text-xs mt-1 mb-5 max-w-sm leading-relaxed">
                      Build one for your class — typing, coding, SQL, bug fixing, flowcharts,
                      or a written prompt. Publish it, then assign it to students.
                    </p>
                    <Link to="/evaluator/tests"
                      className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all">
                      <FontAwesomeIcon icon={faPlus} /> Create your first test
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {tests.slice(0, 5).map((t) => {
                      const meta = TYPE_META[t.type] || { label: t.type, icon: faFlaskVial, accent: 'text-gray-400' }
                      const count = submissionCounts[t.id]
                      const allIn = count && count.assigned > 0 && count.submitted === count.assigned

                      return (
                        <div key={t.id} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-all">
                          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FontAwesomeIcon icon={meta.icon} className={`${meta.accent} text-sm`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{t.title}</p>
                            <p className="text-gray-500 text-xs">{meta.label}</p>
                          </div>

                          {/* Submitted-of-assigned is the one number a professor
                              checks most, so it goes on the row itself. */}
                          {t.is_published && count && (
                            <div className="text-right flex-shrink-0">
                              <p className={`text-sm font-bold ${allIn ? 'text-green-400' : 'text-white'}`}>
                                {count.submitted}<span className="text-gray-600 font-normal">/{count.assigned}</span>
                              </p>
                              <p className="text-gray-600 text-[10px]">
                                {count.assigned === 0 ? 'not assigned' : allIn ? 'all in' : 'submitted'}
                              </p>
                            </div>
                          )}

                          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${
                            t.is_published
                              ? 'text-green-400 border-green-500/20 bg-green-500/10'
                              : 'text-gray-400 border-white/10 bg-white/5'
                          }`}>
                            {t.is_published ? 'Published' : 'Draft'}
                          </span>

                          <button
                            onClick={() => navigate(`/evaluator/tests/${t.id}/submissions`)}
                            className="flex items-center gap-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/20 text-amber-400 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex-shrink-0">
                            <FontAwesomeIcon icon={faChartSimple} /> Results
                          </button>
                        </div>
                      )
                    })}

                    {tests.length > 5 && (
                      <Link to="/evaluator/tests"
                        className="block px-5 py-3 text-amber-400 hover:text-amber-300 text-xs font-semibold transition-colors">
                        See all {tests.length} tests →
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* ── 3. Published but never handed out ── */}
              {published.length > 0 && totals.assigned === 0 && (
                <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={faInbox} className="text-amber-400 text-sm" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm mb-1">Your tests aren&apos;t assigned to anyone yet</p>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      A published test still needs to be given to students before they can
                      answer it. Open My Tests and use Assign.
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

export default EvaluatorDashboard