import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faBars, faTimes,
  faRightFromBracket, faSpinner, faCircleCheck, faTriangleExclamation,
  faPlus, faXmark, faSave, faRotateRight, faPen, faTrash,
  faKeyboard, faCode, faDiagramProject, faDatabase, faBug, faComments,
  faFlaskVial, faUsers, faEye, faEyeSlash, faMagnifyingGlass,
  faChartSimple,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import api from '../../services/api'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

// Must match EvaluatorDashboard, EvaluatorStudents and TestSubmission exactly.
// Each page keeps its own copy, so a difference here makes the sidebar jump
// as the professor moves between pages.
const navItems = [
  { label: 'Dashboard', icon: faHouse, path: '/evaluator/dashboard' },
  { label: 'My Tests', icon: faFlaskVial, path: '/evaluator/tests' },
  { label: 'Students', icon: faUsers, path: '/evaluator/students' },
  { label: 'Messages', icon: faComments, path: '/evaluator/messages' },
]

// Mirrors VALID_TYPES and REQUIRED_CONFIG_FIELDS in test.service.js. If that
// list changes on the server, change it here too — the server is the one that
// actually enforces it; this just avoids a pointless round trip.
const TEST_TYPES = [
  {
    value: 'typing', label: 'Speed typing', icon: faKeyboard, accent: 'text-blue-400',
    blurb: 'A passage to type against the clock.',
    fields: [
      { key: 'text_passage', label: 'Text passage', type: 'textarea', rows: 5, required: true,
        placeholder: 'The passage the student will type…' },
      { key: 'duration_seconds', label: 'Duration (seconds)', type: 'number', required: true,
        placeholder: '60' },
    ],
  },
  {
    value: 'programming', label: 'Programming challenge', icon: faCode, accent: 'text-violet-400',
    blurb: 'A coding problem with starter code.',
    fields: [
      { key: 'problem_statement', label: 'Problem statement', type: 'textarea', rows: 5, required: true,
        placeholder: 'Write a function that…' },
      { key: 'starter_code', label: 'Starter code', type: 'textarea', rows: 6, mono: true, required: true,
        placeholder: 'def solve(nums):\n    pass' },
      { key: 'language', label: 'Language', type: 'text', required: true, placeholder: 'python' },
      { key: 'test_cases', label: 'Test cases', type: 'testcases',
        hint: 'Optional. Each pair is one input and the output it should produce.' },
    ],
  },
  {
    value: 'bugfix', label: 'Bug fix', icon: faBug, accent: 'text-rose-400',
    blurb: 'Broken code the student has to repair.',
    fields: [
      { key: 'buggy_code', label: 'Buggy code', type: 'textarea', rows: 7, mono: true, required: true,
        placeholder: 'def average(total, count):\n    return total / count' },
      { key: 'language', label: 'Language', type: 'text', required: true, placeholder: 'python' },
      { key: 'test_cases', label: 'Test cases', type: 'testcases',
        hint: 'Optional. These are what the fixed code has to pass.' },
    ],
  },
  {
    value: 'sql', label: 'SQL query', icon: faDatabase, accent: 'text-sky-400',
    blurb: 'A schema and a question to answer with SQL.',
    fields: [
      // Tables AND rows. Students see the rows and run their queries against
      // them; without data there is nothing to check a query against.
      { key: 'schema_sql', label: 'Tables and sample data', type: 'textarea', rows: 10, mono: true, required: true,
        placeholder:
          'CREATE TABLE departments (\n  department_id INT PRIMARY KEY,\n  department_name VARCHAR(50)\n);\n\n' +
          'CREATE TABLE employees (\n  employee_id INT PRIMARY KEY,\n  first_name VARCHAR(50),\n  department_id INT,\n  salary DECIMAL(10,2)\n);\n\n' +
          "INSERT INTO departments VALUES (1, 'IT'), (2, 'HR');\n" +
          "INSERT INTO employees VALUES\n  (1, 'Ana', 1, 35000),\n  (2, 'Ben', 2, 18000),\n  (3, 'Carla', 1, 22000);",
        hint: 'CREATE TABLE for each table, then INSERT the rows students will query. Use six or more rows per table, varied enough that a wrong query gives a different result from a right one. Name link columns after the table they point to (department_id → departments) and the diagram draws the relationship for you.' },
      { key: 'question', label: 'Question', type: 'textarea', rows: 3, required: true,
        placeholder: 'List the first_name of every employee earning more than 20000, highest salary first.',
        hint: 'Name the exact columns to return, or exactly what to change, so there is one correct result.' },
      // Replaces the old expected_query field, which was only a note for the
      // professor — and, sitting in config, was sent to students' browsers.
      { key: 'solution_sql', label: 'Correct answer', type: 'textarea', rows: 4, mono: true,
        placeholder: 'SELECT first_name FROM employees WHERE salary > 20000 ORDER BY salary DESC;',
        hint: "Strongly recommended. The student's query and this one both run on your sample data and the results are compared, so marking is based on what the query returns rather than how it looks. Never shown to students. Checked when you save — a typo here will be reported before anyone sits the test." },
    ],
  },
  {
    value: 'flowchart', label: 'Flowchart design', icon: faDiagramProject, accent: 'text-emerald-400',
    blurb: 'A process the student has to diagram.',
    fields: [
      { key: 'scenario_description', label: 'Scenario', type: 'textarea', rows: 5, required: true,
        placeholder: 'Draw the flow for a login process that…' },
      { key: 'rubric', label: 'Rubric criteria', type: 'list',
        placeholder: 'correct start and end, decision points, loop logic',
        hint: 'Optional. Separate each criterion with a comma.' },
    ],
  },
  {
    value: 'communication', label: 'Communication', icon: faComments, accent: 'text-fuchsia-400',
    blurb: 'A prompt to answer in plain language.',
    fields: [
      { key: 'prompt', label: 'Prompt', type: 'textarea', rows: 5, required: true,
        placeholder: 'Explain recursion to someone who has never programmed…' },
      { key: 'rubric', label: 'Rubric criteria', type: 'list',
        placeholder: 'clarity, structure, plain language',
        hint: 'Optional. Separate each criterion with a comma.' },
    ],
  },
]

