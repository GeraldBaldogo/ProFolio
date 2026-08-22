import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faClipboardList, faSpinner, faPlay, faCircleCheck,
  faClock, faTriangleExclamation, faLock, faRotateRight,
} from '@fortawesome/free-solid-svg-icons'
import { getMyAssignedTests, startAssignment } from '../../services/test.service'

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

  return (
    <div className="min-h-screen bg-[#060612] font-sans px-6 py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/student/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <div>
          <h1 className="text-white font-bold text-lg flex items-center gap-2">
            <FontAwesomeIcon icon={faClipboardList} className="text-blue-400" /> Assigned Tests
          </h1>
          <p className="text-gray-500 text-xs">Tests your professor has assigned to you</p>
        </div>
        {!loading && (
          <button onClick={fetchAssignments} aria-label="Refresh"
            className="ml-auto w-9 h-9 rounded-xl border border-white/8 text-gray-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faRotateRight} className="text-sm" />
          </button>
        )}
      </div>

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
  )
}

export default StudentAssignedTests