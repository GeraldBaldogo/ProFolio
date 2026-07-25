import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faBug, faShield, faTriangleExclamation,
  faCircleCheck, faSpinner, faPlay, faCode, faLightbulb,
} from '@fortawesome/free-solid-svg-icons'
import { generateBugFixChallenge, submitBugFixResult } from '../../../services/assessment.service'
import { useProctoring } from '../../../hooks/useProctoring'

const LANGUAGES = [
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C', 'C#', 'PHP', 'Ruby', 'Go',
]
const DIFFICULTIES = ['easy', 'medium', 'hard']
const TIME_LIMITS = { easy: 600, medium: 900, hard: 1200 }
const diffColor = {
  easy: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  medium: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  hard: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
}

const BugFixAssessment = () => {
  const navigate = useNavigate()

  const { sessionId, resetSession, tabViolationCount, getViolationCounts } = useProctoring('bugfix')

  const [phase, setPhase] = useState('setup') // setup | challenge | result
  const [language, setLanguage] = useState('Python')
  const [difficulty, setDifficulty] = useState('easy')
  const [generating, setGenerating] = useState(false)

  const [challenge, setChallenge] = useState(null)
  const [fixedCode, setFixedCode] = useState('')
  const [secsLeft, setSecsLeft] = useState(600)
  const [showWarning, setShowWarning] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

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

  const startChallenge = async () => {
    resetSession() // fresh session_id + violation counts for this attempt
    prevTabRef.current = 0
    setGenerating(true)
    try {
      const data = await generateBugFixChallenge({ language, difficulty })
      setChallenge(data)
      setFixedCode(data.buggy_code || '')
      const limit = TIME_LIMITS[difficulty]
      setSecsLeft(limit)
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
    } catch (err) {
      console.error(err)
      alert('Failed to generate challenge. Check your connection.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async (timedOut = false) => {
    clearInterval(timerRef.current)
    if (submitting || result) return
    setSubmitting(true)

    const timeTaken = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : TIME_LIMITS[difficulty]

    try {
      const counts = getViolationCounts() // ref-backed, always current
      const data = await submitBugFixResult({
        language,
        difficulty,
        challenge_title: challenge?.title || '',
        description: challenge?.description || '',
        original_buggy_code: challenge?.buggy_code || '',
        fixed_code: timedOut && !fixedCode ? '(no submission — time ran out)' : fixedCode,
        violation_count: counts.violation_count,
        time_taken_seconds: timeTaken,
        session_id: sessionId,
      })
      setResult(data)
      setPhase('result')
    } catch (err) {
      console.error(err)
      alert('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const bugsFixedColor = {
    all: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    most: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
    some: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
    none: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
  }

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (phase === 'setup') return (
    <div className="min-h-screen bg-[#060612] font-sans px-6 py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/student/assessment')} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <div>
          <h1 className="text-white font-bold text-lg flex items-center gap-2">
            <FontAwesomeIcon icon={faBug} className="text-rose-400" /> Bug Fixing Challenge
          </h1>
          <p className="text-gray-500 text-xs">Find and fix bugs in intentionally broken code.</p>
        </div>
      </div>

      {/* Language */}
      <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-4">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Choose Language</p>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(l => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                language === l
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  : 'border-white/8 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-4">
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
        <div className="mt-3 pt-3 border-t border-white/5">
          {[
            { d: 'easy', desc: '1–2 obvious bugs — syntax errors, off-by-one mistakes' },
            { d: 'medium', desc: '2–3 bugs — logical errors, wrong conditions, missing edge cases' },
            { d: 'hard', desc: '3–5 subtle bugs — algorithmic errors, complex logic flaws' },
          ].map(({ d, desc }) => (
            <p key={d} className={`text-xs mb-1.5 last:mb-0 transition-all ${difficulty === d ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className="font-bold capitalize">{d}:</span> {desc}
            </p>
          ))}
        </div>
        <p className="text-gray-600 text-xs mt-3">Time limit: {TIME_LIMITS[difficulty] / 60} minutes</p>
      </div>

      {/* Anti-cheat notice */}
      <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <FontAwesomeIcon icon={faShield} className="text-amber-400 mt-0.5" />
        <div>
          <p className="text-amber-400 text-sm font-semibold mb-1">Anti-cheat is active</p>
          <p className="text-gray-500 text-xs leading-relaxed">
            Copy-paste is disabled. Tab switching is recorded as a violation and deducts 5 points per flag (max 25 pts). The buggy code is pre-loaded — fix it directly in the editor.
          </p>
        </div>
      </div>

      <button
        onClick={startChallenge}
        disabled={generating}
        className="w-full flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-all"
      >
        {generating ? (
          <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Generating challenge...</>
        ) : (
          <><FontAwesomeIcon icon={faPlay} /> Start Challenge</>
        )}
      </button>
    </div>
  )

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (phase === 'result') return (
    <div className="min-h-screen bg-[#060612] font-sans px-6 py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/student/assessment')} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Assessments
        </button>
      </div>

      {/* Score */}
      <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-6 text-center mb-5">
        <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 text-2xl" />
        </div>
        <p className="text-white font-bold text-xl mb-1">Challenge Submitted!</p>
        <p className="text-gray-500 text-sm">Final Score: <span className="text-white font-black text-2xl">{result?.score}</span>/100</p>
        {tabViolationCount > 0 && (
          <p className="text-rose-400 text-xs mt-2">{tabViolationCount} violation{tabViolationCount > 1 ? 's' : ''} recorded — {Math.min(tabViolationCount * 5, 25)} pts deducted</p>
        )}
      </div>

      {/* Bugs fixed badge */}
      {result?.bugs_fixed && (
        <div className={`border rounded-2xl p-4 mb-4 text-center ${bugsFixedColor[result.bugs_fixed]}`}>
          <p className="text-sm font-bold capitalize">
            {result.bugs_fixed === 'all' ? '✓ All bugs fixed!'
            : result.bugs_fixed === 'most' ? '~ Most bugs fixed'
            : result.bugs_fixed === 'some' ? '~ Some bugs fixed'
            : '✗ No bugs fixed'}
          </p>
        </div>
      )}

      {/* AI Feedback */}
      {result?.feedback && (
        <div className="border border-violet-500/20 bg-violet-500/5 rounded-2xl p-5 mb-5">
          <p className="text-violet-400 text-xs font-semibold mb-2">AI Feedback</p>
          <p className="text-gray-300 text-sm leading-relaxed">{result.feedback}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => { setResult(null); setFixedCode(''); setPhase('setup') }}
          className="flex-1 border border-white/8 text-gray-400 hover:text-white text-sm py-3 rounded-2xl transition-all"
        >
          Try again
        </button>
        <button onClick={() => navigate('/student/assessment')} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm py-3 rounded-2xl transition-all">
          View all results →
        </button>
      </div>
    </div>
  )

  // ── CHALLENGE ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060612] font-sans flex flex-col">

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
      <header className="sticky top-0 z-30 bg-[#060612]/95 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex items-center gap-4">
        <div className="flex-1">
          <p className="text-white font-bold text-sm">{challenge?.title}</p>
          <p className="text-gray-500 text-xs capitalize">{language} · {difficulty} · {challenge?.bug_count} bug{challenge?.bug_count !== 1 ? 's' : ''} to find</p>
        </div>

        {/* Violations */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
          tabViolationCount === 0 ? 'border-green-500/20 bg-green-500/10 text-green-400'
          : tabViolationCount < 3 ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
          : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
        }`}>
          <FontAwesomeIcon icon={faShield} />
          {tabViolationCount} flag{tabViolationCount !== 1 ? 's' : ''}
        </div>

        {/* Timer */}
        <div className={`font-mono font-black text-lg ${secsLeft < 120 ? 'text-rose-400' : 'text-white'}`}>
          {formatTime(secsLeft)}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full px-4 py-4 gap-4">

        {/* Problem panel */}
        <div className="lg:w-80 flex-shrink-0 flex flex-col gap-3">

          {/* Description */}
          <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">What the code should do</p>
            <p className="text-gray-300 text-sm leading-relaxed">{challenge?.description}</p>
          </div>

          {/* Bug count */}
          <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-rose-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faBug} className="text-rose-400 text-sm" />
            </div>
            <div>
              <p className="text-rose-400 font-bold text-sm">{challenge?.bug_count} bug{challenge?.bug_count !== 1 ? 's' : ''} hidden</p>
              <p className="text-gray-500 text-xs">Find and fix all of them</p>
            </div>
          </div>

          {/* Hints toggle */}
          {challenge?.hints?.length > 0 && (
            <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowHints(!showHints)}
                className="w-full flex items-center gap-2 px-4 py-3 text-left"
              >
                <FontAwesomeIcon icon={faLightbulb} className="text-amber-400 text-sm" />
                <span className="text-amber-400 text-sm font-semibold flex-1">
                  {showHints ? 'Hide hints' : 'Show hints'} ({challenge.hints.length})
                </span>
                <span className="text-amber-500/50 text-xs">-2pts each</span>
              </button>
              {showHints && (
                <div className="px-4 pb-4 border-t border-amber-500/10">
                  <ul className="flex flex-col gap-2 mt-3">
                    {challenge.hints.map((hint, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                        <span className="text-amber-400 font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                        {hint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Editor panel */}
        <div className="flex-1 flex flex-col border border-white/8 bg-[#0a0a18] rounded-2xl overflow-hidden">
          {/* Editor topbar */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#060610] border-b border-white/5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <span className="text-gray-600 text-xs font-mono ml-2 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCode} className="text-rose-400 text-[10px]" /> buggy_code.{language.toLowerCase() === 'python' ? 'py' : language.toLowerCase() === 'javascript' ? 'js' : language.toLowerCase() === 'java' ? 'java' : 'txt'}
            </span>
            <span className="ml-auto text-xs text-rose-400/70 border border-rose-500/20 px-2 py-0.5 rounded-full">paste disabled</span>
          </div>

          {/* Code textarea — pre-loaded with buggy code */}
          <textarea
            value={fixedCode}
            onChange={(e) => setFixedCode(e.target.value)}
            onPaste={(e) => {
              e.preventDefault()
              // Don't manually count here — useProctoring's document-level
              // paste listener already catches and logs this automatically.
            }}
            onCopy={(e) => {
              e.preventDefault()
              // Same as above - blocking only, hook logs the copy event itself.
            }}
            className="flex-1 bg-transparent text-gray-200 font-mono text-sm p-4 resize-none outline-none leading-7 min-h-[320px]"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
          />

          {/* Submit bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#060610] border-t border-white/5">
            <p className="text-gray-600 text-xs">Edit the code above — fix all the bugs you can find</p>
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting || !fixedCode.trim()}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all"
            >
              {submitting ? (
                <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Submitting...</>
              ) : (
                <><FontAwesomeIcon icon={faPlay} /> Submit Fix</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BugFixAssessment