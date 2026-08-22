import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faDiagramProject, faCloudArrowUp, faCircleCheck,
  faSpinner, faImage, faRotateRight, faShield, faTriangleExclamation,
  faUserTie, faListCheck,
} from '@fortawesome/free-solid-svg-icons'
import { generateFlowchartProblem, submitFlowchartResult } from '../../../services/assessment.service'
import { getTestById } from '../../../services/test.service'
import ProctoringCamera from '../../../components/ProctoringCamera'
import { useProctoring } from '../../../hooks/useProctoring'

const FlowchartAssessment = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // Set when the student arrives from Assigned Tests. Null means free practice.
  const testId = params.get('test_id')

  const {
    sessionId, logEvent, resetSession,
    cameraViolationCount, tabViolationCount
  } = useProctoring('flowchart')

  const [phase, setPhase] = useState('loading') // loading | problem | result
  const [problem, setProblem] = useState(null)
  const [test, setTest] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [cameraReady, setCameraReady] = useState(false)
  // Set when the attempt goes ahead without a camera.
  const [unproctored, setUnproctored] = useState('')

  useEffect(() => {
    if (testId) loadAssignedTest()
    else fetchProblem()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId])

  // Pull the professor's scenario. Without this the student would be drawing
  // an AI-generated problem while the professor thinks they set the work.
  const loadAssignedTest = async () => {
    setPhase('loading')
    setError(null)
    try {
      const t = await getTestById(testId)
      setTest(t)

      const cfg = t?.config || {}
      if (!cfg.scenario_description) {
        setError('This test has no scenario set. Ask your professor to check it.')
      } else {
        setProblem({
          title: t.title,
          description: cfg.scenario_description,
          // The professor writes marking criteria rather than hints — different
          // thing, so it renders under its own heading below.
          hints: [],
          rubric: Array.isArray(cfg.rubric) ? cfg.rubric : [],
        })
      }
    } catch (err) {
      setError(err.message || 'Couldn\u2019t load this test.')
    } finally {
      setPhase('problem')
    }
  }

  const fetchProblem = async () => {
    setPhase('loading')
    setError(null)
    try {
      const data = await generateFlowchartProblem()
      setProblem(data)
    } catch (err) {
      setError('Failed to load problem. Please try again.')
    } finally {
      setPhase('problem')
    }
  }

  const handleImagePick = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file || !file.type.startsWith('image/')) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!imageFile) return
    setSubmitting(true)
    setError(null)
    try {
      const data = await submitFlowchartResult({
        problem_title: problem?.title || 'Flowchart Assessment',
        imageFile,
        camera_violation_count: cameraViolationCount,
        session_id: sessionId,
        // Ties the result to the professor's test and closes the assignment.
        ...(testId ? { test_id: testId } : {}),
        ...(unproctored ? { unproctored: true, unproctored_reason: unproctored } : {}),
      })
      setResult(data)
      setPhase('result')
    } catch (err) {
      // The photo is still selected, so a failure here is recoverable — say so
      // rather than just "Submission failed".
      setError(err.message || 'Couldn\u2019t submit. Your photo is still here — try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    resetSession() // fresh session_id + violation counts for the new attempt
    setImageFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    setPhase('problem')
  }

  const totalViolations = cameraViolationCount + tabViolationCount
  const goBack = () => navigate(testId ? '/student/assigned-tests' : '/student/assessment')

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div className="min-h-screen bg-[#060612] flex items-center justify-center">
      <ProctoringCamera
        active={false}
        onReady={() => setCameraReady(true)}
        onCameraUnavailable={(reason) => { setCameraReady(true); setUnproctored(reason) }}
      />
      <div className="flex flex-col items-center gap-3">
        <FontAwesomeIcon icon={faSpinner} className="text-blue-400 text-3xl animate-spin" />
        <p className="text-gray-500 text-sm">
          {testId ? 'Loading your test...' : 'Generating your problem...'}
        </p>
      </div>
    </div>
  )

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (phase === 'result') return (
    <div className="min-h-screen bg-[#060612] font-sans px-6 py-8 max-w-2xl mx-auto">
      <ProctoringCamera
        active={false}
        onReady={() => setCameraReady(true)}
        onCameraUnavailable={(reason) => { setCameraReady(true); setUnproctored(reason) }}
      />
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
          {testId ? 'Test submitted!' : 'Flowchart Submitted!'}
        </p>
        <p className="text-gray-500 text-sm">Score: <span className="text-white font-black text-2xl">{result?.score}</span>/100</p>
        {totalViolations > 0 && (
          <p className="text-rose-400 text-xs mt-2">{totalViolations} violation{totalViolations > 1 ? 's' : ''} recorded</p>
        )}
        {unproctored && (
          <p className="text-amber-400 text-xs mt-2">Recorded as an unproctored attempt</p>
        )}
      </div>

      {/* AI checklist */}
      <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-4">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">AI Evaluation</p>
        {[
          { label: 'Has start/end terminal', value: result?.metadata?.has_start_end },
          { label: 'Has decision diamond', value: result?.metadata?.has_decision_diamond },
          { label: 'Logical flow', value: result?.metadata?.logical_flow === 'correct' ? true : result?.metadata?.logical_flow === 'partial' ? null : false },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              item.value === true ? 'bg-green-500/20 text-green-400'
              : item.value === null ? 'bg-amber-500/20 text-amber-400'
              : 'bg-rose-500/20 text-rose-400'
            }`}>
              {item.value === true ? '✓' : item.value === null ? '~' : '✗'}
            </div>
            <p className="text-gray-300 text-sm">{item.label}</p>
          </div>
        ))}
      </div>

      {result?.feedback && (
        <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-5 mb-5">
          <p className="text-emerald-400 text-xs font-semibold mb-2">AI Feedback</p>
          <p className="text-gray-300 text-sm leading-relaxed">{result.feedback}</p>
        </div>
      )}

      {preview && (
        <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-4 mb-5">
          <p className="text-gray-500 text-xs mb-2">Your submission</p>
          <img src={preview} alt="Submitted flowchart" className="w-full rounded-xl object-contain max-h-64" />
        </div>
      )}

      <div className="flex gap-3">
        {/* A graded test is one attempt — the server rejects a second submit */}
        {!testId && (
          <button onClick={handleReset} className="flex-1 flex items-center justify-center gap-2 border border-white/8 text-gray-400 hover:text-white text-sm py-3 rounded-2xl transition-all">
            <FontAwesomeIcon icon={faRotateRight} /> Try again
          </button>
        )}
        <button onClick={goBack} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm py-3 rounded-2xl transition-all">
          {testId ? 'Back to assigned tests →' : 'View all results →'}
        </button>
      </div>
    </div>
  )

  // ── PROBLEM ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060612] font-sans px-6 py-8 max-w-2xl mx-auto">

      <ProctoringCamera
        active={phase === 'problem'}
        onViolation={logEvent}
        onReady={() => setCameraReady(true)}
        onCameraUnavailable={(reason) => { setCameraReady(true); setUnproctored(reason) }}
      />

      <div className="flex items-center gap-4 mb-8">
        <button onClick={goBack} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <div>
          <h1 className="text-white font-bold text-lg flex items-center gap-2">
            <FontAwesomeIcon icon={faDiagramProject} className="text-emerald-400" />
            {test?.title || 'Flowchart Assessment'}
          </h1>
          <p className="text-gray-500 text-xs">Draw the flowchart on paper, take a photo, and upload it</p>
        </div>
        {totalViolations > 0 && (
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-semibold">
            <FontAwesomeIcon icon={faShield} />
            {totalViolations} flag{totalViolations !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {testId && (
        <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-4 mb-4 flex items-start gap-3">
          <FontAwesomeIcon icon={faUserTie} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-300 text-sm font-semibold">Assigned test — this one counts</p>
            {test?.description && <p className="text-gray-400 text-xs mt-1">{test.description}</p>}
          </div>
        </div>
      )}

      {unproctored && (
        <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-4 mb-4 flex items-start gap-3">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-300 text-sm font-semibold">Taking this without camera proctoring</p>
            <p className="text-gray-400 text-xs mt-1">
              Your professor will see this attempt was unproctored.
            </p>
          </div>
        </div>
      )}

      {/* Camera not ready notice */}
      {!cameraReady && (
        <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <FontAwesomeIcon icon={faSpinner} className="text-amber-400 animate-spin" />
          <p className="text-amber-400 text-sm">Waiting for proctoring camera...</p>
        </div>
      )}

      {error && (
        <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 flex-shrink-0" />
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}

      {problem && (
        <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-5 mb-5">
          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">Your Problem</p>
          <p className="text-white font-bold text-sm mb-2">{problem.title}</p>
          <p className="text-gray-300 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{problem.description}</p>

          {problem.hints?.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs font-semibold mb-1">Hints</p>
              <ul className="list-disc list-inside space-y-0.5">
                {problem.hints.map((h, i) => (
                  <li key={i} className="text-gray-400 text-xs">{h}</li>
                ))}
              </ul>
            </div>
          )}

          {/* The professor's marking criteria — worth showing plainly, since
              it's what the drawing will actually be judged against. */}
          {problem.rubric?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-emerald-500/15">
              <p className="text-gray-500 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faListCheck} className="text-emerald-400" /> You&apos;ll be marked on
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                {problem.rubric.map((r, i) => (
                  <li key={i} className="text-gray-400 text-xs">{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-5">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">How to submit</p>
        {[
          'Draw the flowchart on paper using proper symbols (oval for start/end, diamond for decisions, rectangle for processes).',
          'Take a clear photo of your drawing.',
          'Upload the photo below.',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3 mb-2.5 last:mb-0">
            <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</div>
            <p className="text-gray-400 text-sm">{step}</p>
          </div>
        ))}
      </div>

      {/* Upload */}
      <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="mb-5">
        <label htmlFor="flowchart-upload" className="cursor-pointer block">
          {preview ? (
            <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-2xl p-3 text-center">
              <img src={preview} alt="Preview" className="w-full max-h-64 object-contain rounded-xl mb-2" />
              <p className="text-emerald-400 text-xs font-medium flex items-center justify-center gap-1">
                <FontAwesomeIcon icon={faImage} /> {imageFile?.name} — tap to change
              </p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-white/10 hover:border-blue-500/40 bg-white/[0.02] rounded-2xl p-10 text-center transition-all">
              <FontAwesomeIcon icon={faCloudArrowUp} className="text-gray-500 text-3xl mb-3 block mx-auto" />
              <p className="text-gray-400 text-sm font-medium mb-1">Click or drag photo here</p>
              <p className="text-gray-600 text-xs">JPG, PNG, HEIC supported</p>
            </div>
          )}
        </label>
        <input id="flowchart-upload" type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!imageFile || submitting || !cameraReady}
        className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold py-3 rounded-2xl transition-all"
      >
        {submitting ? (
          <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> AI is checking your flowchart...</>
        ) : !cameraReady ? (
          <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Waiting for camera...</>
        ) : (
          <><FontAwesomeIcon icon={faCircleCheck} /> Submit for AI Review</>
        )}
      </button>
    </div>
  )
}

export default FlowchartAssessment