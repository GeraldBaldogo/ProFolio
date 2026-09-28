import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faDatabase, faShield, faTriangleExclamation,
  faCircleCheck, faSpinner, faPlay, faCode,
  faUserTie, faRotateRight, faDisplay, faPaperPlane, faCircleXmark,
  faTableList, faCircleInfo,
} from '@fortawesome/free-solid-svg-icons'
import { generateSQLChallenge, submitSQLResult } from '../../../services/assessment.service'
import { getTestById } from '../../../services/test.service'
import { useProctoring } from '../../../hooks/useProctoring'
import ProctoringCamera from '../../../components/ProctoringCamera'
import PracticeLevels from '../../../components/PracticeLevels'
import AttemptAward from '../../../components/AttemptAward'
import SchemaViewer from '../../../components/SchemaViewer'
import { runSqlInBrowser, warmUpSql, signatureOf, signatureHash } from '../../../utils/sqlBrowser'
import { useBackdropStill } from '../../../hooks/useBackdropStill'

const DIFFICULTIES = ['easy', 'medium', 'hard']
const TIME_LIMITS = { easy: 600, medium: 900, hard: 1200 }
const diffColor = {
  easy: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  medium: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  hard: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
}

// ─── What the student's query returned ───────────────────────────────────────
// The technical adviser's point: a SQL question means nothing unless you can
// see what your query does to the data. Every Run starts from the original
// rows, so an UPDATE or DELETE can be tried, looked at, and tried again.

const MAX_SHOWN = 100

const Cell = ({ v }) => (v === null || v === undefined
  ? <span className="text-gray-600 italic">NULL</span>
  : <>{String(v)}</>)

