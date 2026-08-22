import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faKeyboard, faRotateRight, faCircleCheck, faSpinner,
  faShield, faTriangleExclamation, faUserTie,
} from '@fortawesome/free-solid-svg-icons'
import { submitTypingResult } from '../../../services/assessment.service'
import { getTestById } from '../../../services/test.service'
import ProctoringCamera from '../../../components/ProctoringCamera'
import { useProctoring } from '../../../hooks/useProctoring'

// Used only for free practice. When the page is opened from an assigned test,
// the passage comes from the professor's config instead.
const SAMPLE_TEXTS = [
  "The best way to predict the future is to create it. Programming is not just about writing code, it is about solving problems and thinking logically.",
  "Software development requires patience, creativity, and attention to detail. Every line of code you write is a step toward building something meaningful.",
  "A good programmer is someone who always looks both ways before crossing a one-way street. Clean code always looks like it was written by someone who cares.",
]

const randomSample = () => SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)]

const TypingAssessment = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // Set when the student arrives from Assigned Tests. Null means free practice.
  const testId = params.get('test_id')

  const { sessionId, logEvent, resetSession, cameraViolationCount, tabViolationCount, getViolationCounts } = useProctoring('typing')

  // The professor's test, if there is one.
  const [test, setTest] = useState(null)
  const [loadingTest, setLoadingTest] = useState(!!testId)
  const [testError, setTestError] = useState('')

  const [sampleText, setSampleText] = useState(randomSample)
  const [typed, setTyped] = useState('')
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null)

  const [cameraReady, setCameraReady] = useState(false)
  // Set when the attempt goes ahead without a camera. Sent with the result so
  // the professor can see the score wasn't fully proctored.
  const [unproctored, setUnproctored] = useState('')

  const timerRef = useRef(null)
  const textareaRef = useRef(null)
  const wpmRef = useRef(0)
  const accRef = useRef(100)
  const elapsedRef = useRef(0)

  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [])

  // Pull the professor's passage. Without this the student would be typing a
  // random built-in text while the professor thinks they set the material.
  useEffect(() => {
    if (!testId) return
    let cancelled = false

    getTestById(testId)
      .then((t) => {
        if (cancelled) return
        setTest(t)
        const passage = t?.config?.text_passage
        if (passage) setSampleText(passage)
        else setTestError('This test has no passage set. Ask your professor to check it.')
      })
      .catch((err) => {
        if (!cancelled) setTestError(err.message || 'Couldn\u2019t load this test.')
      })
      .finally(() => {
        if (!cancelled) setLoadingTest(false)
      })

    return () => { cancelled = true }
  }, [testId])

  // The professor can cap the attempt in seconds.
  const limitSeconds = test?.config?.duration_seconds || null

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
        // Auto-finish at the professor's limit, otherwise the cap is decorative.
        if (limitSeconds && s >= limitSeconds) {
          clearInterval(timerRef.current)
          setFinished(true)
          handleSubmit(wpmRef.current, accRef.current, s)
        }
      }, 500)
    }

    setTyped(value)

    let correct = 0
    for (let i = 0; i < value.length; i++) {
      if (value[i] === sampleText[i]) correct++
    }
    const acc = value.length > 0 ? Math.round((correct / value.length) * 100) : 100
    setAccuracy(acc)
    accRef.current = acc

    const elapsedMin = (Date.now() - (startTime || Date.now())) / 1000 / 60
    const words = value.trim().split(/\s+/).length
    const currentWpm = elapsedMin > 0 ? Math.round(words / elapsedMin) : 0
    setWpm(currentWpm)
    wpmRef.current = currentWpm
  }

  // Pasting the sample text would give an instant, meaningless "perfect" score.
  // Block it outright (not just log it) — this is the single easiest cheat on this test.
  const handlePasteAttempt = (e) => {
    e.preventDefault()
    // Don't call logEvent here — useProctoring's document-level paste listener
    // already catches and logs this automatically. Calling it again here
    // would double-count the same paste event.
  }

  const handleFinish = () => {
    if (finished || !started) return
    clearInterval(timerRef.current)
    setFinished(true)
    handleSubmit(wpmRef.current, accRef.current, elapsedRef.current)
  }

  const handleSubmit = async (finalWpm, finalAcc, finalTime) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const counts = getViolationCounts() // ref-backed, always current even mid-tick
      const data = await submitTypingResult({
        wpm: finalWpm,
        accuracy: finalAcc,
        time_seconds: finalTime,
        camera_violation_count: counts.camera_violation_count,
        violation_count: counts.violation_count,
        session_id: sessionId,
        // Ties the result to the professor's test and closes the assignment.
        // Left out entirely for free practice.
        ...(testId ? { test_id: testId } : {}),
        ...(unproctored ? { unproctored: true, unproctored_reason: unproctored } : {}),
      })
      setResult(data)
    } catch (err) {
      // Previously this was console.error only, which left the student on a
      // spinner-less screen with no result and no explanation.
      setSubmitError(err.message || 'Couldn\u2019t save your result. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    resetSession() // fresh session_id + violation counts for the new attempt
    setTyped('')
    setStarted(false)
    setFinished(false)
    setStartTime(null)
    setElapsed(0)
    setWpm(0)
    setAccuracy(100)
    setResult(null)
    setSubmitError('')
    // Practice gets a new passage; a graded test keeps the professor's.
    if (!testId) setSampleText(randomSample())
    clearInterval(timerRef.current)
    textareaRef.current?.focus()
  }

  const totalViolations = cameraViolationCount + tabViolationCount

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

  const goBack = () => navigate(testId ? '/student/assigned-tests' : '/student/assessment')

  // Don't let them start on the wrong passage while the real one is still loading.
  if (loadingTest) {
    return (
      <div className="min-h-screen bg-[#060612] font-sans flex flex-col items-center justify-center gap-3">
        <FontAwesomeIcon icon={faSpinner} className="text-blue-400 text-2xl animate-spin" />
        <p className="text-gray-500 text-sm">Loading your test...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060612] font-sans px-6 py-8 max-w-3xl mx-auto">

      {/* Proctoring camera — active once started */}
      <ProctoringCamera
        active={started && !finished}
        onViolation={logEvent}
        onReady={() => setCameraReady(true)}
        onCameraUnavailable={(reason) => setUnproctored(reason)}
      />

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <div>
          <h1 className="text-white font-bold text-lg flex items-center gap-2">
            <FontAwesomeIcon icon={faKeyboard} className="text-cyan-400" />
            {test?.title || 'Speed Typing'}
          </h1>
          <p className="text-gray-500 text-xs">Type the text below as fast and accurately as you can</p>
        </div>
      </div>

      {/* Graded, not practice — worth saying plainly */}
      {testId && (
        <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-4 mb-4 flex items-start gap-3">
          <FontAwesomeIcon icon={faUserTie} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-300 text-sm font-semibold">Assigned test — this one counts</p>
            {test?.description && <p className="text-gray-400 text-xs mt-1">{test.description}</p>}
            {limitSeconds && (
              <p className="text-gray-500 text-xs mt-1">
                Submits automatically after {limitSeconds} seconds.
              </p>
            )}
          </div>
        </div>
      )}

      {testError && (
        <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 flex-shrink-0" />
          <p className="text-rose-400 text-sm">{testError}</p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'WPM', value: wpm || '—' },
          { label: 'Accuracy', value: started ? `${accuracy}%` : '—' },
          {
            label: limitSeconds ? 'Left' : 'Time',
            value: started
              ? (limitSeconds ? `${Math.max(0, limitSeconds - elapsed)}s` : `${elapsed}s`)
              : (limitSeconds ? `${limitSeconds}s` : '—'),
          },
          { label: 'Flags', value: totalViolations > 0 ? totalViolations : '—', warn: totalViolations > 0 },
        ].map((s) => (
          <div key={s.label} className={`border rounded-2xl p-4 text-center ${s.warn ? 'border-rose-500/20 bg-rose-500/5' : 'border-white/8 bg-white/[0.03]'}`}>
            <p className="text-gray-500 text-xs mb-1">{s.label}</p>
            <p className={`font-black text-2xl ${s.warn ? 'text-rose-400' : 'text-white'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Camera not ready notice — shown before starting */}
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

      {!cameraReady && !started && (
        <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <FontAwesomeIcon icon={faSpinner} className="text-amber-400 animate-spin" />
          <p className="text-amber-400 text-sm">Waiting for proctoring camera to initialize...</p>
        </div>
      )}

      {/* Violation warning banner */}
      {totalViolations > 0 && (
        <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <FontAwesomeIcon icon={faShield} className="text-rose-400" />
          <p className="text-rose-400 text-sm font-semibold">
            {totalViolations} violation{totalViolations > 1 ? 's' : ''} recorded — keep your face visible, stay on this tab, and don't paste text.
          </p>
        </div>
      )}

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
            onPaste={handlePasteAttempt}
            disabled={!cameraReady}
            placeholder={cameraReady ? 'Start typing here...' : 'Waiting for camera...'}
            rows={3}
            className="w-full bg-[#0a0a18] border border-white/8 rounded-2xl p-4 text-white font-mono text-sm resize-none outline-none focus:border-blue-500/40 transition-colors placeholder:text-gray-700 mb-3 disabled:opacity-40"
            autoFocus
          />
          <button
            onClick={handleFinish}
            disabled={!started || !cameraReady}
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
          ) : submitError ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center">
                <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 text-2xl" />
              </div>
              <div>
                <p className="text-white font-bold text-lg mb-1">Result not saved</p>
                <p className="text-gray-500 text-sm">{submitError}</p>
              </div>
              <button
                onClick={() => handleSubmit(wpmRef.current, accRef.current, elapsedRef.current)}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
              >
                <FontAwesomeIcon icon={faRotateRight} /> Try saving again
              </button>
            </div>
          ) : result ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center">
                <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 text-2xl" />
              </div>
              <div>
                <p className="text-white font-bold text-lg mb-1">
                  {testId ? 'Test submitted!' : 'Assessment Complete!'}
                </p>
                <p className="text-gray-500 text-sm">Skill score: <span className="text-white font-bold">{result.score}/100</span></p>
                {totalViolations > 0 && (
                  <p className="text-rose-400 text-xs mt-1">{totalViolations} violation{totalViolations > 1 ? 's' : ''} recorded</p>
                )}
              </div>
              <div className="flex gap-3 mt-2">
                {/* A graded test is one attempt — retaking it would overwrite
                    nothing and the server rejects a second submit anyway. */}
                {!testId && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 border border-white/8 text-gray-400 hover:text-white text-sm px-4 py-2 rounded-xl transition-all"
                  >
                    <FontAwesomeIcon icon={faRotateRight} /> Try again
                  </button>
                )}
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
                >
                  {testId ? 'Back to assigned tests →' : 'Next assessment →'}
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