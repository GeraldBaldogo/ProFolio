import { useState, useEffect, useRef, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faVideo, faVideoSlash, faTriangleExclamation, faSpinner,
  faUser, faUserGroup, faEyeSlash, faShieldHalved, faCircleCheck,
} from '@fortawesome/free-solid-svg-icons'

/**
 * ProctoringCamera — reusable webcam-based anti-cheat component.
 *
 * Loads face-api.js models from CDN, runs detection on an interval,
 * and reports violations (no face / multiple faces / looking away)
 * via the onViolation callback. Renders a small floating preview
 * with live status.
 *
 * Props:
 *  - onViolation(type): called once per new violation. type is
 *    'no_face' | 'multiple_faces' | 'looking_away'
 *  - onReady(): called once camera + models are ready (assessment can start)
 *  - onDenied(): called if camera permission is denied
 *  - active: boolean — whether detection should run (pause during result screens etc.)
 */

const MODEL_URL = 'https://cdnjs.cloudflare.com/ajax/libs/face-api.js/0.22.2/weights' // fallback if no local models
const FACE_API_SCRIPT = 'https://cdnjs.cloudflare.com/ajax/libs/face-api.js/0.22.2/face-api.min.js'

let faceApiLoadPromise = null
const loadFaceApiScript = () => {
  if (window.faceapi) return Promise.resolve()
  if (faceApiLoadPromise) return faceApiLoadPromise
  faceApiLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = FACE_API_SCRIPT
    script.async = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
  return faceApiLoadPromise
}

const DETECTION_INTERVAL_MS = 2000
const VIOLATION_COOLDOWN_MS = 4000 // avoid spamming repeated violations for the same continuous issue
const LOOK_AWAY_YAW_THRESHOLD = 25 // degrees, approximate

