import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faKeyboard, faRotateRight, faCircleCheck, faSpinner,
} from '@fortawesome/free-solid-svg-icons'
import { submitTypingResult } from '../../../services/assessment.service'

const SAMPLE_TEXTS = [
  "The best way to predict the future is to create it. Programming is not just about writing code, it is about solving problems and thinking logically.",
  "Software development requires patience, creativity, and attention to detail. Every line of code you write is a step toward building something meaningful.",
  "A good programmer is someone who always looks both ways before crossing a one-way street. Clean code always looks like it was written by someone who cares.",
]

const TypingAssessment = () => {
  const navigate = useNavigate()
  const [sampleText] = useState(SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)])
  const [typed, setTyped] = useState('')
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const timerRef = useRef(null)
  const textareaRef = useRef(null)
  // Use refs to always have latest values inside async handleSubmit
  const wpmRef = useRef(0)
  const accRef = useRef(100)
  const elapsedRef = useRef(0)

  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [])

  const handleType = (e) => {
    const value = e.target.value
    if (finished) return

    if (!started) {
      setStarted(true)
      const now = Date.now()
      setStartTime(now)
      timerRef.current = setInterval(() => {
        const s = Math.floor((Date.now() - now) / 1000)
        setElapsed(s)
        elapsedRef.current = s
      }, 500)
    }

    setTyped(value)

    // Calculate accuracy
    let correct = 0
    for (let i = 0; i < value.length; i++) {
      if (value[i] === sampleText[i]) correct++
    }
    const acc = value.length > 0 ? Math.round((correct / value.length) * 100) : 100
    setAccuracy(acc)
    accRef.current = acc

    // Calculate WPM
    const elapsedMin = (Date.now() - (startTime || Date.now())) / 1000 / 60
    const words = value.trim().split(/\s+/).length
    const currentWpm = elapsedMin > 0 ? Math.round(words / elapsedMin) : 0
    setWpm(currentWpm)
    wpmRef.current = currentWpm
  }

  const handleFinish = () => {
    if (finished || !started) return
    clearInterval(timerRef.current)
    setFinished(true)
    handleSubmit(wpmRef.current, accRef.current, elapsedRef.current)
  }

  const handleSubmit = async (finalWpm, finalAcc, finalTime) => {
    setSubmitting(true)
    try {
      const data = await submitTypingResult({
        wpm: finalWpm,
        accuracy: finalAcc,
        time_seconds: finalTime,
      })
      setResult(data)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setTyped('')
    setStarted(false)
    setFinished(false)
    setStartTime(null)
    setElapsed(0)
    setWpm(0)
    setAccuracy(100)
    setResult(null)
    clearInterval(timerRef.current)
    textareaRef.current?.focus()
  }

  // Render colored sample text
  const renderText = () => {
    return sampleText.split('').map((char, i) => {
      let color = 'text-gray-500'
      if (i < typed.length) {
        color = typed[i] === char ? 'text-white' : 'text-rose-400 underline decoration-rose-500'
      } else if (i === typed.length) {
        color = 'text-white bg-blue-500/40 rounded'
      }
      return (
        <span key={i} className={`${color} transition-colors`}>{char}</span>
      )
    })
  }

  return (
    <div className="min-h-screen bg-[#060612] font-sans px-6 py-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/student/assessment')}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <div>
          <h1 className="text-white font-bold text-lg flex items-center gap-2">
            <FontAwesomeIcon icon={faKeyboard} className="text-cyan-400" />
            Speed Typing
          </h1>
          <p className="text-gray-500 text-xs">Type the text below as fast and accurately as you can</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'WPM', value: wpm || '—' },
          { label: 'Accuracy', value: started ? `${accuracy}%` : '—' },
          { label: 'Time', value: started ? `${elapsed}s` : '—' },
        ].map((s) => (
          <div key={s.label} className="border border-white/8 bg-white/[0.03] rounded-2xl p-4 text-center">
            <p className="text-gray-500 text-xs mb-1">{s.label}</p>
            <p className="text-white font-black text-2xl">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Sample text */}
      <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-4 font-mono text-sm leading-8 tracking-wide">
        {renderText()}
      </div>

      {/* Input */}
      {!finished && (
        <>
          <textarea
            ref={textareaRef}
            value={typed}
            onChange={handleType}
            placeholder="Start typing here..."
            rows={3}
            className="w-full bg-[#0a0a18] border border-white/8 rounded-2xl p-4 text-white font-mono text-sm resize-none outline-none focus:border-blue-500/40 transition-colors placeholder:text-gray-700 mb-3"
            autoFocus
          />
          <button
            onClick={handleFinish}
            disabled={!started}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-30 text-white font-bold py-3 rounded-2xl transition-all"
          >
            <FontAwesomeIcon icon={faCircleCheck} /> Submit Result
          </button>
        </>
      )}

      {/* Finished state */}
      {finished && (
        <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-6 text-center">
          {submitting ? (
            <div className="flex flex-col items-center gap-3">
              <FontAwesomeIcon icon={faSpinner} className="text-blue-400 text-2xl animate-spin" />
              <p className="text-gray-400 text-sm">Saving your result...</p>
            </div>
          ) : result ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center">
                <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 text-2xl" />
              </div>
              <div>
                <p className="text-white font-bold text-lg mb-1">Assessment Complete!</p>
                <p className="text-gray-500 text-sm">Skill score: <span className="text-white font-bold">{result.score}/100</span></p>
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 border border-white/8 text-gray-400 hover:text-white text-sm px-4 py-2 rounded-xl transition-all"
                >
                  <FontAwesomeIcon icon={faRotateRight} /> Try again
                </button>
                <button
                  onClick={() => navigate('/student/assessment')}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
                >
                  Next assessment →
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default TypingAssessment