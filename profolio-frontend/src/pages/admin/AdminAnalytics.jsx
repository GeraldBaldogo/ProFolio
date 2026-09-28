import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faUsers, faChartLine, faBars, faTimes,
  faRightFromBracket, faSpinner, faTriangleExclamation,
  faGraduationCap, faFileAlt, faClipboardCheck, faArrowsRotate, faDownload,
  faArrowTrendUp, faArrowTrendDown, faClock, faArrowRight,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'
import { TrendChart, StackedBars, Donut, BarList, Sparkline, COLORS, weekLabel } from '../../components/admin/Charts'

const navItems = [
  { label: 'Dashboard', icon: faHouse, path: '/admin/dashboard' },
  { label: 'User Management', icon: faUsers, path: '/admin/users' },
  { label: 'Analytics', icon: faChartLine, path: '/admin/analytics' },
]

const RANGES = [4, 12, 26, 52]

const PROCTORING_LABELS = {
  tab_switch: 'Switched tabs',
  window_blur: 'Left the window',
  copy_paste: 'Copy / paste',
  face_not_detected: 'Face not detected',
  multiple_faces: 'Multiple faces',
}
const VERDICT = {
  original: { label: 'Original', color: COLORS.emerald },
  likely_original: { label: 'Likely original', color: COLORS.sky },
  mixed: { label: 'Mixed', color: COLORS.amber },
  likely_ai: { label: 'Likely AI', color: COLORS.rose },
  ai_generated: { label: 'AI-generated', color: '#e11d48' },
}
const pretty = (s) => String(s).replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

// ── Layout pieces ──────────────────────────────────────────────────────────

