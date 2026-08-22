import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faComments, faCircleCheck, faSpinner, faPlay,
  faTriangleExclamation, faPen, faChartBar, faUserTie, faRotateRight,
} from '@fortawesome/free-solid-svg-icons'
import api from '../../../services/api'
import { getTestById } from '../../../services/test.service'
import { useProctoring } from '../../../hooks/useProctoring'

const DIFFICULTIES = ['easy', 'medium', 'hard']
const TIME_LIMITS = { easy: 5 * 60, medium: 8 * 60, hard: 12 * 60 }
const diffColor = {
  easy: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  medium: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  hard: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
}

const ScoreBar = ({ label, score, max = 10 }) => {
  const pct = (score / max) * 100
  const color = pct >= 80 ? 'from-emerald-500 to-teal-500'
    : pct >= 60 ? 'from-blue-500 to-cyan-500'
      : pct >= 40 ? 'from-amber-500 to-orange-500'
        : 'from-rose-500 to-pink-500'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-300 font-medium capitalize">{label}</span>
        <span className="text-gray-500">{score}/{max}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const CommunicationAssessment = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // Set when the student arrives from Assigned Tests. Null means free practice.
  const testId = params.get('test_id')

  const { sessionId, violationCount, resetSession } = useProctoring('communication')

  const [phase, setPhase] = useState('setup') // setup | challenge | result
  const [difficulty, setDifficulty] = useState('easy')
  const [loading, setLoading] = useState(false)
  const [setupError, setSetupError] = useState('')

  // The professor's test, if there is one.
  const [test, setTest] = useState(null)
  const [loadingTest, setLoadingTest] = useState(!!testId)

  const [prompt, setPrompt] = useState(null)
  const [response, setResponse] = useState('')
  const [secsLeft, setSecsLeft] = useState(TIME_LIMITS.easy)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null)
  const [wordCount, setWordCount] = useState(0)

  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => () => clearInterval(timerRef.current), [])

  // Pull the professor's prompt. Without this the student would be answering
  // one of the built-in prompts while the professor thinks they set the work.
  useEffect(() => {
    if (!testId) return
    let cancelled = false

    getTestById(testId)
      .then((t) => {
        if (cancelled) return
        setTest(t)

        const cfg = t?.config || {}
        if (!cfg.prompt) {
          setSetupError('This test has no prompt set. Ask your professor to check it.')
          return
        }

        setPrompt({
          // The built-in prompts have ids used to look up their criteria
          // server-side. A professor's prompt has none, so the rubric travels
          // with the submission instead.
          id: null,
          title: t.title,
          prompt: cfg.prompt,
          criteria: Array.isArray(cfg.rubric) ? cfg.rubric.join(', ') : '',
          rubric: Array.isArray(cfg.rubric) ? cfg.rubric : [],
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

  const handleResponseChange = (e) => {
    const val = e.target.value
    setResponse(val)
    setWordCount(val.trim() ? val.trim().split(/\s+/).length : 0)
  }

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

  // Free practice: pull one of the built-in prompts.
  const startChallenge = async () => {
    resetSession() // fresh session_id + violationCount for every new attempt
    setLoading(true)
    setSetupError('')
    try {
      const res = await api.get(`/communication/prompt?difficulty=${difficulty}`)
      setPrompt(res.data.data)
      beginTimer(TIME_LIMITS[difficulty])
    } catch (err) {
      // Previously an alert(), which can't be styled or retried.
      setSetupError(err.response?.data?.message || 'Couldn\u2019t load a prompt. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  // Graded test: the prompt already exists, so go straight in.
  const startAssignedTest = () => {
    resetSession()
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
      const res = await api.post('/communication/submit', {
        difficulty,
        prompt_id: prompt?.id || null,
        prompt_title: prompt?.title,
        prompt_text: prompt?.prompt,
        response_text: timedOut && !response ? '(no submission — time ran out)' : response,
        time_taken_seconds: timeTaken,
        violation_count: violationCount,
        session_id: sessionId,
        // Ties the result to the professor's test and closes the assignment.
        ...(testId ? { test_id: testId, rubric: prompt?.rubric || [] } : {}),
      })
      setResult(res.data.data)
      setPhase('result')
    } catch (err) {
      // On a graded test this is the only attempt — losing the writing to a
      // dismissed alert box would be unrecoverable.
      setSubmitError(err.response?.data?.message || 'Couldn\u2019t submit. Your response is still here — try again.')
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

  const resetAll = () => {
    setPhase('setup')
    setPrompt(null)
    setResponse('')
    setResult(null)
    setWordCount(0)
    setSubmitError('')
    clearInterval(timerRef.current)
  }

  const goBack = () => navigate(testId ? '/student/assigned-tests' : '/student/assessment')

  // Don't let them start before the professor's prompt has arrived.
  if (loadingTest) {
    return (
      <div className="min-h-screen bg-[#060612] font-sans flex flex-col items-center justify-center gap-3">
        <FontAwesomeIcon icon={faSpinner} className="text-cyan-400 text-2xl animate-spin" />
        <p className="text-gray-500 text-sm">Loading your test...</p>
      </div>
    )
  }

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (phase === 'setup') return (
    <div className="min-h-screen bg-[#060612] font-sans px-6 py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={goBack} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <div>
          <h1 className="text-white font-bold text-lg flex items-center gap-2">
            <FontAwesomeIcon icon={faComments} className="text-cyan-400" />
            {test?.title || 'Communication Skills'}
          </h1>
          <p className="text-gray-500 text-xs">Write professional responses to real-world workplace prompts.</p>
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
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Your prompt</p>
            <p className="text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{prompt?.prompt}</p>
            <p className="text-gray-500 text-xs">
              Time limit:{' '}
              <span className="text-white">
                {test?.time_limit_minutes ? `${test.time_limit_minutes} min` : '8 min'}
              </span>
            </p>
          </div>

          {prompt?.rubric?.length > 0 && (
            <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-6">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">You&apos;ll be marked on</p>
              <div className="grid grid-cols-2 gap-2">
                {prompt.rubric.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-400 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                    <span className="capitalize">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        // ── Free practice: difficulty ──
        <>
          <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-4">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Difficulty</p>
            <div className="flex gap-3 mb-4">
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all capitalize ${difficulty === d ? diffColor[d] : 'border-white/8 text-gray-500 hover:text-white hover:border-white/20'
                    }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {[
                { d: 'easy', time: '5 min', desc: 'Self-intro or project explanation — short and direct' },
                { d: 'medium', time: '8 min', desc: 'Technical concepts or team communication scenarios' },
                { d: 'hard', time: '12 min', desc: 'Professional emails or feature documentation' },
              ].map(({ d, time, desc }) => (
                <div key={d} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${difficulty === d ? 'border-white/10 bg-white/5' : 'border-transparent opacity-40'}`}>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border capitalize flex-shrink-0 mt-0.5 ${diffColor[d]}`}>{d}</span>
                  <div className="flex-1">
                    <p className="text-gray-300 text-xs">{desc}</p>
                  </div>
                  <span className="text-gray-500 text-xs flex-shrink-0">{time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-6">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Evaluated On</p>
            <div className="grid grid-cols-2 gap-2">
              {['Clarity', 'Professionalism', 'Structure', 'Grammar'].map((c) => (
                <div key={c} className="flex items-center gap-2 text-gray-400 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  {c}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <button
        onClick={testId ? startAssignedTest : startChallenge}
        disabled={loading || (testId && !prompt)}
        className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-all"
      >
        {loading
          ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Loading prompt...</>
          : <><FontAwesomeIcon icon={faPlay} /> {testId ? 'Start test' : 'Start Challenge'}</>}
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

      {/* Score */}
      <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-6 text-center mb-5">
        <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 text-2xl" />
        </div>
        <p className="text-white font-bold text-xl mb-1">
          {testId ? 'Test submitted!' : 'Response Submitted!'}
        </p>
        <p className="text-gray-500 text-sm">Communication Score: <span className="text-white font-black text-2xl">{result?.score}</span>/100</p>
      </div>

      {/* Sub scores */}
      {result?.sub_scores && (
        <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <FontAwesomeIcon icon={faChartBar} className="text-cyan-400 text-sm" />
            <p className="text-white font-bold text-sm">Detailed Scores</p>
          </div>
          <div className="flex flex-col gap-3">
            {Object.entries(result.sub_scores).map(([key, val]) => (
              <ScoreBar key={key} label={key} score={val} max={10} />
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {result?.strengths && (
        <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-5 mb-4">
          <p className="text-emerald-400 text-xs font-semibold mb-2">✓ Strengths</p>
          <p className="text-gray-300 text-sm leading-relaxed">{result.strengths}</p>
        </div>
      )}

      {/* Improvements */}
      {result?.improvements && (
        <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-5 mb-4">
          <p className="text-amber-400 text-xs font-semibold mb-2">↑ Areas to Improve</p>
          <p className="text-gray-300 text-sm leading-relaxed">{result.improvements}</p>
        </div>
      )}

      {/* Overall feedback */}
      {result?.feedback && (
        <div className="border border-violet-500/20 bg-violet-500/5 rounded-2xl p-5 mb-5">
          <p className="text-violet-400 text-xs font-semibold mb-2">AI Overall Feedback</p>
          <p className="text-gray-300 text-sm leading-relaxed">{result.feedback}</p>
        </div>
      )}

      {/* Your response */}
      <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-5">
        <p className="text-gray-500 text-xs font-semibold mb-2">Your Response</p>
        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{response}</p>
      </div>

      <div className="flex gap-3">
        {/* A graded test is one attempt — the server rejects a second submit */}
        {!testId && (
          <button onClick={resetAll} className="flex-1 border border-white/8 text-gray-400 hover:text-white text-sm py-3 rounded-2xl transition-all">
            Try again
          </button>
        )}
        <button onClick={goBack} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm py-3 rounded-2xl transition-all">
          {testId ? 'Back to assigned tests →' : 'View all results →'}
        </button>
      </div>
    </div>
  )

  // ── CHALLENGE ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060612] font-sans flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#060612]/95 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{prompt?.title}</p>
          <p className="text-gray-500 text-xs capitalize">
            {testId ? 'assigned test' : difficulty} · {wordCount} word{wordCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className={`font-mono font-black text-lg flex-shrink-0 ${secsLeft < 60 ? 'text-rose-400' : secsLeft < 120 ? 'text-amber-400' : 'text-white'}`}>
          {formatTime(secsLeft)}
        </div>
      </header>

      {submitError && (
        <div className="max-w-5xl mx-auto w-full px-4 pt-4">
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

      <div className="flex-1 flex flex-col lg:flex-row max-w-5xl mx-auto w-full px-4 py-4 gap-4">

        {/* Prompt panel */}
        <div className="lg:w-80 flex-shrink-0 flex flex-col gap-3">
          <div className="border border-cyan-500/20 bg-cyan-500/5 rounded-2xl p-5">
            <p className="text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">Your Prompt</p>
            <p className="text-white font-bold text-sm mb-3">{prompt?.title}</p>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{prompt?.prompt}</p>
          </div>

          {prompt?.criteria && (
            <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-4">
              <p className="text-gray-500 text-xs font-semibold mb-2">Evaluated On</p>
              {prompt.criteria.split(', ').map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-400 text-xs py-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                  <span className="capitalize">{c}</span>
                </div>
              ))}
            </div>
          )}

          {/* Time warning */}
          {secsLeft < 60 && (
            <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 text-sm" />
              <p className="text-rose-400 text-xs font-semibold">Less than a minute left!</p>
            </div>
          )}
        </div>

        {/* Writing panel */}
        <div className="flex-1 flex flex-col border border-white/8 bg-[#0a0a18] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#060610] border-b border-white/5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <span className="text-gray-600 text-xs font-mono ml-2 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faPen} className="text-cyan-400 text-[10px]" /> response.txt
            </span>
            <span className="ml-auto text-gray-600 text-xs">{wordCount} words</span>
          </div>

          <textarea
            value={response}
            onChange={handleResponseChange}
            placeholder="Write your response here..."
            className="flex-1 bg-transparent text-gray-200 text-sm p-5 resize-none outline-none leading-7 min-h-[320px]"
            autoComplete="off"
            autoCorrect="off"
          />

          <div className="flex items-center justify-between px-4 py-3 bg-[#060610] border-t border-white/5">
            <p className="text-gray-600 text-xs">Write clearly and professionally</p>
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting || !response.trim() || wordCount < 5}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all"
            >
              {submitting
                ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Evaluating...</>
                : <><FontAwesomeIcon icon={faCircleCheck} /> Submit Response</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommunicationAssessment