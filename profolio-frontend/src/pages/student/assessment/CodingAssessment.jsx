import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faCode, faShield, faTriangleExclamation,
  faCircleCheck, faSpinner, faPlay, faUserTie, faRotateRight,
} from '@fortawesome/free-solid-svg-icons'
import { generateChallenge, submitCodingResult } from '../../../services/assessment.service'
import { getTestById } from '../../../services/test.service'
import ProctoringCamera from '../../../components/ProctoringCamera'

const LANGUAGES = [
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C', 'C#',
  'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart',
  'R', 'Scala', 'Perl', 'Haskell', 'Lua', 'MATLAB',
  'Bash', 'PowerShell', 'SQL', 'HTML/CSS',
  'Assembly', 'COBOL', 'Fortran', 'Elixir', 'Clojure', 'F#',
]
const DIFFICULTIES = ['easy', 'medium', 'hard']
const TIME_LIMITS = { easy: 600, medium: 900, hard: 1200 }
const EXTENSIONS = {
  Python: 'py', JavaScript: 'js', TypeScript: 'ts', Java: 'java',
  'C++': 'cpp', C: 'c', 'C#': 'cs', Go: 'go', Rust: 'rs',
  PHP: 'php', Ruby: 'rb', Swift: 'swift', Kotlin: 'kt', Dart: 'dart',
  R: 'r', Scala: 'scala', Perl: 'pl', Haskell: 'hs', Lua: 'lua',
  MATLAB: 'm', Bash: 'sh', PowerShell: 'ps1', SQL: 'sql',
  'HTML/CSS': 'html', Assembly: 'asm', COBOL: 'cob', Fortran: 'f90',
  Elixir: 'ex', Clojure: 'clj', 'F#': 'fs',
}

// The professor writes a language as free text, so 'python' has to match the
// 'Python' in EXTENSIONS or the filename tab shows .txt.
const normaliseLanguage = (raw) => {
  if (!raw) return 'Python'
  const found = LANGUAGES.find(l => l.toLowerCase() === String(raw).trim().toLowerCase())
  return found || raw
}