const typeOf = (v) => TEST_TYPES.find(t => t.value === v) || TEST_TYPES[0]

const EMPTY_FORM = {
  type: 'typing',
  title: '',
  description: '',
  time_limit_minutes: '',
  is_published: false,
  config: {},
}

const inputClass = 'w-full bg-white/[0.04] border border-white/10 hover:border-white/20 focus:border-amber-400/60 focus:bg-amber-400/[0.06] rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none transition-all'
const labelClass = 'text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block'

// Input/output pairs for programming and bugfix tests. Stored as an array in
// config.test_cases, so it needs its own control rather than a plain input.
const TestCaseEditor = ({ rows, onChange }) => {
  const list = Array.isArray(rows) ? rows : []
  const update = (i, key, value) =>
    onChange(list.map((r, idx) => idx === i ? { ...r, [key]: value } : r))

  return (
    <div className="flex flex-col gap-2">
      {list.map((tc, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            className={`${inputClass} font-mono text-xs py-2.5`}
            placeholder="Input"
            value={tc.input ?? ''}
            onChange={e => update(i, 'input', e.target.value)}
          />
          <input
            className={`${inputClass} font-mono text-xs py-2.5`}
            placeholder="Expected output"
            value={tc.expected_output ?? ''}
            onChange={e => update(i, 'expected_output', e.target.value)}
          />
          <button
            type="button"
            onClick={() => onChange(list.filter((_, idx) => idx !== i))}
            aria-label={`Remove test case ${i + 1}`}
            className="w-9 h-9 flex-shrink-0 rounded-xl border border-white/10 text-gray-500 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all flex items-center justify-center">
            <FontAwesomeIcon icon={faTrash} className="text-xs" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...list, { input: '', expected_output: '' }])}
        className="self-start flex items-center gap-2 text-amber-400 hover:text-amber-300 text-xs font-semibold mt-1">
        <FontAwesomeIcon icon={faPlus} /> Add test case
      </button>
    </div>
  )
}

const Avatar = ({ name, gradient = 'from-amber-500 to-orange-500', size = 'w-9 h-9', text = 'text-sm' }) => (
  <div className={`${size} bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white font-bold ${text} flex-shrink-0`}>
    {name?.charAt(0)?.toUpperCase() || '?'}
  </div>
)

