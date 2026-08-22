import { useState, useEffect, useRef, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faVideo, faVideoSlash, faTriangleExclamation, faSpinner,
  faUserGroup, faEyeSlash, faCircleCheck,
} from '@fortawesome/free-solid-svg-icons'

/**
 * ProctoringCamera — reusable webcam-based anti-cheat component.
 *
 * Loads face-api.js, runs detection on an interval, and reports violations
 * (no face / multiple faces / looking away) via onViolation. Renders a small
 * floating preview with live status.
 *
 * If face detection can't load, the camera still runs and the assessment still
 * starts — see DEGRADED MODE below.
 *
 * Props:
 *  - onViolation(type): called once per new violation. type is
 *    'no_face' | 'multiple_faces' | 'looking_away'
 *  - onReady(): called once the assessment can start
 *  - onCameraUnavailable(reason): called when the attempt proceeds without a camera
 *  - onDenied(): kept for callers that still pass it; no longer used internally
 *  - active: boolean — whether detection should run
 */

// The old cdnjs URL 404s — face-api.js was removed from cdnjs. Each entry is a
// script and its matching weights; they have to come from the same build or the
// model files won't load. Tried in order, first one that works wins.
const FACE_API_SOURCES = [
  {
    name: 'jsdelivr / vladmandic',
    script: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.min.js',
    models: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model',
  },
  {
    name: 'jsdelivr / original 0.22.2',
    script: 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js',
    models: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights',
  },
  {
    name: 'unpkg / original 0.22.2',
    script: 'https://unpkg.com/face-api.js@0.22.2/dist/face-api.min.js',
    models: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights',
  },
]

const loadScript = (src) => new Promise((resolve, reject) => {
  const existing = document.querySelector(`script[src="${src}"]`)
  if (existing) {
    if (window.faceapi) return resolve()
    existing.addEventListener('load', resolve)
    existing.addEventListener('error', reject)
    return
  }
  const script = document.createElement('script')
  script.src = src
  script.async = true
  script.onload = resolve
  script.onerror = () => reject(new Error(`Failed to load ${src}`))
  document.head.appendChild(script)
})

// Walks the source list until one loads both the script and the models.
// Returns null if every source fails.
let faceApiPromise = null
const loadFaceApi = () => {
  if (faceApiPromise) return faceApiPromise

  faceApiPromise = (async () => {
    for (const source of FACE_API_SOURCES) {
      try {
        if (!window.faceapi) await loadScript(source.script)
        if (!window.faceapi) throw new Error('script loaded but faceapi missing')

        await Promise.all([
          window.faceapi.nets.tinyFaceDetector.loadFromUri(source.models),
          window.faceapi.nets.faceLandmark68Net.loadFromUri(source.models),
        ])
        return source
      } catch (err) {
        console.warn(`Proctoring: ${source.name} unavailable —`, err.message)
        // A half-loaded script would make the next attempt think it succeeded.
        if (window.faceapi && !window.faceapi.nets?.tinyFaceDetector?.isLoaded) {
          delete window.faceapi
        }
      }
    }
    return null
  })()

  return faceApiPromise
}

// Browser error names are useless to a student. Turn them into something
// they can act on.
const describeCameraError = (err) => {
  switch (err.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Camera permission was blocked. You can allow it in your browser settings and refresh.'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No camera was found on this device.'
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Another app or browser tab is using the camera. Close it and refresh to enable proctoring.'
    default:
      return 'The camera could not be started on this device.'
  }
}

const DETECTION_INTERVAL_MS = 2000
const VIOLATION_COOLDOWN_MS = 4000 // avoid spamming repeated violations for the same continuous issue
const LOOK_AWAY_YAW_THRESHOLD = 25 // degrees, approximate