const Card = ({ title, subtitle, action, children, className = '' }) => (
  <section className={`border border-white/8 bg-white/[0.03] rounded-2xl p-5 flex flex-col ${className}`}>
    {(title || action) && (
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          {title && <h2 className="text-white font-semibold text-sm">{title}</h2>}
          {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    <div className="flex-1">{children}</div>
  </section>
)

const Empty = ({ children = 'No data yet' }) => (
  <div className="h-full min-h-[120px] flex items-center justify-center text-gray-600 text-xs text-center">{children}</div>
)

const Change = ({ value, weeks }) => {
  if (value === null || value === undefined) return <span className="text-gray-500 text-xs">new vs previous {weeks} weeks</span>
  const up = value >= 0
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${value === 0 ? 'text-gray-500' : up ? 'text-emerald-400' : 'text-rose-400'}`}>
      {value !== 0 && <FontAwesomeIcon icon={up ? faArrowTrendUp : faArrowTrendDown} className="text-[10px]" />}
      {up && value > 0 ? '+' : ''}{value}%
      <span className="text-gray-500 font-normal">vs previous {weeks} wks</span>
    </span>
  )
}

const Kpi = ({ icon, label, value, footer, spark, color }) => (
  <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <span className="text-gray-400 text-xs font-medium flex items-center gap-2">
        <FontAwesomeIcon icon={icon} style={{ color }} className="text-sm" /> {label}
      </span>
      {spark && <Sparkline values={spark} color={color} />}
    </div>
    <p className="text-white text-3xl font-bold tracking-tight tabular-nums">{value}</p>
    <div className="min-h-[16px]">{footer}</div>
  </div>
)

// ── CSV export ─────────────────────────────────────────────────────────────
// One file with every table on the page, section by section, for reports.
const toCsv = (a) => {
  const rows = [['Section', 'Item', 'Value', 'Detail']]
  const add = (section, item, value, detail = '') => rows.push([section, item, value, detail])
  add('Range', 'From', a.range.from, `${a.range.weeks} weeks`)
  add('Users', 'Total', a.users.total)
  add('Users', 'Students', a.users.students)
  add('Users', 'Professors', a.users.evaluators)
  add('Users', 'New students in range', a.users.new_students)
  a.funnel.forEach((f) => add('Student journey', f.label, f.value, `${f.percent}%`))
  add('CV', 'Students with a CV', a.cv.students_with_cv, `${a.cv.percent_of_students}%`)
  add('CV', 'Generated in range', a.cv.in_range)
  a.portfolio.coverage.forEach((c) => add('Portfolio coverage', c.label, c.value, `${c.percent}%`))
  a.portfolio.top_skills.forEach((s) => add('Top skills', s.label, s.value))
  a.assessments.by_type.forEach((t) => add('Assessments by type', t.label, t.graded + t.practice, `graded ${t.graded}, practice ${t.practice}, avg graded score ${t.avg_score ?? '-'}`))
  add('Assigned tests', 'Assignments', a.tests.assignments)
  add('Assigned tests', 'Submitted', a.tests.submitted)
  add('Assigned tests', 'Overdue', a.tests.overdue)
  add('Assigned tests', 'Completion rate', `${a.tests.completion_rate}%`)
  a.students.courses.forEach((c) => add('Courses', c.label, c.value))
  a.students.year_levels.forEach((y) => add('Year levels', y.label, y.value))
  a.users.signups_by_week.forEach((w) => add('Signups by week', w.week, w.students, `professors ${w.professors}`))
  a.cv.by_week.forEach((w) => add('CVs by week', w.week, w.cvs))
  a.assessments.by_week.forEach((w) => add('Assessments by week', w.week, w.graded + w.practice, `graded ${w.graded}, practice ${w.practice}`))
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return rows.map((r) => r.map(esc).join(',')).join('\r\n')
}

const AdminAnalytics = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [weeks, setWeeks] = useState(12)

  const fetchAnalytics = useCallback(async (w) => {
    setRefreshing(true)
    setError('')
    try {
      const res = await api.get('/admin/analytics', { params: { weeks: w } })
      setAnalytics(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Couldn\u2019t load analytics.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchAnalytics(weeks) }, [weeks, fetchAnalytics])

  const handleLogout = () => { logout(); navigate('/') }

  const exportCsv = () => {
    const blob = new Blob([toCsv(analytics)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `profolio-analytics-${analytics.generated_at.slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const a = analytics
  const updated = a ? new Date(a.generated_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''

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
          <button className="ml-auto lg:hidden text-gray-500 hover:text-white" aria-label="Close menu" onClick={() => setSidebarOpen(false)}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.full_name}</p>
              <p className="text-rose-400 text-xs">Admin</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-rose-500/15 text-white border border-rose-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <FontAwesomeIcon icon={item.icon} className={`text-sm ${isActive ? 'text-rose-400' : ''}`} />
                {item.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-rose-400 rounded-full" />}
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

      <div className="flex-1 min-w-0 lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-[#060612]/90 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-4 flex flex-wrap items-center gap-3">
          <button className="lg:hidden text-gray-400 hover:text-white" aria-label="Open menu" onClick={() => setSidebarOpen(true)}>
            <FontAwesomeIcon icon={faBars} className="text-lg" />
          </button>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-lg">Analytics</h1>
            <p className="text-gray-500 text-xs">
              {a ? `Since ${weekLabel(a.range.from)} · updated ${updated}` : 'How students are using ProFolio'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-xl border border-white/8 bg-white/[0.03] p-0.5" role="group" aria-label="Date range">
              {RANGES.map((w) => (
                <button key={w} onClick={() => setWeeks(w)} aria-pressed={weeks === w}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${weeks === w ? 'bg-rose-500/20 text-white' : 'text-gray-400 hover:text-white'}`}>
                  {w}w
                </button>
              ))}
            </div>
            <button onClick={() => fetchAnalytics(weeks)} disabled={refreshing} title="Refresh"
              className="w-9 h-9 rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] text-gray-400 hover:text-white transition-colors disabled:opacity-50">
              <FontAwesomeIcon icon={faArrowsRotate} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button onClick={exportCsv} disabled={!a}
              className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] text-gray-300 hover:text-white text-xs font-semibold transition-colors disabled:opacity-50">
              <FontAwesomeIcon icon={faDownload} /> Export CSV
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <FontAwesomeIcon icon={faSpinner} className="text-rose-400 text-3xl animate-spin" />
            </div>
          ) : !a ? (
            <div className="max-w-md mx-auto border border-rose-500/20 bg-rose-500/5 rounded-2xl p-5 flex items-center gap-3">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400" />
              <p className="text-rose-300 text-sm">{error}</p>
            </div>
          ) : (
            <div className={`flex flex-col gap-4 sm:gap-5 transition-opacity ${refreshing ? 'opacity-60' : ''}`}>

              {error && (
                <p className="text-rose-400 text-xs flex items-center gap-2">
                  <FontAwesomeIcon icon={faTriangleExclamation} /> {error} Showing the last loaded data.
                </p>
              )}

              {a.users.pending_professors > 0 && (
                <Link to="/admin/dashboard"
                  className="flex items-center gap-3 border border-amber-500/20 bg-amber-500/[0.06] hover:bg-amber-500/10 rounded-2xl px-4 py-3 transition-colors">
                  <FontAwesomeIcon icon={faClock} className="text-amber-400" />
                  <span className="text-amber-200 text-sm">
                    {a.users.pending_professors} professor account{a.users.pending_professors > 1 ? 's are' : ' is'} waiting for approval
                  </span>
                  <FontAwesomeIcon icon={faArrowRight} className="text-amber-400 text-xs ml-auto" />
                </Link>
              )}

              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <Kpi icon={faGraduationCap} label="Students" color={COLORS.blue}
                  value={a.users.students.toLocaleString()}
                  spark={a.users.signups_by_week.map((w) => w.students)}
                  footer={<div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-400"><span className="text-white font-semibold">+{a.users.new_students}</span> joined in the last {a.range.weeks} weeks</span>
                    <Change value={a.users.new_students_change} weeks={a.range.weeks} />
                  </div>} />
                <Kpi icon={faFileAlt} label="CVs generated" color={COLORS.violet}
                  value={a.cv.in_range.toLocaleString()}
                  spark={a.cv.by_week.map((w) => w.cvs)}
                  footer={<Change value={a.cv.in_range_change} weeks={a.range.weeks} />} />
                <Kpi icon={faClipboardCheck} label="Assessments taken" color={COLORS.emerald}
                  value={a.assessments.in_range.toLocaleString()}
                  spark={a.assessments.by_week.map((w) => w.graded + w.practice)}
                  footer={<Change value={a.assessments.in_range_change} weeks={a.range.weeks} />} />
                <Kpi icon={faChartLine} label="Test completion" color={COLORS.amber}
                  value={`${a.tests.completion_rate}%`}
                  footer={<span className="text-xs text-gray-400">{a.tests.submitted} of {a.tests.assignments} submitted{a.tests.overdue ? <> · <span className="text-rose-400">{a.tests.overdue} overdue</span></> : ''}</span>} />
              </div>

              {/* Journey + signups */}
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                <Card className="xl:col-span-2" title="Student journey" subtitle="Share of all students who have reached each step">
                  {a.funnel[0].value ? (
                    <div className="flex flex-col gap-3.5">
                      {a.funnel.map((step, i) => (
                        <div key={step.key}>
                          <div className="flex items-baseline justify-between mb-1.5">
                            <span className="text-gray-300 text-xs">
                              <span className="text-gray-600 mr-2 tabular-nums">{i + 1}</span>{step.label}
                            </span>
                            <span className="text-xs tabular-nums">
                              <span className="text-white font-semibold">{step.percent}%</span>
                              <span className="text-gray-500 ml-1.5">{step.value}</span>
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${step.percent}%`, background: `linear-gradient(90deg, ${COLORS.rose}, ${COLORS.violet})`, transition: 'width .6s ease' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <Empty>No students yet</Empty>}
                </Card>
                <Card className="xl:col-span-3" title="New accounts" subtitle="Sign-ups per week">
                  <TrendChart data={a.users.signups_by_week} series={[
                    { key: 'students', label: 'Students', color: COLORS.blue },
                    { key: 'professors', label: 'Professors', color: COLORS.amber },
                  ]} />
                </Card>
              </div>

              {/* Assessment activity + test status */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <Card className="xl:col-span-2" title="Assessment activity" subtitle="Attempts per week — graded tests set by professors vs practice">
                  <StackedBars data={a.assessments.by_week} series={[
                    { key: 'graded', label: 'Graded', color: COLORS.emerald },
                    { key: 'practice', label: 'Practice', color: COLORS.slate },
                  ]} />
                </Card>
                <Card title="Assigned tests" subtitle="Where every assignment stands">
                  {a.tests.assignments ? (
                    <Donut stacked centerValue={`${a.tests.completion_rate}%`} centerLabel="submitted" segments={[
                      { label: 'Submitted', value: a.tests.submitted, color: COLORS.emerald },
                      { label: 'Still open', value: a.tests.pending, color: COLORS.sky },
                      { label: 'Overdue', value: a.tests.overdue, color: COLORS.rose },
                    ]} />
                  ) : <Empty>No tests assigned yet</Empty>}
                </Card>
              </div>

              {/* By type + skills */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card title="Assessments by type" subtitle={`Last ${a.range.weeks} weeks · average is for graded tests only`}>
                  {a.assessments.by_type.some((t) => t.graded + t.practice) ? (
                    <div className="flex flex-col gap-3">
                      {a.assessments.by_type.map((t) => {
                        const total = t.graded + t.practice
                        const top = Math.max(1, ...a.assessments.by_type.map((x) => x.graded + x.practice))
                        return (
                          <div key={t.type} className="grid grid-cols-[112px_1fr_64px] items-center gap-3">
                            <span className="text-gray-300 text-xs truncate">{t.label}</span>
                            <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden flex" title={`${t.graded} graded · ${t.practice} practice`}>
                              <div style={{ width: `${(t.graded / top) * 100}%`, background: COLORS.emerald }} />
                              <div style={{ width: `${(t.practice / top) * 100}%`, background: COLORS.slate }} />
                            </div>
                            <span className="text-right text-xs tabular-nums">
                              <span className="text-white font-semibold">{total}</span>
                              <span className="text-gray-500 ml-1.5">{t.avg_score ?? '–'}</span>
                            </span>
                          </div>
                        )
                      })}
                      <p className="text-gray-600 text-[11px] mt-1">Right column: attempts, then average graded score.</p>
                    </div>
                  ) : <Empty>No attempts in this period</Empty>}
                </Card>
                <Card title="Most common skills" subtitle="From student portfolios">
                  {a.portfolio.top_skills.length
                    ? <BarList items={a.portfolio.top_skills} color={COLORS.violet} note={(s) => `${Math.round((s.value / Math.max(1, a.users.students)) * 100)}%`} />
                    : <Empty>No skills added yet</Empty>}
                </Card>
              </div>

              {/* Portfolio + who the students are */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card title="Portfolio coverage" subtitle={`Students with at least one · avg ${a.portfolio.avg_items} items each`}>
                  <BarList color={COLORS.sky} max={100} format={(v) => `${v}%`}
                    items={a.portfolio.coverage.map((c) => ({ label: c.label, value: c.percent, note: `${c.value}` }))} />
                </Card>
                <Card title="Courses" subtitle="Top programmes by students">
                  {a.students.courses.length
                    ? <BarList items={a.students.courses} color={COLORS.blue} />
                    : <Empty>No courses on profiles yet</Empty>}
                </Card>
                <Card title="Year level">
                  {a.students.year_levels.length
                    ? <BarList items={a.students.year_levels} color={COLORS.rose} />
                    : <Empty>No year levels on profiles yet</Empty>}
                </Card>
              </div>

              {/* Integrity */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card title="Proctoring flags" subtitle={`${a.integrity.proctoring_events} events in the last ${a.range.weeks} weeks`}>
                  {a.integrity.proctoring_by_type.length
                    ? <BarList items={a.integrity.proctoring_by_type.map((p) => ({ ...p, label: PROCTORING_LABELS[p.label] || pretty(p.label) }))} color={COLORS.amber} />
                    : <Empty>No proctoring events in this period</Empty>}
                </Card>
                <Card title="Originality checks" subtitle={`${a.integrity.originality_checks} checks in the last ${a.range.weeks} weeks`}>
                  {a.integrity.originality_by_verdict.length ? (
                    <Donut centerLabel="checks" segments={a.integrity.originality_by_verdict.map((v) => ({
                      label: VERDICT[v.label]?.label || pretty(v.label),
                      value: v.value,
                      color: VERDICT[v.label]?.color || COLORS.slate,
                    }))} />
                  ) : <Empty>No originality checks in this period</Empty>}
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default AdminAnalytics