const CodingAssessment = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // Set when the student arrives from Assigned Tests. Null means free practice.
  const testId = params.get('test_id')

  // setup | challenge | result. A graded test has nothing to set up — the
  // professor already chose the language, the problem and the time limit.
  const [phase, setPhase] = useState('setup')
  const [language, setLanguage] = useState('Python')
  const [difficulty, setDifficulty] = useState('easy')
  const [generating, setGenerating] = useState(false)
  const [setupError, setSetupError] = useState('')

  // The professor's test, if there is one.
  const [test, setTest] = useState(null)
  const [loadingTest, setLoadingTest] = useState(!!testId)

  const [challenge, setChallenge] = useState(null)
  const [code, setCode] = useState('')
  const [secsLeft, setSecsLeft] = useState(600)
  const [violations, setViolations] = useState(0)
  const [showWarning, setShowWarning] = useState(false)
  const [warningType, setWarningType] = useState('tab') // 'tab' | 'camera'
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null)

  const [cameraReady, setCameraReady] = useState(false)
  const [cameraViolations, setCameraViolations] = useState(0)
  const cameraViolationsRef = useRef(0)
  // Set when the attempt goes ahead without a camera.
  const [unproctored, setUnproctored] = useState('')

  const timerRef = useRef(null)
  const violationsRef = useRef(0)
  const startTimeRef = useRef(null)

  // Anti-cheat: tab visibility
  useEffect(() => {
    const onHidden = () => {
      if (phase !== 'challenge') return
      if (document.hidden) {
        violationsRef.current += 1
        setViolations(violationsRef.current)
        setWarningType('tab')
        setShowWarning(true)
      }
    }
    document.addEventListener('visibilitychange', onHidden)
    return () => document.removeEventListener('visibilitychange', onHidden)
  }, [phase])

  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [])

  // Pull the professor's problem. Without this the student would be answering
  // an AI-generated question while the professor thinks they set the work.
  useEffect(() => {
    if (!testId) return
    let cancelled = false

    getTestById(testId)
      .then((t) => {
        if (cancelled) return
        setTest(t)

        const cfg = t?.config || {}
        if (!cfg.problem_statement) {
          setSetupError('This test has no problem set. Ask your professor to check it.')
          return
        }

        setLanguage(normaliseLanguage(cfg.language))
        setCode(cfg.starter_code || '')
        setChallenge({
          title: t.title,
          description: cfg.problem_statement,
          example_input: cfg.test_cases?.[0]?.input || null,
          example_output: cfg.test_cases?.[0]?.expected_output || null,
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

  const handleCameraViolation = () => {
    cameraViolationsRef.current += 1
    setCameraViolations(cameraViolationsRef.current)
    setWarningType('camera')
    setShowWarning(true)
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

  // Free practice: ask the AI for a problem first.
  const startChallenge = async () => {
    setGenerating(true)
    setSetupError('')
    try {
      const data = await generateChallenge({ language, difficulty })
      setChallenge(data)
      beginTimer(TIME_LIMITS[difficulty])
    } catch (err) {
      // Previously an alert(), which can't be styled, can't be retried, and
      // vanishes the moment it's dismissed.
      setSetupError(err.message || 'Couldn\u2019t generate a challenge. Check your connection.')
    } finally {
      setGenerating(false)
    }
  }

  // Graded test: the problem already exists, so go straight in.
  const startAssignedTest = () => {
    const limit = test?.time_limit_minutes
      ? test.time_limit_minutes * 60
      : TIME_LIMITS.medium
    beginTimer(limit)
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
      const data = await submitCodingResult({
        language,
        difficulty,
        challenge_title: challenge?.title || '',
        code: timedOut && !code ? '(no submission — time ran out)' : code,
        violation_count: violationsRef.current,
        camera_violation_count: cameraViolationsRef.current,
        time_taken_seconds: timeTaken,
        // Ties the result to the professor's test and closes the assignment.
        ...(testId ? { test_id: testId } : {}),
        ...(unproctored ? { unproctored: true, unproctored_reason: unproctored } : {}),
      })
      setResult(data)
      setPhase('result')
    } catch (err) {
      // On a graded test this is the student's only attempt — losing the work
      // to a dismissed alert box would be unrecoverable.
      setSubmitError(err.message || 'Couldn\u2019t submit. Your code is still here — try again.')
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

  const diffColor = {
    easy: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    medium: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    hard: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  }

  const totalViolations = violations + cameraViolations
  const goBack = () => navigate(testId ? '/student/assigned-tests' : '/student/assessment')

  // Don't let them start before the professor's problem has arrived.
  if (loadingTest) {
    return (
      <div className="min-h-screen bg-[#060612] font-sans flex flex-col items-center justify-center gap-3">
        <FontAwesomeIcon icon={faSpinner} className="text-violet-400 text-2xl animate-spin" />
        <p className="text-gray-500 text-sm">Loading your test...</p>
      </div>
    )
  }

  // ── SETUP ─────────────────────────────────────────────────────────────────
  if (phase === 'setup') return (
    <div className="min-h-screen bg-[#060612] font-sans px-6 py-8 max-w-2xl mx-auto">

      {/* Runs in setup too, so the camera is ready before the clock starts */}
      <ProctoringCamera
        active={false}
        onReady={() => setCameraReady(true)}
        onCameraUnavailable={(reason) => { setCameraReady(true); setUnproctored(reason) }}
      />

      <div className="flex items-center gap-4 mb-8">
        <button onClick={goBack} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <div>
          <h1 className="text-white font-bold text-lg flex items-center gap-2">
            <FontAwesomeIcon icon={faCode} className="text-violet-400" />
            {test?.title || 'Programming Challenge'}
          </h1>
          <p className="text-gray-500 text-xs">
            {testId
              ? 'Set by your professor. No copy-paste, no tab switching.'
              : 'AI will generate a problem. No copy-paste, no tab switching.'}
          </p>
        </div>
      </div>

      {setupError && (
        <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-4 mb-4 flex items-start gap-3">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 mt-0.5 flex-shrink-0" />
          <p className="text-rose-400 text-sm">{setupError}</p>
        </div>
      )}

      {unproctored && (
        <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-4 mb-4 flex items-start gap-3">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-300 text-sm font-semibold">Taking this without camera proctoring</p>
            <p className="text-gray-400 text-xs mt-1">
              Your professor will see this attempt was unproctored. Tab switching
              and pasting are still monitored.
            </p>
          </div>
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
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">The problem</p>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">{challenge?.description}</p>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>Language: <span className="text-white">{language}</span></span>
              <span>
                Time limit:{' '}
                <span className="text-white">
                  {test?.time_limit_minutes ? `${test.time_limit_minutes} min` : '15 min'}
                </span>
              </span>
            </div>
          </div>
        </>
      ) : (
        // ── Free practice: language and difficulty ──
        <>
          <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-4">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Choose Language</p>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-violet-500/50 focus:bg-violet-500/5 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-all cursor-pointer appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
            >
              {LANGUAGES.map(l => (
                <option key={l} value={l} className="bg-[#0a0a18] text-white">{l}</option>
              ))}
            </select>
          </div>

          <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-6">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Difficulty</p>
            <div className="flex gap-3">
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all capitalize ${
                    difficulty === d ? diffColor[d] : 'border-white/8 text-gray-500 hover:text-white hover:border-white/20'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-gray-600 text-xs mt-3">
              Time limit: {TIME_LIMITS[difficulty] / 60} minutes
            </p>
          </div>
        </>
      )}

      {/* Anti-cheat notice */}
      <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <FontAwesomeIcon icon={faShield} className="text-amber-400 mt-0.5" />
        <div>
          <p className="text-amber-400 text-sm font-semibold mb-1">Anti-cheat is active</p>
          <p className="text-gray-500 text-xs leading-relaxed">
            Copy-paste and tab switching are disabled. Violations deduct 5 points each (max 25 pts).
          </p>
        </div>
      </div>

      <button
        onClick={testId ? startAssignedTest : startChallenge}
        disabled={generating || !cameraReady || (testId && !challenge)}
        className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-all"
      >
        {generating ? (
          <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Generating challenge...</>
        ) : !cameraReady ? (
          <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Waiting for camera...</>
        ) : (
          <><FontAwesomeIcon icon={faPlay} /> {testId ? 'Start test' : 'Start Challenge'}</>
        )}
      </button>
    </div>
  )

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (phase === 'result') return (
    <div className="min-h-screen bg-[#060612] font-sans px-6 py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={goBack} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} /> {testId ? 'Back to assigned tests' : 'Back to Assessments'}
        </button>
      </div>

      <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-6 text-center mb-6">
        <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 text-2xl" />
        </div>
        <p className="text-white font-bold text-xl mb-1">
          {testId ? 'Test submitted!' : 'Challenge Submitted!'}
        </p>
        <p className="text-gray-500 text-sm">Final Score: <span className="text-white font-black text-2xl">{result?.score}</span>/100</p>
        {violations > 0 && (
          <p className="text-rose-400 text-xs mt-2">{violations} tab violation{violations > 1 ? 's' : ''} recorded</p>
        )}
        {cameraViolations > 0 && (
          <p className="text-rose-400 text-xs mt-1">{cameraViolations} camera violation{cameraViolations > 1 ? 's' : ''} recorded</p>
        )}
        {totalViolations > 0 && (
          <p className="text-rose-400 text-xs mt-1 font-semibold">{Math.min(totalViolations * 5, 25)} pts total deducted</p>
        )}
        {unproctored && (
          <p className="text-amber-400 text-xs mt-2">Recorded as an unproctored attempt</p>
        )}
      </div>

      {result?.feedback && (
        <div className="border border-violet-500/20 bg-violet-500/5 rounded-2xl p-5 mb-4">
          <p className="text-violet-400 text-xs font-semibold mb-2">AI Feedback</p>
          <p className="text-gray-300 text-sm leading-relaxed">{result.feedback}</p>
        </div>
      )}

      <div className="flex gap-3">
        {/* A graded test is one attempt — the server rejects a second submit */}
        {!testId && (
          <button onClick={() => setPhase('setup')} className="flex-1 border border-white/8 text-gray-400 hover:text-white text-sm py-3 rounded-2xl transition-all">
            Try again
          </button>
        )}
        <button
          onClick={() => navigate(testId ? '/student/assigned-tests' : '/student/assessment/flowchart')}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm py-3 rounded-2xl transition-all"
        >
          {testId ? 'Back to assigned tests →' : 'Next: Flowchart →'}
        </button>
      </div>
    </div>
  )

  // ── CHALLENGE ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060612] font-sans flex flex-col">

      <ProctoringCamera
        active={phase === 'challenge'}
        onViolation={handleCameraViolation}
        onReady={() => setCameraReady(true)}
        onCameraUnavailable={(reason) => { setCameraReady(true); setUnproctored(reason) }}
      />

      {/* Warning overlay */}
      {showWarning && (
        <div className="fixed inset-0 z-50 bg-rose-950/95 flex items-center justify-center flex-col gap-4 text-center px-6">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 text-5xl" />
          <h2 className="text-white font-black text-2xl">
            {warningType === 'camera' ? 'Proctoring Violation!' : 'Tab Switch Detected!'}
          </h2>
          <p className="text-rose-300 text-sm max-w-sm">
            {warningType === 'camera'
              ? 'A proctoring violation was detected — ensure your face is visible and centered in the camera at all times.'
              : 'Leaving the page is a violation. This has been recorded.'}
            {' '}{totalViolations} flag{totalViolations > 1 ? 's' : ''} total so far.
          </p>
          <button
            onClick={() => setShowWarning(false)}
            className="bg-white text-rose-800 font-bold px-6 py-2.5 rounded-xl mt-2"
          >
            Return to Assessment
          </button>
        </div>
      )}

      {/* Challenge header */}
      <header className="sticky top-0 z-30 bg-[#060612]/95 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{challenge?.title}</p>
          <p className="text-gray-500 text-xs capitalize">
            {language}{testId ? ' · assigned test' : ` · ${difficulty}`}
          </p>
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold flex-shrink-0 ${
          totalViolations === 0 ? 'border-green-500/20 bg-green-500/10 text-green-400'
          : totalViolations < 3 ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
          : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
        }`}>
          <FontAwesomeIcon icon={faShield} />
          {totalViolations} flag{totalViolations !== 1 ? 's' : ''}
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
        <div className="lg:w-80 flex-shrink-0 border border-white/8 bg-white/[0.03] rounded-2xl p-5">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Problem</p>
          <p className="text-white font-bold text-sm mb-3">{challenge?.title}</p>
          <p className="text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{challenge?.description}</p>
          {challenge?.example_input && (
            <div className="mb-3">
              <p className="text-gray-500 text-xs mb-1">Input</p>
              <code className="text-cyan-300 text-xs bg-white/5 px-2 py-1 rounded-lg block whitespace-pre-wrap">{challenge.example_input}</code>
            </div>
          )}
          {challenge?.example_output && (
            <div>
              <p className="text-gray-500 text-xs mb-1">Output</p>
              <code className="text-green-300 text-xs bg-white/5 px-2 py-1 rounded-lg block whitespace-pre-wrap">{challenge.example_output}</code>
            </div>
          )}
        </div>

        {/* Editor panel */}
        <div className="flex-1 flex flex-col border border-white/8 bg-[#0a0a18] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#060610] border-b border-white/5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <span className="text-gray-600 text-xs font-mono ml-2">solution.{EXTENSIONS[language] || 'txt'}</span>
            <span className="ml-auto text-xs text-rose-400/70 border border-rose-500/20 px-2 py-0.5 rounded-full">paste disabled</span>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onPaste={(e) => {
              e.preventDefault()
              violationsRef.current += 1
              setViolations(violationsRef.current)
            }}
            onCopy={(e) => {
              e.preventDefault()
              violationsRef.current += 1
              setViolations(violationsRef.current)
            }}
            placeholder={`# Write your ${language} solution here...`}
            className="flex-1 bg-transparent text-gray-200 font-mono text-sm p-4 resize-none outline-none leading-7 min-h-[320px]"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
          />

          <div className="flex items-center justify-between px-4 py-3 bg-[#060610] border-t border-white/5">
            <p className="text-gray-600 text-xs">Write your own code — no AI tools allowed</p>
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting || !code.trim()}
              className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all"
            >
              {submitting ? (
                <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Submitting...</>
              ) : (
                <><FontAwesomeIcon icon={faPlay} /> Submit</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CodingAssessment