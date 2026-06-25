import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faComments, faCircleCheck, faSpinner, faPlay,
  faTriangleExclamation, faPen, faChartBar,
} from '@fortawesome/free-solid-svg-icons'
import api from '../../../services/api'

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

  const [phase, setPhase] = useState('setup') // setup | challenge | result
  const [difficulty, setDifficulty] = useState('easy')
  const [loading, setLoading] = useState(false)

  const [prompt, setPrompt] = useState(null)
  const [response, setResponse] = useState('')
  const [secsLeft, setSecsLeft] = useState(TIME_LIMITS.easy)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [wordCount, setWordCount] = useState(0)

  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => () => clearInterval(timerRef.current), [])

  const handleResponseChange = (e) => {
    const val = e.target.value
    setResponse(val)
    setWordCount(val.trim() ? val.trim().split(/\s+/).length : 0)
  }

  const startChallenge = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/communication/prompt?difficulty=${difficulty}`)
      setPrompt(res.data.data)
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
      alert('Failed to load prompt. Check your connection.')
    } finally {
      setLoading(false)
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
      const res = await api.post('/communication/submit', {
        difficulty,
        prompt_id: prompt.id,
        prompt_title: prompt.title,
        prompt_text: prompt.prompt,
        response_text: timedOut && !response ? '(no submission — time ran out)' : response,
        time_taken_seconds: timeTaken,
      })
      setResult(res.data.data)
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

  const resetAll = () => {
    setPhase('setup')
    setPrompt(null)
    setResponse('')
    setResult(null)
    setWordCount(0)
    clearInterval(timerRef.current)
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
            <FontAwesomeIcon icon={faComments} className="text-cyan-400" /> Communication Skills
          </h1>
          <p className="text-gray-500 text-xs">Write professional responses to real-world workplace prompts.</p>
        </div>
      </div>

      {/* Difficulty */}
      <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-4">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Difficulty</p>
        <div className="flex gap-3 mb-4">
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

      {/* What's evaluated */}
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

      <button
        onClick={startChallenge}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-all"
      >
        {loading
          ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Loading prompt...</>
          : <><FontAwesomeIcon icon={faPlay} /> Start Challenge</>}
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
        <p className="text-white font-bold text-xl mb-1">Response Submitted!</p>
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
        <button onClick={resetAll} className="flex-1 border border-white/8 text-gray-400 hover:text-white text-sm py-3 rounded-2xl transition-all">
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

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#060612]/95 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex items-center gap-4">
        <div className="flex-1">
          <p className="text-white font-bold text-sm">{prompt?.title}</p>
          <p className="text-gray-500 text-xs capitalize">{difficulty} · {wordCount} word{wordCount !== 1 ? 's' : ''}</p>
        </div>
        <div className={`font-mono font-black text-lg ${secsLeft < 60 ? 'text-rose-400' : secsLeft < 120 ? 'text-amber-400' : 'text-white'}`}>
          {formatTime(secsLeft)}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-5xl mx-auto w-full px-4 py-4 gap-4">

        {/* Prompt panel */}
        <div className="lg:w-80 flex-shrink-0 flex flex-col gap-3">
          <div className="border border-cyan-500/20 bg-cyan-500/5 rounded-2xl p-5">
            <p className="text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">Your Prompt</p>
            <p className="text-white font-bold text-sm mb-3">{prompt?.title}</p>
            <p className="text-gray-300 text-sm leading-relaxed">{prompt?.prompt}</p>
          </div>

          <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-4">
            <p className="text-gray-500 text-xs font-semibold mb-2">Evaluated On</p>
            {prompt?.criteria?.split(', ').map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-400 text-xs py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                <span className="capitalize">{c}</span>
              </div>
            ))}
          </div>

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
          {/* Editor topbar */}
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

          {/* Textarea */}
          <textarea
            value={response}
            onChange={handleResponseChange}
            placeholder="Write your response here..."
            className="flex-1 bg-transparent text-gray-200 text-sm p-5 resize-none outline-none leading-7 min-h-[320px]"
            autoComplete="off"
            autoCorrect="off"
          />

          {/* Submit bar */}
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