const ProctoringCamera = ({ onViolation, onReady, onDenied, onCameraUnavailable, active = true }) => {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)
  const lastViolationRef = useRef({ no_face: 0, multiple_faces: 0, looking_away: 0 })
  const noFaceStreakRef = useRef(0)

  // initializing | loading_models | ready | degraded | no_camera
  const [status, setStatus] = useState('initializing')
  const [faceState, setFaceState] = useState('checking')
  const [minimized, setMinimized] = useState(false)
  const [cameraNote, setCameraNote] = useState('')

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
      // ── Camera first ──
      // Permission is the one thing that genuinely must work. Asking for it
      // before the CDN round-trip also means the prompt appears immediately
      // rather than after a long wait.
      let stream = null
      let cameraProblem = null

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 }, audio: false,
        })
      } catch (err) {
        console.warn('Proctoring camera unavailable:', err.name, err.message)
        cameraProblem = describeCameraError(err)
      }

      if (cancelled) {
        stream?.getTracks().forEach(t => t.stop())
        return
      }

      // ── NO CAMERA ──
      // Blocking here meant a desktop without a webcam, a broken camera, or a
      // camera held by another app locked the student out of every assessment.
      // Tab-switch and paste monitoring don't need a camera and still run, so
      // the attempt goes ahead — flagged, so the professor knows it wasn't
      // fully proctored.
      if (!stream) {
        setCameraNote(cameraProblem)
        setStatus('no_camera')
        setFaceState('no_camera')
        onCameraUnavailable?.(cameraProblem)
        onReady?.()
        return
      }

      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream

      // ── Then face detection ──
      setStatus('loading_models')
      const source = await loadFaceApi()
      if (cancelled) return

      if (source) {
        setStatus('ready')
      } else {
        // ── DEGRADED MODE ──
        // Every source failed. The camera still records and tab/paste
        // monitoring still works — only face detection is missing.
        //
        // The alternative is blocking the assessment entirely, which is what
        // the old version did: a dead CDN meant nobody could sit any test at
        // all. A missing anti-cheat signal is a smaller problem than an exam
        // nobody can take.
        console.warn('Proctoring: face detection unavailable, continuing without it.')
        setStatus('degraded')
        setFaceState('unavailable')
      }

      onReady?.()
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
    unavailable: { icon: faVideo, color: 'text-amber-400', spin: false, label: 'Recording only' },
    no_camera: { icon: faVideoSlash, color: 'text-amber-400', spin: false, label: 'No camera' },
  }
  const sc = stateConfig[faceState]

  // ── Loading state (full overlay, blocks assessment until ready) ───────────
  if (status === 'initializing' || status === 'loading_models') {
    return (
      <div className="fixed inset-0 z-[100] bg-[#060612]/98 backdrop-blur-sm flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <FontAwesomeIcon icon={faSpinner} className="text-blue-400 text-3xl animate-spin mb-4" />
          <p className="text-white font-semibold text-sm mb-1">
            {status === 'initializing' ? 'Starting proctoring camera...' : 'Loading face detection...'}
          </p>
          <p className="text-gray-500 text-xs">This may take a few seconds.</p>
        </div>
        <video ref={videoRef} autoPlay muted playsInline className="hidden" />
      </div>
    )
  }

  // ── No camera — a banner, not a wall ──────────────────────────────────────
  // The old version rendered a full-screen overlay here and called onDenied,
  // which navigated the student away. This tells them what's wrong and lets
  // them carry on.
  if (status === 'no_camera') {
    return (
      <div className="fixed bottom-5 left-5 z-40 max-w-xs">
        <div className="border border-amber-500/30 bg-[#0a0a18]/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center gap-2 mb-1.5">
            <FontAwesomeIcon icon={faVideoSlash} className="text-amber-400 text-sm" />
            <p className="text-amber-300 text-xs font-bold">Camera proctoring off</p>
          </div>
          <p className="text-gray-400 text-[11px] leading-relaxed mb-2">{cameraNote}</p>
          <p className="text-gray-500 text-[11px] leading-relaxed">
            You can still take this assessment. Tab switching and pasting are
            still monitored, and this attempt will be marked as unproctored.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-amber-400 hover:text-amber-300 text-[11px] font-semibold transition-colors"
          >
            Retry camera
          </button>
        </div>
      </div>
    )
  }

  // ── Ready — floating camera widget ─────────────────────────────────────────
  const degraded = status === 'degraded'

  return (
    <div className={`fixed bottom-5 left-5 z-40 transition-all ${minimized ? 'w-12 h-12' : 'w-44'}`}>
      <div className={`border bg-[#0a0a18]/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl ${
        degraded ? 'border-amber-500/30' : 'border-white/10'
      }`}>
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
              <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${
                faceState === 'ok' ? 'bg-emerald-400'
                  : faceState === 'checking' ? 'bg-gray-500'
                  : faceState === 'unavailable' ? 'bg-amber-400'
                  : 'bg-rose-400 animate-pulse'
              }`} />
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