const RowsTable = ({ columns, rows, truncated }) => (
  <div className="overflow-auto max-h-64 rounded-lg border border-white/8">
    <table className="w-full text-[12px] font-mono">
      <thead className="sticky top-0 bg-[#0d1218]">
        <tr>
          {columns.map((c, i) => (
            <th key={i} className="text-left text-gray-400 font-semibold px-3 py-1.5 border-b border-white/8 whitespace-nowrap">{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, MAX_SHOWN).map((r, i) => (
          <tr key={i} className="border-b border-white/5 last:border-0">
            {r.map((v, j) => (
              <td key={j} className="px-3 py-1.5 text-gray-200 whitespace-nowrap"><Cell v={v} /></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    {(rows.length > MAX_SHOWN || truncated) && (
      <p className="text-gray-600 text-[11px] px-3 py-1.5 border-t border-white/5">
        Showing the first {Math.min(rows.length, MAX_SHOWN)} rows.
      </p>
    )}
  </div>
)

const ResultPanel = ({ runState, baseline, practiceCheck }) => {
  const { status, run, match } = runState

  let body
  if (status === 'idle') {
    body = (
      <p className="text-gray-500 text-xs leading-relaxed">
        Press <span className="text-gray-300 font-semibold">Run</span> or{' '}
        <kbd className="text-[10px] text-gray-300 border border-white/15 rounded px-1.5 py-0.5 font-mono">Ctrl</kbd>{' '}+{' '}
        <kbd className="text-[10px] text-gray-300 border border-white/15 rounded px-1.5 py-0.5 font-mono">Enter</kbd>{' '}
        to see what your query returns. Every run starts from the original data, so you can try
        an UPDATE or DELETE and run it again.
      </p>
    )
  } else if (status === 'running') {
    body = (
      <p className="text-gray-400 text-xs flex items-center gap-2">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-emerald-400" /> Running…
      </p>
    )
  } else if (!run.ok) {
    body = (
      <div className="border border-rose-500/20 bg-rose-500/5 rounded-lg px-3 py-2.5 flex items-start gap-2">
        <FontAwesomeIcon icon={faCircleXmark} className="text-rose-400 text-xs mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-rose-300 text-xs font-semibold mb-0.5">
            {run.stage === 'timeout' ? 'Stopped' : run.stage === 'schema' ? 'The tables could not be loaded' : 'Your query has an error'}
          </p>
          <p className="text-rose-400/90 text-xs font-mono break-words">{run.error}</p>
        </div>
      </div>
    )
  } else if (run.result) {
    body = run.result.rows.length === 0
      ? <p className="text-gray-400 text-xs">The query ran and returned <span className="text-white font-semibold">no rows</span>.</p>
      : <RowsTable {...run.result} />
  } else {
    // An INSERT, UPDATE or DELETE: show what it did to the data.
    const changed = Object.keys(run.tables || {}).filter(
      (name) => JSON.stringify(run.tables[name].rows) !== JSON.stringify(baseline?.tables?.[name]?.rows)
    )
    body = (
      <div className="flex flex-col gap-3">
        <p className="text-gray-300 text-xs">
          <span className="text-white font-semibold">{run.changes}</span> row{run.changes === 1 ? '' : 's'} changed.
          {changed.length > 0 && ' The table afterwards:'}
        </p>
        {changed.map((name) => (
          <div key={name}>
            <p className="text-emerald-300 text-xs font-bold font-mono mb-1.5">{name}</p>
            <RowsTable {...run.tables[name]} />
          </div>
        ))}
      </div>
    )
  }

  const rowCount = status === 'done' && run.ok && run.result ? run.result.rows.length : null

  return (
    <div className="border border-white/8 bg-[#0a0a18] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#060610] border-b border-white/5">
        <FontAwesomeIcon icon={faTableList} className="text-emerald-400 text-[11px]" />
        <span className="text-gray-400 text-xs font-semibold">Result</span>
        {rowCount !== null && (
          <span className="text-gray-600 text-[11px]">{rowCount} row{rowCount === 1 ? '' : 's'}{run.elapsedMs != null ? ` · ${run.elapsedMs} ms` : ''}</span>
        )}
        {/* Practice only. On an assigned test the student sees the output but
            is not told whether it's right — that's for the marker. */}
        {practiceCheck && status === 'done' && match !== null && (
          <span className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
            match ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-300 border-amber-500/30 bg-amber-500/10'
          }`}>
            {match ? '✓ Matches the expected result' : 'Not the expected result yet'}
          </span>
        )}
      </div>
      <div className="p-4">{body}</div>
    </div>
  )
}

const SQLAssessment = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // Set when the student arrives from Assigned Tests. Null means free practice.
  const testId = params.get('test_id')

  const { sessionId, resetSession, tabViolationCount, getViolationCounts } = useProctoring('sql')

  const [phase, setPhase] = useState('setup') // setup | challenge | result
  const [difficulty, setDifficulty] = useState('easy')
  const [generating, setGenerating] = useState(false)
  const [setupError, setSetupError] = useState('')

  // The professor's test, if there is one.
  const [test, setTest] = useState(null)
  const [loadingTest, setLoadingTest] = useState(!!testId)

  const [challenge, setChallenge] = useState(null)
  const [sqlCode, setSqlCode] = useState('')
  const [secsLeft, setSecsLeft] = useState(600)
  const [showWarning, setShowWarning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null)

  const [runState, setRunState] = useState({ status: 'idle', run: null, match: null })
  // The tables as loaded, before any query — to show which ones an UPDATE or
  // DELETE actually changed. Worked out once per schema.
  const baselineRef = useRef({ schema: null, run: null })

  // This page had no camera at all — tab and paste only — while typing, coding
  // and flowchart were fully proctored. On a graded assessment that difference
  // is impossible to defend.
  const [cameraReady, setCameraReady] = useState(false)
  const [unproctored, setUnproctored] = useState(null)
  const [cameraViolations, setCameraViolations] = useState(0)

  const [screenShare, setScreenShare] = useState(null)
  const [screenError, setScreenError] = useState('')

  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const prevTabRef = useRef(0)

  // Watch for new violations (from the hook's automatic tab/paste detection)
  // to trigger the warning overlay - the hook logs/counts automatically,
  // this effect only drives the UI popup.
  useEffect(() => {
    if (phase !== 'challenge') return
    if (tabViolationCount > prevTabRef.current) {
      setShowWarning(true)
    }
    prevTabRef.current = tabViolationCount
  }, [tabViolationCount, phase])

  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [])

  // Pull the professor's schema and question. Without this the student would
  // be answering an AI-generated question while the professor thinks they set
  // the work.
  useEffect(() => {
    if (!testId) return
    let cancelled = false

    getTestById(testId)
      .then((t) => {
        if (cancelled) return
        setTest(t)

        const cfg = t?.config || {}
        if (!cfg.question) {
          setSetupError('This test has no question set. Ask your professor to check it.')
          return
        }

        setChallenge({
          title: t.title,
          scenario: t.description || null,
          // The professor writes raw SQL rather than the structured `tables`
          // array the AI returns, so it renders as a code block instead.
          schema_sql: cfg.schema_sql || null,
          tables: null,
          question: cfg.question,
          expected_output: null,
        })
      })
      .catch((err) => {
        if (!cancelled) setSetupError(err.message || 'Couldn\u2019t load this test.')
      })
      .finally(() => {
        if (!cancelled) setLoadingTest(false)
      })

    return () => { cancelled = true }
  }, [testId])

  const beginTimer = (limitSeconds) => {
    setSecsLeft(limitSeconds)
    startTimeRef.current = Date.now()
    setPhase('challenge')

    timerRef.current = setInterval(() => {
      setSecsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Free practice: ask the AI for a challenge first.
  const startChallenge = async () => {
    resetSession() // fresh session_id + violation counts for this attempt
    prevTabRef.current = 0
    setGenerating(true)
    setSetupError('')
    try {
      const data = await generateSQLChallenge({ difficulty })
      setChallenge(data)
      beginTimer(TIME_LIMITS[difficulty])
    } catch (err) {
      // Previously an alert(), which can't be styled or retried.
      setSetupError(err.message || 'Couldn\u2019t generate a challenge. Check your connection.')
    } finally {
      setGenerating(false)
    }
  }

  // Graded test: the question already exists, so go straight in.
  const startAssignedTest = async () => {
    setScreenError('')

    // Screen sharing is required for graded work only. A practice attempt has
    // nothing at stake, and the prompt would only be in the way.
    if (!screenShare) {
      setScreenError('Proctoring is still starting up. Please wait a moment and try again.')
      return
    }
    if (screenShare.state === 'unsupported') {
      setScreenError('Screen sharing is not available on this device. Please take this assessment on a laptop or desktop computer.')
      return
    }
    if (screenShare.state !== 'sharing') {
      const granted = await screenShare.request()
      if (!granted) {
        setScreenError(screenShare.note || 'Screen sharing is required before this assessment can begin.')
        return
      }
    }

    resetSession()
    prevTabRef.current = 0
    beginTimer(test?.time_limit_minutes ? test.time_limit_minutes * 60 : TIME_LIMITS.medium)
  }

  const handleSubmit = async (timedOut = false) => {
    clearInterval(timerRef.current)
    if (submitting || result) return
    setSubmitting(true)
    setSubmitError('')

    const timeTaken = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : TIME_LIMITS[difficulty]

    try {
      const counts = getViolationCounts() // ref-backed, always current
      const data = await submitSQLResult({
        difficulty,
        challenge_title: challenge?.title || '',
        scenario: challenge?.scenario || '',
        question: challenge?.question || '',
        sql_code: timedOut && !sqlCode ? '-- (no submission — time ran out)' : sqlCode,
        // Practice only: the sealed reference answer the server marks against.
        challenge_token: challenge?.challenge_token || null,
        violation_count: counts.violation_count + cameraViolations,
        camera_violation_count: cameraViolations,
        unproctored: !!unproctored,
        time_taken_seconds: timeTaken,
        session_id: sessionId,
        // Ties the result to the professor's test and closes the assignment.
        ...(testId ? { test_id: testId } : {}),
      })
      setResult(data)
      screenShare?.stop()
      setPhase('result')
    } catch (err) {
      // On a graded test this is the only attempt — losing the query to a
      // dismissed alert box would be unrecoverable.
      setSubmitError(err.message || 'Couldn\u2019t submit. Your query is still here — try again.')
      setPhase('challenge')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const canRun = !!challenge?.schema_sql

  useEffect(() => {
    setRunState({ status: 'idle', run: null, match: null })
    baselineRef.current = { schema: null, run: null }
  }, [challenge])

  // Load the engine while the student reads the question, so the first Run
  // doesn't stall.
  useEffect(() => {
    if (phase === 'challenge' && canRun) warmUpSql()
  }, [phase, canRun])

  const handleRun = async () => {
    if (!canRun || !sqlCode.trim() || runState.status === 'running') return
    setRunState({ status: 'running', run: null, match: null })

    const schema = challenge.schema_sql
    if (baselineRef.current.schema !== schema) {
      baselineRef.current = { schema, run: await runSqlInBrowser(schema, '') }
    }

    const run = await runSqlInBrowser(schema, sqlCode)

    let match = null
    if (!testId && run.ok && challenge?.expected_signature) {
      const hash = await signatureHash(signatureOf(run, !!challenge.ordered))
      match = hash === challenge.expected_signature
    }
    setRunState({ status: 'done', run, match })
  }

  const goBack = () => navigate(testId ? '/student/assigned-tests' : '/student/assessment')

  // Don't let them start before the professor's question has arrived.
  // The background stops moving while the timed part is running
  useBackdropStill(phase === 'challenge')

  if (loadingTest) {
    return (
      <div className="min-h-screen bg-[#060612] font-sans flex flex-col items-center justify-center gap-3">
        <FontAwesomeIcon icon={faSpinner} className="text-emerald-400 text-2xl animate-spin" />
        <p className="text-gray-500 text-sm">Loading your test...</p>
      </div>
    )
  }

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (phase === 'setup') return (
    <div className="min-h-screen bg-[#060612] font-sans px-6 py-8 max-w-2xl mx-auto">

      <ProctoringCamera
        active={phase === 'challenge'}
        onViolation={() => setCameraViolations(v => v + 1)}
        onReady={() => setCameraReady(true)}
        onCameraUnavailable={(reason) => { setCameraReady(true); setUnproctored(reason) }}
        onScreenShareReady={setScreenShare}
      />

      <div className="flex items-center gap-4 mb-8">
        <button onClick={goBack} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <div>
          <h1 className="text-white font-bold text-lg flex items-center gap-2">
            <FontAwesomeIcon icon={faDatabase} className="text-emerald-400" />
            {test?.title || 'SQL Query Challenge'}
          </h1>
          <p className="text-gray-500 text-xs">Write SQL queries against a defined schema under time pressure.</p>
        </div>
      </div>

      {setupError && (
        <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-4 mb-4 flex items-start gap-3">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 mt-0.5 flex-shrink-0" />
          <p className="text-rose-400 text-sm">{setupError}</p>
        </div>
      )}

      {testId ? (
        // ── Graded test: nothing to choose ──
        <>
          <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-4 mb-4 flex items-start gap-3">
            <FontAwesomeIcon icon={faUserTie} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-amber-300 text-sm font-semibold">Assigned test — this one counts</p>
              {test?.description && <p className="text-gray-400 text-xs mt-1">{test.description}</p>}
            </div>
          </div>

          <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-4">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Your task</p>
            <p className="text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{challenge?.question}</p>
            <p className="text-gray-500 text-xs">
              Time limit:{' '}
              <span className="text-white">
                {test?.time_limit_minutes ? `${test.time_limit_minutes} min` : '15 min'}
              </span>
            </p>
          </div>
        </>
      ) : (
        // ── Free practice: difficulty ──
        <>
          <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-4">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Difficulty</p>
            {/* Levels unlock in order; see PracticeLevels. */}
            <div>
              <PracticeLevels type="sql" value={difficulty} onChange={setDifficulty} />
            </div>
            <p className="text-gray-600 text-xs mt-3">Time limit: {TIME_LIMITS[difficulty] / 60} minutes</p>
          </div>

          <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-4">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">What to Expect</p>
            {[
              { label: 'Easy', desc: 'Basic SELECT, WHERE, ORDER BY — single table queries' },
              { label: 'Medium', desc: 'JOINs, GROUP BY, HAVING, aggregate functions' },
              { label: 'Hard', desc: 'Subqueries, multiple JOINs, UNION, window functions' },
            ].map((item, i) => (
              <div key={i} className={`flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0 ${difficulty === item.label.toLowerCase() ? 'opacity-100' : 'opacity-40'}`}>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border capitalize ${diffColor[item.label.toLowerCase()]}`}>{item.label}</span>
                <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Anti-cheat notice */}
      <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <FontAwesomeIcon icon={faShield} className="text-amber-400 mt-0.5" />
        <div>
          <p className="text-amber-400 text-sm font-semibold mb-1">Anti-cheat is active</p>
          <p className="text-gray-500 text-xs leading-relaxed">
            Copy-paste is disabled. Switching tabs is recorded as a violation and deducts 5 points per flag (max 25 pts).
          </p>
        </div>
      </div>

      {testId && (
        <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-4 mb-4 flex items-start gap-3">
          <FontAwesomeIcon icon={faDisplay} className="text-amber-400 mt-0.5" />
          <div>
            <p className="text-amber-400 text-sm font-semibold mb-1">Screen sharing is required</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              When you press Start, your browser will ask you to share your screen. Choose{' '}
              <span className="text-gray-400 font-semibold">Entire Screen</span> — a single
              window or tab will not be accepted. Nothing is recorded; only whether sharing
              stays active is monitored.
            </p>
          </div>
        </div>
      )}

      {screenError && (
        <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-4 mb-4 flex items-start gap-3">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 mt-0.5 flex-shrink-0" />
          <p className="text-rose-400 text-xs leading-relaxed">{screenError}</p>
        </div>
      )}

      <button
        onClick={testId ? startAssignedTest : startChallenge}
        disabled={generating || (testId && !challenge)}
        className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-all"
      >
        {generating ? (
          <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Generating challenge...</>
        ) : (
          <><FontAwesomeIcon icon={faPlay} /> {testId ? 'Start test' : 'Start Challenge'}</>
        )}
      </button>
    </div>
  )

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (phase === 'result') return (
    <div className="min-h-screen bg-[#060612] font-sans px-6 py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={goBack} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} /> {testId ? 'Back to assigned tests' : 'Back to Assessments'}
        </button>
      </div>

      <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-6 text-center mb-5">
        <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 text-2xl" />
        </div>
        <p className="text-white font-bold text-xl mb-1">
          {testId ? 'Test submitted!' : 'Challenge Submitted!'}
        </p>
        <p className="text-gray-500 text-sm">Final Score: <span className="text-white font-black text-2xl">{result?.score}</span>/100</p>
        {tabViolationCount > 0 && (
          <p className="text-rose-400 text-xs mt-2">{tabViolationCount} violation{tabViolationCount > 1 ? 's' : ''} recorded — {Math.min(tabViolationCount * 5, 25)} pts deducted</p>
        )}
      </div>

      {/* Correctness badge */}
      {result?.correctness && (
        <div className={`border rounded-2xl p-4 mb-4 text-center ${
          result.correctness === 'correct' ? 'border-emerald-500/20 bg-emerald-500/5'
          : result.correctness === 'partial' ? 'border-amber-500/20 bg-amber-500/5'
          : 'border-rose-500/20 bg-rose-500/5'
        }`}>
          <p className={`text-sm font-bold capitalize ${
            result.correctness === 'correct' ? 'text-emerald-400'
            : result.correctness === 'partial' ? 'text-amber-400'
            : 'text-rose-400'
          }`}>
            {result.correctness === 'correct' ? '✓ Correct Query'
            : result.correctness === 'partial' ? '~ Partially Correct'
            : '✗ Incorrect Query'}
          </p>
        </div>
      )}

      {/* Evidence, not opinion: whether the query actually ran and what it
          returned compared with the correct answer. */}
      {result?.execution && (
        <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-4 mb-4 flex items-start gap-3">
          <FontAwesomeIcon
            icon={!result.execution.ran ? faCircleXmark : result.execution.matches ? faCircleCheck : result.execution.matches === false ? faCircleXmark : faCircleInfo}
            className={`mt-0.5 ${!result.execution.ran ? 'text-rose-400' : result.execution.matches ? 'text-emerald-400' : result.execution.matches === false ? 'text-amber-400' : 'text-gray-400'}`}
          />
          <div>
            <p className="text-white text-sm font-semibold mb-0.5">Checked by running your query</p>
            <p className="text-gray-400 text-xs leading-relaxed">
              {!result.execution.ran
                ? <>Your query did not run: <span className="font-mono text-rose-300">{result.execution.error}</span></>
                : result.execution.matches
                  ? 'It ran against the data and returned exactly the correct result.'
                  : result.execution.matches === false
                    ? 'It ran, but what it returned is different from the correct result.'
                    : 'It ran without errors. This question has no reference answer, so correctness was judged by reading the query.'}
            </p>
          </div>
        </div>
      )}

      {/* What this attempt earned — a verified title, or the practice rank. */}
      <AttemptAward testId={testId} result={result} />

      {/* AI Feedback */}
      {result?.feedback && (
        <div className="border border-violet-500/20 bg-violet-500/5 rounded-2xl p-5 mb-5">
          <p className="text-violet-400 text-xs font-semibold mb-2">AI Feedback</p>
          <p className="text-gray-300 text-sm leading-relaxed">{result.feedback}</p>
        </div>
      )}

      <div className="flex gap-3">
        {/* A graded test is one attempt — the server rejects a second submit */}
        {!testId && (
          <button onClick={() => { setResult(null); setSqlCode(''); setPhase('setup') }} className="flex-1 border border-white/8 text-gray-400 hover:text-white text-sm py-3 rounded-2xl transition-all">
            Try again
          </button>
        )}
        <button
          onClick={() => navigate(testId ? '/student/assigned-tests' : '/student/assessment/bugfix')}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm py-3 rounded-2xl transition-all"
        >
          {testId ? 'Back to assigned tests →' : 'Next: Bug Fix →'}
        </button>
      </div>
    </div>
  )

  // ── CHALLENGE ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060612] font-sans flex flex-col">

      <ProctoringCamera
        active={true}
        onViolation={() => setCameraViolations(v => v + 1)}
        onReady={() => setCameraReady(true)}
        onCameraUnavailable={(reason) => { setCameraReady(true); setUnproctored(reason) }}
        onScreenShareReady={setScreenShare}
      />

      {/* Tab switch warning */}
      {showWarning && (
        <div className="fixed inset-0 z-50 bg-rose-950/95 flex items-center justify-center flex-col gap-4 text-center px-6">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 text-5xl" />
          <h2 className="text-white font-black text-2xl">Tab Switch Detected!</h2>
          <p className="text-rose-300 text-sm max-w-sm">Leaving the page is a violation. {tabViolationCount} flag{tabViolationCount > 1 ? 's' : ''} recorded so far.</p>
          <button onClick={() => setShowWarning(false)} className="bg-white text-rose-800 font-bold px-6 py-2.5 rounded-xl mt-2">
            Return to Assessment
          </button>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#060612]/95 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{challenge?.title}</p>
          <p className="text-gray-500 text-xs capitalize">
            {testId ? 'assigned test' : `${difficulty} difficulty`}
          </p>
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold flex-shrink-0 ${
          tabViolationCount === 0 ? 'border-green-500/20 bg-green-500/10 text-green-400'
          : tabViolationCount < 3 ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
          : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
        }`}>
          <FontAwesomeIcon icon={faShield} />
          {tabViolationCount} flag{tabViolationCount !== 1 ? 's' : ''}
        </div>

        <div className={`font-mono font-black text-lg flex-shrink-0 ${secsLeft < 120 ? 'text-rose-400' : 'text-white'}`}>
          {formatTime(secsLeft)}
        </div>
      </header>

      {submitError && (
        <div className="max-w-6xl mx-auto w-full px-4 pt-4">
          <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-4 flex items-center gap-3">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 flex-shrink-0" />
            <p className="text-rose-400 text-sm flex-1">{submitError}</p>
            <button
              onClick={() => handleSubmit(false)}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all flex-shrink-0"
            >
              <FontAwesomeIcon icon={faRotateRight} /> Retry
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full px-4 py-4 gap-4">

        {/* Problem panel */}
        <div className="lg:w-96 flex-shrink-0 flex flex-col gap-3 lg:pb-56">

          {/* Scenario */}
          {challenge?.scenario && (
            <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Scenario</p>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{challenge.scenario}</p>
            </div>
          )}

          {/* Diagram, sample rows and raw SQL. Reads both the AI's structured
              tables and a professor's CREATE TABLE statements. */}
          <SchemaViewer tables={challenge?.tables} schemaSql={challenge?.schema_sql} />

          {/* Question */}
          <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-5">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Your Task</p>
            <p className="text-white text-sm font-semibold leading-relaxed whitespace-pre-wrap">{challenge?.question}</p>
            {challenge?.expected_output && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-gray-500 text-xs mb-1">Expected Output</p>
                <p className="text-gray-400 text-xs">{challenge.expected_output}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* SQL Editor */}
        <div className="flex flex-col border border-white/8 bg-[#0a0a18] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#060610] border-b border-white/5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <span className="text-gray-600 text-xs font-mono ml-2 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCode} className="text-emerald-400 text-[10px]" /> query.sql
            </span>
            <span className="ml-auto text-xs text-rose-400/70 border border-rose-500/20 px-2 py-0.5 rounded-full">paste disabled</span>
          </div>

          <textarea
            value={sqlCode}
            onChange={(e) => setSqlCode(e.target.value)}
            onPaste={(e) => {
              e.preventDefault()
              // Don't manually count here — useProctoring's document-level
              // paste listener already catches and logs this automatically.
            }}
            onCopy={(e) => {
              e.preventDefault()
              // Same as above - blocking only, hook logs the copy event itself.
            }}
            // Dragging text in from another window bypasses paste entirely.
            onDrop={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault()
                handleRun()
              }
            }}
            placeholder={`-- Write your SQL query here...\nSELECT ...`}
            className="bg-transparent text-gray-200 font-mono text-sm p-4 resize-none outline-none leading-7 min-h-[220px]"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            data-gramm="false"
            data-gramm_editor="false"
            data-enable-grammarly="false"
          />

          <div className="flex items-center gap-2 px-4 py-3 bg-[#060610] border-t border-white/5">
            <p className="text-gray-600 text-xs mr-auto hidden sm:block">Write your own SQL — no AI tools allowed</p>
            {canRun && (
              <button
                type="button"
                onClick={handleRun}
                disabled={runState.status === 'running' || !sqlCode.trim()}
                title="Ctrl + Enter"
                className="flex items-center gap-2 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
              >
                <FontAwesomeIcon icon={runState.status === 'running' ? faSpinner : faPlay} className={runState.status === 'running' ? 'animate-spin' : ''} /> Run
              </button>
            )}
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting || !sqlCode.trim()}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all"
            >
              {submitting ? (
                <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Submitting...</>
              ) : (
                <><FontAwesomeIcon icon={faPaperPlane} /> Submit</>
              )}
            </button>
          </div>
        </div>

        {canRun ? (
          <ResultPanel
            runState={runState}
            baseline={baselineRef.current.run}
            practiceCheck={!testId && !!challenge?.expected_signature}
          />
        ) : (
          <div className="border border-white/8 bg-white/[0.02] rounded-2xl px-4 py-3 flex items-start gap-2">
            <FontAwesomeIcon icon={faCircleInfo} className="text-gray-500 text-xs mt-0.5" />
            <p className="text-gray-500 text-xs leading-relaxed">
              This question has no sample data to run against, so your query will be read rather than executed.
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default SQLAssessment