const ProctoringCamera = ({ onViolation, onReady, onDenied, active = true }) => {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)
  const lastViolationRef = useRef({ no_face: 0, multiple_faces: 0, looking_away: 0 })
  const noFaceStreakRef = useRef(0)

  const [status, setStatus] = useState('initializing') // initializing | loading_models | ready | denied | error
  const [faceState, setFaceState] = useState('checking') // checking | ok | no_face | multiple_faces | looking_away
  const [minimized, setMinimized] = useState(false)

  const reportViolation = useCallback((type) => {
    const now = Date.now()
    if (now - lastViolationRef.current[type] < VIOLATION_COOLDOWN_MS) return
    lastViolationRef.current[type] = now
    onViolation?.(type)
  }, [onViolation])

  const runDetection = useCallback(async () => {
    if (!videoRef.current || !window.faceapi || videoRef.current.readyState < 2) return

    try {
      const detections = await window.faceapi
        .detectAllFaces(videoRef.current, new window.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
        .withFaceLandmarks()

      if (detections.length === 0) {
        noFaceStreakRef.current += 1
        setFaceState('no_face')
        // require 2 consecutive misses (~4s) before flagging, to avoid false positives on blinks/lag
        if (noFaceStreakRef.current >= 2) {
          reportViolation('no_face')
        }
        return
      }

      noFaceStreakRef.current = 0

      if (detections.length > 1) {
        setFaceState('multiple_faces')
        reportViolation('multiple_faces')
        return
      }

      // Single face — approximate gaze/head-pose using landmark symmetry
      const landmarks = detections[0].landmarks
      const nose = landmarks.getNose()
      const jaw = landmarks.getJawOutline()
      const leftJaw = jaw[0]
      const rightJaw = jaw[16]
      const noseTip = nose[3]

      const faceWidth = rightJaw.x - leftJaw.x
      const noseOffsetRatio = ((noseTip.x - leftJaw.x) / faceWidth - 0.5) * 2 // -1 (left) to 1 (right)
      const estimatedYaw = noseOffsetRatio * 45 // rough degrees estimate

      if (Math.abs(estimatedYaw) > LOOK_AWAY_YAW_THRESHOLD) {
        setFaceState('looking_away')
        reportViolation('looking_away')
        return
      }

      setFaceState('ok')
    } catch (err) {
      console.error('Detection error:', err)
    }
  }, [reportViolation])

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        setStatus('loading_models')
        await loadFaceApiScript()
        if (cancelled) return

        await Promise.all([
          window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ])
        if (cancelled) return

        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false })
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        setStatus('ready')
        onReady?.()
      } catch (err) {
        console.error('Proctoring init failed:', err)
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setStatus('denied')
          onDenied?.()
        } else {
          setStatus('error')
          onDenied?.()
        }
      }
    }

    init()

    return () => {
      cancelled = true
      clearInterval(intervalRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  useEffect(() => {
    if (status !== 'ready' || !active) {
      clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(runDetection, DETECTION_INTERVAL_MS)
    return () => clearInterval(intervalRef.current)
  }, [status, active, runDetection])

  const stateConfig = {
    checking: { icon: faSpinner, color: 'text-gray-400', spin: true, label: 'Checking...' },
    ok: { icon: faCircleCheck, color: 'text-emerald-400', spin: false, label: 'Face detected' },
    no_face: { icon: faEyeSlash, color: 'text-rose-400', spin: false, label: 'No face detected' },
    multiple_faces: { icon: faUserGroup, color: 'text-rose-400', spin: false, label: 'Multiple faces' },
    looking_away: { icon: faTriangleExclamation, color: 'text-amber-400', spin: false, label: 'Looking away' },
  }
  const sc = stateConfig[faceState]

  // ── Denied / Error state ──────────────────────────────────────────────────
  if (status === 'denied' || status === 'error') {
    return (
      <div className="fixed inset-0 z-[100] bg-[#060612]/98 backdrop-blur-sm flex items-center justify-center px-6">
        <div className="max-w-md w-full border border-rose-500/20 bg-rose-500/5 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faVideoSlash} className="text-rose-400 text-2xl" />
          </div>
          <h2 className="text-white font-bold text-lg mb-2">Camera access required</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            {status === 'denied'
              ? 'This assessment requires camera access for proctoring. Please allow camera permission in your browser settings and refresh this page.'
              : 'We couldn\'t start the proctoring camera. Please check your camera connection and refresh this page.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all"
          >
            Refresh and try again
          </button>
        </div>
      </div>
    )
  }

  // ── Loading state (full overlay, blocks assessment until ready) ───────────
  if (status === 'initializing' || status === 'loading_models') {
    return (
      <div className="fixed inset-0 z-[100] bg-[#060612]/98 backdrop-blur-sm flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <FontAwesomeIcon icon={faSpinner} className="text-blue-400 text-3xl animate-spin mb-4" />
          <p className="text-white font-semibold text-sm mb-1">Starting proctoring camera...</p>
          <p className="text-gray-500 text-xs">Loading face detection models. This may take a few seconds.</p>
        </div>
        <video ref={videoRef} autoPlay muted playsInline className="hidden" />
      </div>
    )
  }

  // ── Ready — floating camera widget ─────────────────────────────────────────
  return (
    <div className={`fixed bottom-5 left-5 z-40 transition-all ${minimized ? 'w-12 h-12' : 'w-44'}`}>
      <div className="border border-white/10 bg-[#0a0a18]/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
        {minimized ? (
          <button
            onClick={() => setMinimized(false)}
            className="w-12 h-12 flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faVideo} className={sc.color} />
          </button>
        ) : (
          <>
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-32 object-cover scale-x-[-1]"
              />
              <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${faceState === 'ok' ? 'bg-emerald-400' : faceState === 'checking' ? 'bg-gray-500' : 'bg-rose-400 animate-pulse'}`} />
              <button
                onClick={() => setMinimized(true)}
                className="absolute top-2 left-2 w-6 h-6 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white/70 hover:text-white text-xs transition-all"
              >
                −
              </button>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-2 border-t border-white/5">
              <FontAwesomeIcon icon={sc.icon} className={`${sc.color} text-xs ${sc.spin ? 'animate-spin' : ''}`} />
              <span className="text-gray-300 text-[10px] font-medium truncate">{sc.label}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ProctoringCamera