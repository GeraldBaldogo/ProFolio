import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faSpinner, faTriangleExclamation, faRotateRight,
  faCircleCheck, faClock, faHourglassHalf, faShield, faVideoSlash,
  faRobot, faChevronDown, faUsers, faChartSimple,
} from '@fortawesome/free-solid-svg-icons'
import api from '../../services/api'

const statusConfig = {
  pending: { label: 'Not started', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/25', icon: faHourglassHalf },
  in_progress: { label: 'In progress', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/25', icon: faClock },
  submitted: { label: 'Submitted', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', icon: faCircleCheck },
}

// Every assessment type stores its answer under a different key. Rather than a
// generic "answer" field that would be empty for half of them, each type says
// where to look.
const ANSWER_FIELD = {
  typing: null, // typing has no text answer — the score is the whole result
  programming: { key: 'code', label: 'Their code', mono: true },
  bugfix: { key: 'fixed_code', label: 'Their fix', mono: true },
  sql: { key: 'sql_code', label: 'Their query', mono: true },
  communication: { key: 'response_text', label: 'Their response', mono: false },
  flowchart: null, // the drawing is an uploaded image, not stored text
}

const scoreColor = (score) => {
  if (score === null || score === undefined) return 'text-gray-500'
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-blue-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-rose-400'
}

const Avatar = ({ name, size = 'w-10 h-10', text = 'text-sm' }) => (
  <div className={`${size} bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold ${text} flex-shrink-0`}>
    {name?.charAt(0)?.toUpperCase() || 'S'}
  </div>
)

const TestSubmissions = () => {
  const navigate = useNavigate()
  const { id: testId } = useParams()

  const [test, setTest] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [expanded, setExpanded] = useState(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    fetchAll()
    return () => { mounted.current = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId])

  const fetchAll = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [testRes, rowsRes] = await Promise.all([
        api.get(`/tests/${testId}`),
        api.get(`/tests/${testId}/assignments`),
      ])
      if (!mounted.current) return
      setTest(testRes.data.data)
      setRows(rowsRes.data.data || [])
    } catch (err) {
      if (!mounted.current) return
      // An empty class and a failed request shouldn't look the same.
      setLoadError(err.response?.data?.message || 'Couldn\u2019t load submissions.')
    } finally {
      if (mounted.current) setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const submitted = rows.filter(r => r.status === 'submitted')
    const scores = submitted
      .map(r => r.result?.score)
      .filter(s => s !== null && s !== undefined)

    return {
      assigned: rows.length,
      submitted: submitted.length,
      average: scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null,
      flagged: submitted.filter(r =>
        (r.result?.metadata?.violation_count || 0) +
        (r.result?.metadata?.camera_violation_count || 0) > 0
        || r.result?.metadata?.unproctored
      ).length,
    }
  }, [rows])

  const answerFor = (row) => {
    const type = row.result?.type
    const field = ANSWER_FIELD[type]
    if (!field) return null
    const value = row.result?.metadata?.[field.key]
    if (!value) return null
    return { ...field, value }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d10] font-sans flex flex-col items-center justify-center gap-3">
        <FontAwesomeIcon icon={faSpinner} className="text-amber-400 text-2xl animate-spin" />
        <p className="text-gray-500 text-sm">Loading submissions...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#0a0d10] font-sans px-6 py-8 max-w-md mx-auto text-center">
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 text-3xl mb-4 mt-16" />
        <p className="text-white font-bold mb-1">{loadError}</p>
        <p className="text-gray-500 text-sm mb-6">This is a connection problem, not an empty class.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={fetchAll}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-5 py-2.5 rounded-2xl transition-colors">
            <FontAwesomeIcon icon={faRotateRight} /> Try again
          </button>
          <Link to="/evaluator/tests"
            className="inline-flex items-center gap-2 border border-white/10 text-gray-400 hover:text-white text-sm font-semibold px-5 py-2.5 rounded-2xl transition-all">
            Back to tests
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0d10] font-sans px-6 py-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/evaluator/tests')}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-lg tracking-tight truncate">{test?.title}</h1>
            <p className="text-gray-500 text-xs">Who answered, and how they did</p>
          </div>
          <button onClick={fetchAll} aria-label="Refresh"
            className="ml-auto w-9 h-9 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faRotateRight} className="text-sm" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Assigned', value: stats.assigned, icon: faUsers, color: 'text-blue-400' },
            { label: 'Submitted', value: `${stats.submitted}/${stats.assigned}`, icon: faCircleCheck, color: 'text-emerald-400' },
            { label: 'Average', value: stats.average ?? '—', icon: faChartSimple, color: scoreColor(stats.average) },
            { label: 'Flagged', value: stats.flagged, icon: faShield, color: stats.flagged ? 'text-rose-400' : 'text-gray-500' },
          ].map((s, i) => (
            <div key={i} className="border border-white/8 bg-white/[0.03] rounded-3xl p-4">
              <FontAwesomeIcon icon={s.icon} className={`${s.color} text-sm mb-2`} />
              <p className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Rows */}
        {rows.length === 0 ? (
          <div className="border border-white/8 bg-white/[0.03] rounded-3xl py-14 text-center px-6">
            <FontAwesomeIcon icon={faUsers} className="text-gray-600 text-3xl mb-3" />
            <p className="text-gray-300 text-sm font-semibold">Nobody assigned yet</p>
            <p className="text-gray-600 text-xs mt-1">
              Assign this test to students and their submissions will appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((row) => {
              const status = statusConfig[row.status] || statusConfig.pending
              const name = row.users?.full_name || 'Student'
              const result = row.result
              const meta = result?.metadata || {}
              const flags = (meta.violation_count || 0) + (meta.camera_violation_count || 0)
              const answer = answerFor(row)
              const open = expanded === row.id

              return (
                <div key={row.id} className="border border-white/8 bg-white/[0.03] rounded-3xl overflow-hidden">

                  {/* Summary row */}
                  <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                    <Avatar name={name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{name}</p>
                      <p className="text-gray-500 text-xs truncate">{row.users?.email}</p>
                    </div>

                    {/* Flags — worth seeing before the score, since they change
                        how the score should be read */}
                    {result && (flags > 0 || meta.unproctored) && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {flags > 0 && (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 border border-rose-500/25 bg-rose-500/10 px-2.5 py-1 rounded-full">
                            <FontAwesomeIcon icon={faShield} /> {flags}
                          </span>
                        )}
                        {meta.unproctored && (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 rounded-full"
                            title={meta.unproctored_reason || 'No camera during this attempt'}>
                            <FontAwesomeIcon icon={faVideoSlash} /> No camera
                          </span>
                        )}
                      </div>
                    )}

                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${status.bg} ${status.border} ${status.color} flex-shrink-0`}>
                      <FontAwesomeIcon icon={status.icon} /> {status.label}
                    </span>

                    <div className="w-16 text-right flex-shrink-0">
                      {result ? (
                        <p className={`text-2xl font-black font-mono ${scoreColor(result.score)}`}>{result.score}</p>
                      ) : (
                        <p className="text-gray-600 text-2xl font-black font-mono">—</p>
                      )}
                    </div>

                    {result && (
                      <button
                        onClick={() => setExpanded(open ? null : row.id)}
                        aria-expanded={open}
                        aria-label={`${open ? 'Hide' : 'Show'} ${name}'s submission`}
                        className="w-9 h-9 rounded-xl border border-white/10 text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all flex items-center justify-center flex-shrink-0">
                        <FontAwesomeIcon icon={faChevronDown}
                          className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>

                  {/* Detail */}
                  {open && result && (
                    <div className="border-t border-white/8 px-5 py-5 flex flex-col gap-4">

                      {/* Their actual answer */}
                      {answer ? (
                        <div>
                          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">{answer.label}</p>
                          <pre className={`bg-[#0d1218] border border-white/8 rounded-2xl p-4 text-gray-200 text-xs overflow-x-auto whitespace-pre-wrap ${answer.mono ? 'font-mono leading-relaxed' : 'leading-6'}`}>
                            {answer.value}
                          </pre>
                        </div>
                      ) : result.type === 'typing' ? (
                        <div className="flex flex-wrap gap-4 text-xs">
                          <span className="text-gray-500">WPM: <span className="text-white font-mono">{meta.wpm ?? '—'}</span></span>
                          <span className="text-gray-500">Accuracy: <span className="text-white font-mono">{meta.accuracy ?? '—'}%</span></span>
                          <span className="text-gray-500">Time: <span className="text-white font-mono">{meta.time_seconds ?? '—'}s</span></span>
                        </div>
                      ) : (
                        <p className="text-gray-600 text-xs">
                          {result.type === 'flowchart'
                            ? 'The drawing was sent straight to the AI for marking and isn\u2019t stored here.'
                            : 'No written answer was stored for this type.'}
                        </p>
                      )}

                      {/* AI feedback */}
                      {(meta.feedback || meta.overall_feedback) && (
                        <div className="border border-violet-500/25 bg-violet-500/[0.06] rounded-2xl p-4">
                          <p className="text-violet-400 text-xs font-semibold mb-2 flex items-center gap-2">
                            <FontAwesomeIcon icon={faRobot} /> AI feedback
                          </p>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {meta.overall_feedback || meta.feedback}
                          </p>
                          <p className="text-gray-600 text-xs mt-3">
                            A suggestion, not a verdict — your judgement is the one that counts.
                          </p>
                        </div>
                      )}

                      {/* How the score was reached */}
                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
                        {meta.ai_score !== undefined && (
                          <span>AI score: <span className="text-white font-mono">{meta.ai_score}</span></span>
                        )}
                        {meta.penalty_applied > 0 && (
                          <span>Penalty: <span className="text-rose-400 font-mono">−{meta.penalty_applied}</span></span>
                        )}
                        {meta.time_taken_seconds !== undefined && (
                          <span>Took: <span className="text-white font-mono">{Math.round(meta.time_taken_seconds / 60)} min</span></span>
                        )}
                        {result.created_at && (
                          <span>
                            Submitted:{' '}
                            <span className="text-white">
                              {new Date(result.created_at).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                              })}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Why it was flagged — a count alone doesn't explain much */}
                      {(flags > 0 || meta.unproctored) && (
                        <div className="border border-rose-500/20 bg-rose-500/[0.06] rounded-2xl p-4">
                          <p className="text-rose-400 text-xs font-semibold mb-2">Proctoring flags</p>
                          <div className="flex flex-col gap-1 text-xs text-gray-400">
                            {meta.violation_count > 0 && (
                              <span>{meta.violation_count} tab switch or paste attempt{meta.violation_count > 1 ? 's' : ''}</span>
                            )}
                            {meta.camera_violation_count > 0 && (
                              <span>{meta.camera_violation_count} camera violation{meta.camera_violation_count > 1 ? 's' : ''}</span>
                            )}
                            {meta.unproctored && (
                              <span className="text-amber-400">
                                Taken without a camera — {meta.unproctored_reason || 'no camera available on their device'}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default TestSubmissions