const ProfessorTests = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { totalUnread } = useNotifications()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [toast, setToast] = useState(null)
  const [busyId, setBusyId] = useState(null)

  // create / edit
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)      // test being edited, or null
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // assign
  const [assignTo, setAssignTo] = useState(null)     // test being assigned, or null
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [picked, setPicked] = useState([])
  const [dueDate, setDueDate] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [assigning, setAssigning] = useState(false)

  const toastTimer = useRef(null)

  useEffect(() => {
    fetchTests()
    return () => clearTimeout(toastTimer.current)
  }, [])

  // Escape closes whichever panel is open.
  useEffect(() => {
    if (!showForm && !assignTo) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (assignTo) setAssignTo(null)
      else closeForm()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showForm, assignTo])

  const showToast = (message, type = 'success') => {
    clearTimeout(toastTimer.current)
    setToast({ message, type })
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  const fetchTests = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await api.get('/tests/mine')
      setTests(res.data.data || [])
    } catch (err) {
      // A failed request and an empty list shouldn't look the same.
      setLoadError(err.response?.data?.message || 'Couldn\u2019t load your tests.')
    } finally {
      setLoading(false)
    }
  }

  // ── create / edit ──
  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (t) => {
    setEditing(t)
    setForm({
      type: t.type,
      title: t.title || '',
      description: t.description || '',
      time_limit_minutes: t.time_limit_minutes ?? '',
      is_published: !!t.is_published,
      config: (() => {
        const cfg = { ...(t.config || {}) }
        if (t.type === 'sql' && cfg.expected_query && !cfg.solution_sql) {
          cfg.solution_sql = cfg.expected_query
        }
        delete cfg.expected_query
        return cfg
      })(),
    })
    setFormError('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
  }

  // Changing type wipes config — the old keys mean nothing to the new type and
  // the server would reject them as missing fields anyway.
  const changeType = (value) => setForm(f => ({ ...f, type: value, config: f.config.level ? { level: f.config.level } : {} }))

  const setConfig = (key, value) =>
    setForm(f => ({ ...f, config: { ...f.config, [key]: value } }))

  const saveTest = async () => {
    const def = typeOf(form.type)

    if (!form.title.trim()) {
      setFormError('Give the test a title.')
      return
    }
    if (!['easy', 'medium', 'hard'].includes(form.config.level)) {
      setFormError('Choose a level for this test — it decides which title a student can earn.')
      return
    }
    const missing = def.fields.filter(f => f.required && !String(form.config[f.key] ?? '').trim())
    if (missing.length) {
      setFormError(`Fill in: ${missing.map(f => f.label).join(', ')}.`)
      return
    }

    // duration_seconds is typed as a number server-side; a string would pass
    // the "is it present" check and then behave oddly later.
    const config = { ...form.config }
    if (config.duration_seconds !== undefined) {
      config.duration_seconds = Number(config.duration_seconds) || 0
    }
    // The rubric is typed as one comma-separated line but stored as an array.
    if (typeof config.rubric === 'string') {
      config.rubric = config.rubric.split(',').map(x => x.trim()).filter(Boolean)
    }
    // Drop half-finished test case rows rather than saving empty pairs.
    if (Array.isArray(config.test_cases)) {
      config.test_cases = config.test_cases.filter(tc => tc.input || tc.expected_output)
    }

    const payload = {
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim() || null,
      config,
      time_limit_minutes: form.time_limit_minutes === '' ? null : Number(form.time_limit_minutes),
      is_published: form.is_published,
    }

    setSaving(true)
    setFormError('')
    try {
      if (editing) {
        const res = await api.patch(`/tests/${editing.id}`, payload)
        const updated = res.data.data
        setTests(list => list.map(t => t.id === editing.id ? { ...t, ...updated } : t))
        showToast('Test updated.')
      } else {
        const res = await api.post('/tests', payload)
        setTests(list => [res.data.data, ...list])
        showToast('Test created.')
      }
      closeForm()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save the test.')
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (t) => {
    const next = !t.is_published
    setBusyId(t.id)
    try {
      await api.patch(`/tests/${t.id}`, { is_published: next })
      setTests(list => list.map(x => x.id === t.id ? { ...x, is_published: next } : x))
      showToast(next ? 'Published — students can be assigned this now.' : 'Unpublished.')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const removeTest = async (t) => {
    if (!window.confirm(`Delete "${t.title}"? This can't be undone.`)) return
    setBusyId(t.id)
    try {
      await api.delete(`/tests/${t.id}`)
      setTests(list => list.filter(x => x.id !== t.id))
      showToast('Test deleted.')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  // ── assign ──
  const openAssign = async (t) => {
    setAssignTo(t)
    setPicked([])
    setDueDate('')
    setStudentSearch('')
    setLoadingStudents(true)
    try {
      const res = await api.get('/tests/students')
      setStudents(res.data.data || [])
    } catch (err) {
      showToast(err.response?.data?.message || 'Couldn\u2019t load the student list.', 'error')
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }

  const visibleStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase()
    if (!q) return students
    return students.filter(s =>
      s.full_name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
    )
  }, [students, studentSearch])

  const togglePick = (id) =>
    setPicked(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id])

  const submitAssign = async () => {
    if (!picked.length) {
      showToast('Pick at least one student.', 'error')
      return
    }
    setAssigning(true)
    try {
      await api.post(`/tests/${assignTo.id}/assign`, {
        studentUserIds: picked,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      })
      showToast(`Assigned to ${picked.length} ${picked.length === 1 ? 'student' : 'students'}.`)
      setAssignTo(null)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign.', 'error')
    } finally {
      setAssigning(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const published = tests.filter(t => t.is_published)
  const drafts = tests.filter(t => !t.is_published)

  const currentType = typeOf(form.type)

  return (
    <div className="min-h-screen bg-[#060612] flex font-sans">

      <style>{`
        a:focus-visible, button:focus-visible, input:focus-visible,
        select:focus-visible, textarea:focus-visible {
          outline: 2px solid #fbbf24;
          outline-offset: 3px;
          border-radius: 12px;
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rise { animation: riseIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* ══ Sidebar ══ */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0a18] border-r border-white/5 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
          <img src={logo} alt="" className="w-8 h-8 object-contain" />
          <span className="text-lg font-black text-white tracking-tight">
            Pro<span className="text-blue-400">Folio</span>
          </span>
          <button aria-label="Close menu"
            className="ml-auto lg:hidden text-gray-500 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Avatar name={user?.full_name} />
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
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-white border border-amber-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}>
                <FontAwesomeIcon icon={item.icon} className={`text-sm ${isActive ? 'text-amber-400' : ''}`} />
                {item.label}
                {item.path === '/evaluator/messages' && totalUnread > 0 ? (
                  <span className="ml-auto text-[10px] font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded-full">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                ) : isActive ? (
                  <div className="ml-auto w-1.5 h-1.5 bg-amber-400 rounded-full" />
                ) : null}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/5">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
            <FontAwesomeIcon icon={faRightFromBracket} className="text-sm" />
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ══ Main ══ */}
      <div className="flex-1 min-w-0 lg:ml-64 flex flex-col min-h-screen">

        <header className="sticky top-0 z-30 bg-[#060612]/90 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          <button aria-label="Open menu"
            className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <FontAwesomeIcon icon={faBars} className="text-lg" />
          </button>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-base sm:text-lg tracking-tight truncate">My tests</h1>
            <p className="text-gray-500 text-xs truncate">
              {tests.length
                ? `${published.length} published · ${drafts.length} draft`
                : 'Create a test, then assign it to students'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3 flex-shrink-0">
            {!loading && !loadError && (
              <>
                <button onClick={fetchTests} aria-label="Refresh"
                  className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all flex items-center justify-center">
                  <FontAwesomeIcon icon={faRotateRight} className="text-sm" />
                </button>
                <button onClick={openCreate}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-4 py-2.5 rounded-2xl transition-colors">
                  <FontAwesomeIcon icon={faPlus} /> <span className="whitespace-nowrap">New test</span>
                </button>
              </>
            )}
            <span className="hidden sm:block"><Avatar name={user?.full_name} /></span>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <FontAwesomeIcon icon={faSpinner} className="text-amber-400 text-3xl animate-spin" />
              <p className="text-gray-500 text-sm">Loading your tests...</p>
            </div>

          ) : loadError ? (
            <div className="max-w-md mx-auto mt-16 text-center">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 text-3xl mb-4" />
              <p className="text-white font-bold mb-1">{loadError}</p>
              <p className="text-gray-500 text-sm mb-6">This is a connection problem, not an empty list.</p>
              <button onClick={fetchTests}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-5 py-2.5 rounded-2xl transition-colors">
                <FontAwesomeIcon icon={faRotateRight} /> Try again
              </button>
            </div>

          ) : tests.length === 0 ? (
            <div className="max-w-md mx-auto mt-16 text-center rise">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">
                <FontAwesomeIcon icon={faFlaskVial} className="text-amber-400 text-xl" />
              </div>
              <p className="text-white font-bold text-lg mb-2">No tests yet</p>
              <p className="text-gray-500 text-sm mb-6">
                Build one for your class — typing, coding, SQL, bug fixing, flowcharts, or a
                written prompt. You assign it once it&apos;s published.
              </p>
              <button onClick={openCreate}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-5 py-3 rounded-2xl transition-colors">
                <FontAwesomeIcon icon={faPlus} /> Create your first test
              </button>
            </div>

          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 rise">
              {tests.map(t => {
                const def = typeOf(t.type)
                const busy = busyId === t.id
                return (
                  <div key={t.id}
                    className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 flex flex-col gap-4 hover:border-white/15 transition-all">

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <FontAwesomeIcon icon={def.icon} className={def.accent} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-bold text-sm truncate">{t.title}</p>
                        <p className="text-gray-500 text-xs">{def.label}</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border flex-shrink-0 ${
                        t.is_published
                          ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
                          : 'text-gray-400 border-white/15 bg-white/5'
                      }`}>
                        {t.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    {t.description && (
                      <p className="text-gray-400 text-xs leading-relaxed overflow-hidden"
                        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {t.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-600 font-mono">
                      {t.time_limit_minutes ? <span>{t.time_limit_minutes} min</span> : <span>No time limit</span>}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-auto pt-1">
                      <button
                        onClick={() => openAssign(t)}
                        disabled={busy || !t.is_published}
                        title={t.is_published ? undefined : 'Publish it first'}
                        className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-3 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        <FontAwesomeIcon icon={faUsers} /> Assign
                      </button>

                      <button
                        onClick={() => navigate(`/evaluator/tests/${t.id}/submissions`)}
                        disabled={busy}
                        className="flex items-center gap-1.5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.06] text-xs font-semibold px-3 py-2 rounded-xl transition-all disabled:opacity-50">
                        <FontAwesomeIcon icon={faChartSimple} /> Results
                      </button>

                      <button
                        onClick={() => togglePublish(t)}
                        disabled={busy}
                        className="flex items-center gap-1.5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.06] text-xs font-semibold px-3 py-2 rounded-xl transition-all disabled:opacity-50">
                        <FontAwesomeIcon icon={busy ? faSpinner : (t.is_published ? faEyeSlash : faEye)}
                          className={busy ? 'animate-spin' : ''} />
                        {t.is_published ? 'Unpublish' : 'Publish'}
                      </button>

                      <button
                        onClick={() => openEdit(t)}
                        disabled={busy}
                        aria-label={`Edit ${t.title}`}
                        className="w-8 h-8 rounded-xl border border-white/10 text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all flex items-center justify-center disabled:opacity-50">
                        <FontAwesomeIcon icon={faPen} className="text-xs" />
                      </button>

                      <button
                        onClick={() => removeTest(t)}
                        disabled={busy}
                        aria-label={`Delete ${t.title}`}
                        className="w-8 h-8 rounded-xl border border-white/10 text-gray-500 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all flex items-center justify-center disabled:opacity-50">
                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {/* ══ Create / edit ══ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 py-10 bg-black/70 backdrop-blur-sm overflow-y-auto"
          onClick={closeForm}>
          <div role="dialog" aria-modal="true" aria-label={editing ? 'Edit test' : 'New test'}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#0a0a18] border border-white/10 rounded-2xl overflow-hidden shadow-2xl rise my-auto">

            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 sticky top-0 bg-[#0a0a18] z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <FontAwesomeIcon icon={currentType.icon} className="text-amber-400 text-sm" />
                </div>
                <p className="text-white font-bold">{editing ? 'Edit test' : 'New test'}</p>
              </div>
              <button onClick={closeForm} aria-label="Close"
                className="text-gray-500 hover:text-white transition-colors">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-5">

              {formError && (
                <div role="alert"
                  className="flex items-start gap-3 border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm px-4 py-3 rounded-2xl">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Type */}
              <div>
                <span className={labelClass}>Type</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {TEST_TYPES.map(t => {
                    const active = form.type === t.value
                    return (
                      <button
                        key={t.value} type="button"
                        onClick={() => changeType(t.value)}
                        aria-pressed={active}
                        className={`flex flex-col items-start gap-1 p-3 rounded-2xl border text-left transition-all ${
                          active
                            ? 'border-amber-400/60 bg-amber-400/10'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
                        }`}>
                        <FontAwesomeIcon icon={t.icon} className={active ? 'text-amber-400' : t.accent} />
                        <span className={`text-xs font-bold ${active ? 'text-white' : 'text-gray-300'}`}>
                          {t.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-gray-600 text-xs mt-2">{currentType.blurb}</p>
                {editing && (
                  <p className="text-amber-300/80 text-xs mt-1">
                    Changing the type clears the fields below.
                  </p>
                )}
              </div>

              {/* Title + description */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="title" className={labelClass}>Title *</label>
                  <input id="title" className={inputClass} value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Week 3 — loops and conditionals" />
                </div>
                <div>
                  <label htmlFor="time_limit" className={labelClass}>Time limit (minutes)</label>
                  <input id="time_limit" type="number" min="1" className={inputClass}
                    value={form.time_limit_minutes}
                    onChange={e => setForm(f => ({ ...f, time_limit_minutes: e.target.value }))}
                    placeholder="Leave blank for none" />
                </div>
              </div>

              {/* Stored in config.level. Same three levels as practice. */}
              <div>
                <p className={labelClass}>Level</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: 'easy',   name: 'Easy',   year: '1st year',     title: 'up to Trainee' },
                    { v: 'medium', name: 'Medium', year: '2nd year',     title: 'up to Associate' },
                    { v: 'hard',   name: 'Hard',   year: '3rd–4th year', title: 'up to Junior' },
                  ].map(l => {
                    const on = form.config.level === l.v
                    return (
                      <button
                        key={l.v}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, config: { ...f.config, level: l.v } }))}
                        className={`rounded-xl border px-3 py-2 text-left transition-all ${
                          on ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <p className={`text-sm font-semibold ${on ? 'text-amber-300' : 'text-gray-300'}`}>{l.name}</p>
                        <p className="text-[11px] text-gray-500">{l.year} · {l.title}</p>
                      </button>
                    )
                  })}
                </div>
                <p className="text-gray-600 text-xs mt-1.5">
                  Decides the verified title this test can award. A student scoring 85 or higher earns the title
                  for this level; 70 or higher earns the one below.
                </p>
              </div>

              <div>
                <label htmlFor="description" className={labelClass}>Description</label>
                <textarea id="description" rows={2} className={`${inputClass} resize-none`}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What the student should know before starting." />
              </div>

              {/* Type-specific fields */}
              <div className="border-t border-white/5 pt-5 flex flex-col gap-4">
                <p className="text-white font-bold text-sm">{currentType.label} details</p>

                {currentType.fields.map(fd => (
                  <div key={fd.key}>
                    <label htmlFor={fd.key} className={labelClass}>
                      {fd.label}{fd.required && ' *'}
                    </label>
                    {fd.type === 'testcases' ? (
                      <TestCaseEditor
                        rows={form.config[fd.key]}
                        onChange={rows => setConfig(fd.key, rows)}
                      />
                    ) : fd.type === 'list' ? (
                      /* Stored as an array, edited as a comma-separated line */
                      <input
                        id={fd.key} type="text"
                        className={inputClass}
                        value={Array.isArray(form.config[fd.key])
                          ? form.config[fd.key].join(', ')
                          : (form.config[fd.key] ?? '')}
                        onChange={e => setConfig(fd.key, e.target.value)}
                        placeholder={fd.placeholder}
                      />
                    ) : fd.type === 'textarea' ? (
                      <textarea
                        id={fd.key} rows={fd.rows || 4}
                        className={`${inputClass} resize-y ${fd.mono ? 'font-mono text-xs leading-relaxed' : ''}`}
                        value={form.config[fd.key] ?? ''}
                        onChange={e => setConfig(fd.key, e.target.value)}
                        placeholder={fd.placeholder}
                      />
                    ) : (
                      <input
                        id={fd.key} type={fd.type}
                        className={inputClass}
                        value={form.config[fd.key] ?? ''}
                        onChange={e => setConfig(fd.key, e.target.value)}
                        placeholder={fd.placeholder}
                      />
                    )}
                    {fd.hint && <p className="text-gray-600 text-xs mt-1.5">{fd.hint}</p>}
                  </div>
                ))}
              </div>

              {/* Publish */}
              <label className="flex items-start gap-3 border border-white/10 bg-white/[0.03] rounded-2xl p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 accent-amber-500"
                />
                <span>
                  <span className="text-white text-sm font-semibold block">Publish now</span>
                  <span className="text-gray-500 text-xs">
                    A draft is only visible to you. You have to publish before you can assign it.
                  </span>
                </span>
              </label>

              <div className="flex flex-wrap gap-3">
                <button onClick={saveTest} disabled={saving}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-6 py-3 rounded-2xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  <FontAwesomeIcon icon={saving ? faSpinner : faSave} className={saving ? 'animate-spin' : ''} />
                  {saving ? 'Saving...' : (editing ? 'Save changes' : 'Create test')}
                </button>
                <button onClick={closeForm} disabled={saving}
                  className="border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-gray-400 hover:text-white text-sm font-semibold px-5 py-3 rounded-2xl transition-all disabled:opacity-60">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Assign ══ */}
      {assignTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setAssignTo(null)}>
          <div role="dialog" aria-modal="true" aria-label="Assign test"
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0a0a18] border border-white/10 rounded-2xl overflow-hidden shadow-2xl rise flex flex-col max-h-[85vh]">

            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <div className="min-w-0">
                <p className="text-white font-bold truncate">Assign test</p>
                <p className="text-gray-500 text-xs truncate">{assignTo.title}</p>
              </div>
              <button onClick={() => setAssignTo(null)} aria-label="Close"
                className="text-gray-500 hover:text-white transition-colors flex-shrink-0">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-white/5 flex flex-col gap-3">
              <div>
                <label htmlFor="due_date" className={labelClass}>Due date</label>
                <input id="due_date" type="datetime-local" className={inputClass}
                  value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>

              <div className="relative">
                <FontAwesomeIcon icon={faMagnifyingGlass}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none" />
                <input
                  type="search" value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  placeholder="Search students"
                  aria-label="Search students"
                  className="w-full bg-white/[0.04] border border-white/10 hover:border-white/20 focus:border-amber-400/60 rounded-xl pl-9 pr-3 py-2.5 text-white text-xs placeholder-gray-600 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingStudents ? (
                <div className="flex items-center justify-center py-12 gap-2 text-gray-500 text-sm">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Loading students...
                </div>
              ) : visibleStudents.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-12 px-6">
                  {studentSearch ? `No one matches "${studentSearch}".` : 'No students have signed up yet.'}
                </p>
              ) : (
                <div className="divide-y divide-white/5">
                  {visibleStudents.map(s => {
                    const on = picked.includes(s.id)
                    return (
                      <label key={s.id}
                        className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors ${
                          on ? 'bg-amber-500/[0.08]' : 'hover:bg-white/[0.02]'
                        }`}>
                        <input
                          type="checkbox" checked={on}
                          onChange={() => togglePick(s.id)}
                          className="w-4 h-4 accent-amber-500 flex-shrink-0"
                        />
                        <Avatar name={s.full_name} gradient="from-blue-500 to-violet-500" size="w-8 h-8" text="text-xs" />
                        <div className="min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{s.full_name}</p>
                          <p className="text-gray-500 text-xs truncate">{s.email}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/5 flex flex-wrap items-center gap-3">
              <span className="text-gray-500 text-xs">
                {picked.length} selected
              </span>
              <div className="ml-auto flex gap-3">
                <button onClick={() => setAssignTo(null)} disabled={assigning}
                  className="border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-gray-400 hover:text-white text-sm font-semibold px-5 py-2.5 rounded-2xl transition-all disabled:opacity-60">
                  Cancel
                </button>
                <button onClick={submitAssign} disabled={assigning || !picked.length}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-5 py-2.5 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <FontAwesomeIcon icon={assigning ? faSpinner : faCircleCheck} className={assigning ? 'animate-spin' : ''} />
                  {assigning ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div role="status" aria-live="polite"
          className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl text-sm font-semibold rise ${
            toast.type === 'error'
              ? 'border-rose-500/30 bg-[#0a0a18] text-rose-300'
              : 'border-emerald-500/30 bg-[#0a0a18] text-emerald-300'
          }`}>
          <FontAwesomeIcon icon={toast.type === 'error' ? faTriangleExclamation : faCircleCheck} />
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default ProfessorTests