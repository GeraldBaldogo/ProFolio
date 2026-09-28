import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faFolder, faRobot, faStar, faUser, faBars, faTimes,
  faTrophy, faRightFromBracket, faFileAlt, faSpinner, faDownload,
  faWandMagicSparkles, faClockRotateLeft, faCheck, faBriefcase,
  faClipboardList, faFingerprint, faLightbulb, faChartLine, faComments,
  faTriangleExclamation, faSeedling, faShieldHalved, faArrowRight, faDumbbell,
  faCamera, faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { generateCV, getLatestCV, getCVHistory, getCVSources } from '../../services/cv.service'
import { getProfilePhoto, uploadProfilePhoto, removeProfilePhoto } from '../../services/photo.service'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

const navItems = [
  { label: 'Dashboard', icon: faHouse, path: '/student/dashboard' },
  { label: 'Assigned Tests', icon: faClipboardList, path: '/student/assigned-tests' },
  { label: 'Practices', icon: faDumbbell, path: '/student/assessment' },
  { label: 'My Results', icon: faChartLine, path: '/student/results' },
  { label: 'My Portfolio', icon: faFolder, path: '/student/portfolio' },
  { label: 'CV Builder', icon: faFileAlt, path: '/student/cv' },
  { label: 'Recommendations', icon: faLightbulb, path: '/student/recommendations' },
  { label: 'Originality Check', icon: faFingerprint, path: '/student/originality' },
  { label: 'Assistant', icon: faWandMagicSparkles, path: '/student/assistant' },
  { label: 'Messages', icon: faComments, path: '/student/messages' },
  { label: 'Profile', icon: faUser, path: '/student/profile' },
]

const readinessLabel = {
  not_ready: 'Not yet ready',
  developing: 'Developing',
  ready: 'Ready',
  highly_ready: 'Highly ready',
}

// ── Document pieces ─────────────────────────────────────────────────────────
// Modelled on the Fresh Graduate template: one column, black on white, section
// titles in caps with a rule under them, dates flush right. Plain on purpose —
// applicant tracking systems read this layout reliably, and it prints the same
// on any printer.

const CVSection = ({ title, note, children }) => (
  <section className="cv-section">
    <h2 className="cv-h2">
      {title}
      {note && <span className="cv-h2-note">{note}</span>}
    </h2>
    {children}
  </section>
)

// One entry: the bold thing on the left, the date on the right, an optional
// second line under it, and optional bullets.
const Entry = ({ title, detail, date, sub, children }) => (
  <div className="cv-entry">
    <div className="cv-entry-row">
      <p className="cv-entry-main">
        <strong>{title}</strong>
        {detail && <span>{detail}</span>}
      </p>
      {date && <p className="cv-entry-date">{date}</p>}
    </div>
    {sub && <p className="cv-entry-sub">{sub}</p>}
    {children}
  </div>
)

const Bullets = ({ items }) => (
  <ul className="cv-bullets">
    {items.filter(Boolean).map((t, i) => <li key={i}>{t}</li>)}
  </ul>
)

// "https://github.com/juan" prints as "github.com/juan" — shorter, and nobody
// types the scheme off a sheet of paper anyway.
const cleanUrl = (u) => (u ? u.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '') : u)

// Everything the document needs, in one place. Namespaced under .cv- so the
// theme overrides in index.css (which restyle bg-white/*, text-gray-* and so
// on across the app) can't reach into the paper.
// Every size inside the paper is in em, and every gap is multiplied by
// --cv-gap. Changing --cv-scale and --cv-gap on the paper therefore resizes the
// whole CV in proportion — which is what the auto-fit below does.
const cvStyles = `
  .cv-frame { width: 100%; max-width: 210mm; margin: 0 auto; position: relative; }
  .cv-doc {
    --cv-scale: 1;
    --cv-gap: 1;
    width: 210mm;
    min-height: 297mm;
    padding: 14mm 16mm;
    box-sizing: border-box;
    background: #fff;
    color: #111;
    font-family: Calibri, Carlito, 'Segoe UI', Arial, Helvetica, sans-serif;
    font-size: calc(10.5pt * var(--cv-scale));
    line-height: calc(1.3 + (var(--cv-gap) - 1) * 0.08);
    box-shadow: 0 10px 40px rgba(0,0,0,.35);
    border-radius: 4px;
    transform-origin: top left;
  }
  .cv-doc * { color: inherit; }
  .cv-doc p, .cv-doc h1, .cv-doc h2, .cv-doc ul { margin: 0; }

  .cv-header { text-align: center; margin-bottom: calc(0.9em * var(--cv-gap)); }
  .cv-header.has-photo {
    display: flex; align-items: center; gap: 1.6em; text-align: left;
  }
  .cv-header-text { flex: 1; min-width: 0; }
  .cv-photo {
    /* 2x2 ID-photo proportions */
    width: calc(1.9in * var(--cv-scale)); height: calc(1.9in * var(--cv-scale));
    max-width: 2in; max-height: 2in;
    object-fit: cover; flex-shrink: 0;
    border: 1px solid #111;
  }
  .cv-name { font-size: 2.1em; font-weight: 700; letter-spacing: .02em; text-transform: uppercase; line-height: 1.1; }
  .cv-title { font-size: 1.1em; margin-top: .2em !important; }
  .cv-contact { font-size: .9em; margin-top: .45em !important; word-break: break-word; }
  .cv-contact .sep { margin: 0 .6em; color: #666; }
  .has-photo .cv-contact span { display: block; }
  .has-photo .cv-contact .sep { display: none; }

  .cv-section { margin-top: calc(1.05em * var(--cv-gap)); }
  .cv-h2 {
    font-size: 1.05em; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
    border-bottom: 1px solid #111; padding-bottom: .2em;
    margin-bottom: calc(.45em * var(--cv-gap)) !important;
    display: flex; align-items: baseline; gap: .75em;
  }
  .cv-h2-note { font-size: .78em; font-weight: 400; font-style: italic; text-transform: none; letter-spacing: 0; color: #555 !important; }

  .cv-entry + .cv-entry { margin-top: calc(.55em * var(--cv-gap)); }
  .cv-entry-row { display: flex; justify-content: space-between; align-items: baseline; gap: 1.2em; }
  .cv-entry-main strong { font-weight: 700; }
  .cv-entry-main span::before { content: ' \u2014 '; }
  .cv-entry-date { white-space: nowrap; font-size: .95em; }
  .cv-entry-sub { font-style: italic; }
  .cv-entry-link { font-size: .9em; color: #333 !important; }

  .cv-bullets { padding-left: 1.5em; margin-top: calc(.2em * var(--cv-gap)) !important; list-style: disc; }
  .cv-bullets li { padding-left: .2em; }
  .cv-bullets li + li { margin-top: calc(.12em * var(--cv-gap)); }
  .cv-para { text-align: justify; }
  .cv-inline strong { font-weight: 700; }

  /* ── Print ──────────────────────────────────────────────────────────────
     margin: 0 on @page leaves the browser no room for its own header and
     footer, so the date, page title, localhost URL and "1/1" are gone
     without anyone touching the print dialog. The paper's own padding is
     the white margin instead. */
  @page { size: A4; margin: 0; }
  @media print {
    html, body { background: #fff !important; }
    .no-print { display: none !important; }
    .cv-shell.cv-shell, .cv-main.cv-main {
      display: block !important; margin: 0 !important; padding: 0 !important;
      min-height: 0 !important; background: #fff !important;
    }
    .cv-frame { max-width: none; height: auto !important; margin: 0; }
    .cv-doc {
      /* min-height of exactly 297mm can round up and push out a blank second
         page; the auto-fit already guarantees the content fits in one. */
      min-height: 0; height: 296mm; overflow: hidden;
      transform: none !important; box-shadow: none; border-radius: 0;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
  }
`

// ── Choose what goes on the CV ──────────────────────────────────────────────
// Shown before every generate. Everything starts ticked except what the
// student left out last time; new portfolio items start ticked.

const SOURCE_GROUPS = [
  { key: 'projects', title: 'Projects' },
  { key: 'skills', title: 'Skills' },
  { key: 'certifications', title: 'Certifications' },
  { key: 'experiences', title: 'Experience' },
  { key: 'achievements', title: 'Achievements' },
]

const Tick = ({ on }) => (
  <span className={`w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center flex-shrink-0 transition-colors ${
    on ? 'bg-blue-500 border-blue-500' : 'border-white/20 bg-transparent'
  }`}>
    {on && <FontAwesomeIcon icon={faCheck} className="text-white text-[10px]" />}
  </span>
)

function ChooseSourcesModal({ open, previousExcluded, onCancel, onGenerate }) {
  const [sources, setSources] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [excluded, setExcluded] = useState({})

  useEffect(() => {
    if (!open) return
    let alive = true
    setSources(null)
    setLoadError('')
    getCVSources()
      .then((data) => {
        if (!alive) return
        setSources(data)
        // Carry over last time's choices, but only for items that still exist.
        const start = {}
        for (const { key } of SOURCE_GROUPS) {
          const ids = new Set((data[key] || []).map((i) => i.id))
          start[key] = (previousExcluded?.[key] || []).map(String).filter((id) => ids.has(id))
        }
        setExcluded(start)
      })
      .catch((err) => alive && setLoadError(err.message || 'Couldn\u2019t load your portfolio.'))
    return () => { alive = false }
  }, [open, previousExcluded])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  const isOn = (key, id) => !(excluded[key] || []).includes(id)
  const toggle = (key, id) => setExcluded((ex) => {
    const list = ex[key] || []
    return { ...ex, [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] }
  })
  const setAll = (key, on) => setExcluded((ex) => ({
    ...ex, [key]: on ? [] : (sources?.[key] || []).map((i) => i.id),
  }))

  const total = sources ? SOURCE_GROUPS.reduce((n, g) => n + (sources[g.key]?.length || 0), 0) : 0
  const chosen = sources ? SOURCE_GROUPS.reduce((n, g) => n + (sources[g.key] || []).filter((i) => isOn(g.key, i.id)).length, 0) : 0
  const emptyGroups = sources ? SOURCE_GROUPS.filter((g) => !(sources[g.key]?.length)) : []

  return (
    <div className="no-print fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-6" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="choose-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[88vh] flex flex-col bg-[#0a0a18] border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl"
      >
        <div className="px-5 pt-5 pb-4 border-b border-white/5">
          <h2 id="choose-title" className="text-white font-bold text-lg">What should go on your CV?</h2>
          <p className="text-gray-400 text-sm mt-1 leading-relaxed">
            Everything from your portfolio is ticked. Untick anything you&apos;d rather leave off this version.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loadError ? (
            <p className="text-rose-400 text-sm">{loadError}</p>
          ) : !sources ? (
            <div className="flex justify-center py-10">
              <FontAwesomeIcon icon={faSpinner} className="text-blue-400 text-2xl animate-spin" />
            </div>
          ) : total === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-300 text-sm font-semibold">Your portfolio is empty</p>
              <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                You can still generate — the CV will have your profile and assessed work only.
                Add projects, skills and certifications first for a fuller page.
              </p>
              <Link to="/student/portfolio" className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs font-semibold mt-3">
                Open My Portfolio <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {SOURCE_GROUPS.filter((g) => sources[g.key]?.length).map((g) => {
                const items = sources[g.key]
                const onCount = items.filter((i) => isOn(g.key, i.id)).length
                return (
                  <div key={g.key}>
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="text-white text-sm font-semibold">
                        {g.title} <span className="text-gray-500 font-normal">· {onCount} of {items.length}</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setAll(g.key, onCount < items.length)}
                        className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                      >
                        {onCount < items.length ? 'Tick all' : 'Untick all'}
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      {items.map((item) => {
                        const on = isOn(g.key, item.id)
                        return (
                          <button
                            key={item.id}
                            type="button"
                            role="checkbox"
                            aria-checked={on}
                            onClick={() => toggle(g.key, item.id)}
                            className={`flex items-center gap-3 text-left px-3 py-2.5 rounded-xl border transition-colors ${
                              on ? 'border-white/10 bg-white/[0.04]' : 'border-transparent hover:bg-white/[0.03]'
                            }`}
                          >
                            <Tick on={on} />
                            <span className="min-w-0">
                              <span className={`block text-sm truncate ${on ? 'text-white' : 'text-gray-500 line-through decoration-gray-600'}`}>
                                {item.label || 'Untitled'}
                              </span>
                              {item.detail && <span className="block text-gray-500 text-xs truncate">{item.detail}</span>}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {emptyGroups.length > 0 && (
                <p className="text-gray-500 text-xs leading-relaxed">
                  Nothing yet under {emptyGroups.map((g) => g.title).join(', ')}.{' '}
                  <Link to="/student/portfolio" className="text-blue-400 hover:text-blue-300 font-medium">Add in My Portfolio</Link>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/5 flex items-center gap-3">
          <p className="text-gray-500 text-xs mr-auto">
            {sources && total > 0 ? `${chosen} of ${total} items` : ''}
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!sources && !loadError}
            onClick={() => onGenerate(excluded)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
          >
            <FontAwesomeIcon icon={faWandMagicSparkles} /> Generate CV
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Auto-fit ────────────────────────────────────────────────────────────────
// The CV is always exactly one A4 page, and should look like one: a thin CV
// floating in the top third of the sheet reads as unfinished. So after every
// render the text size and the spacing are adjusted until the content fills
// most of the page without spilling onto a second.
const MM = 96 / 25.4                         // CSS px per mm
const CONTENT_H = (297 - 14 * 2) * MM        // A4 height minus top/bottom padding
const FILL_MAX = 0.96                        // leave a sliver: print rounding differs from screen
const FILL_MIN = 0.85
const SCALE = [0.78, 1.22]                   // ≈ 8.2pt to 12.8pt body text
const GAP = [0.45, 2.4]

const fitToPage = (doc, content) => {
  const measure = (scale, gap) => {
    doc.style.setProperty('--cv-scale', scale)
    doc.style.setProperty('--cv-gap', gap)
    return content.offsetHeight
  }
  // Largest value in [lo, hi] for which measure stays under the limit.
  const largest = (lo, hi, fn, limit) => {
    if (fn(lo) > limit) return lo
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2
      if (fn(mid) <= limit) lo = mid; else hi = mid
    }
    return lo
  }
  const limit = CONTENT_H * FILL_MAX

  // 1. Text size first, at normal spacing.
  let gap = 1
  let scale = largest(SCALE[0], SCALE[1], (s) => measure(s, gap), limit)

  // 2. Still short at the biggest sensible text? Open up the spacing.
  if (measure(scale, gap) < CONTENT_H * FILL_MIN) {
    gap = largest(1, GAP[1], (g) => measure(scale, g), limit)
  }
  // 3. Still too long at the smallest text? Tighten the spacing.
  if (measure(scale, gap) > limit) {
    gap = largest(GAP[0], 1, (g) => measure(scale, g), limit)
  }

  const height = measure(scale, gap)
  return { fill: height / CONTENT_H, overflow: height > CONTENT_H }
}

export default function CVPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { totalUnread } = useNotifications()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cv, setCv] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [choosing, setChoosing] = useState(false)

  // The photo belongs to the profile, not to a CV version — so changing it
  // shows on every version straight away, with no need to regenerate.
  const [photo, setPhoto] = useState(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const photoInput = useRef(null)

  const frameRef = useRef(null)
  const docRef = useRef(null)
  const contentRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [fit, setFit] = useState(null)
  const [docHeight, setDocHeight] = useState(297 * MM)

  useEffect(() => { loadCV() }, [])

  const loadCV = async () => {
    setLoading(true)
    setError('')
    try {
      const [latest, hist, pic] = await Promise.all([
        getLatestCV(),
        getCVHistory(),
        getProfilePhoto().catch(() => null), // a missing photo shouldn't block the CV
      ])
      setCv(latest)
      setHistory(hist || [])
      setPhoto(pic)
    } catch (err) {
      setError(err.message || 'Couldn\u2019t load your CV.')
    } finally {
      setLoading(false)
    }
  }

  const openChooser = () => { setError(''); setChoosing(true) }
  const closeChooser = useCallback(() => setChoosing(false), [])

  const handleGenerate = async (exclude) => {
    setChoosing(false)
    setGenerating(true)
    setError('')
    try {
      const newCV = await generateCV(exclude)
      setCv(newCV)
      const hist = await getCVHistory()
      setHistory(hist || [])
    } catch (err) {
      setError(err.message || 'Failed to generate CV.')
    } finally {
      setGenerating(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoBusy(true)
    try {
      setPhoto(await uploadProfilePhoto(file))
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setPhotoBusy(false)
    }
  }

  const removePhoto = async () => {
    setPhotoBusy(true)
    try {
      await removeProfilePhoto()
      setPhoto(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setPhotoBusy(false)
    }
  }

  // Refit whenever what's on the page changes.
  const refit = useCallback(() => {
    if (!docRef.current || !contentRef.current) return
    setFit(fitToPage(docRef.current, contentRef.current))
    setDocHeight(docRef.current.offsetHeight)
  }, [])

  useLayoutEffect(() => {
    refit()
    // Once the real fonts arrive, line breaks shift — measure again.
    document.fonts?.ready.then(refit)
  }, [cv, photo, refit])

  // The paper is always A4-wide; on a narrow screen it's shown scaled down
  // rather than reflowed, so what you see is what prints.
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const update = () => setZoom(Math.min(1, frame.clientWidth / (210 * MM)))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(frame)
    return () => ro.disconnect()
  }, [cv])

  // The browser uses document.title as the PDF's file name. "ProFolio.pdf" is
  // useless in a Downloads folder; "Juan Dela Cruz - CV.pdf" isn't.
  const handlePrint = () => {
    const previous = document.title
    const name = cv?.cv_content?.header?.full_name
    if (name) document.title = `${name} - CV`
    const restore = () => {
      document.title = previous
      window.removeEventListener('afterprint', restore)
    }
    window.addEventListener('afterprint', restore)
    window.print()
  }
  const c = cv?.cv_content
  const evidence = c?.internal_evidence
  const edu = c?.education

  const contact = [
    c?.header?.email,
    c?.header?.phone,
    c?.header?.location,
    cleanUrl(c?.header?.github_url),
    cleanUrl(c?.header?.linkedin_url),
    cleanUrl(c?.header?.portfolio_url),
  ].filter(Boolean)

  const missing = c ? [
    !(edu?.course || edu?.school) && 'Education',
    !(c.projects?.length) && 'Projects',
    !(c.self_reported_skills?.length) && 'Skills',
    !(c.certifications?.length) && 'Certifications',
  ].filter(Boolean) : []

  return (
    <div className="cv-shell min-h-screen bg-[#060612] flex font-sans">

      <style>{cvStyles}</style>

      <ChooseSourcesModal
        open={choosing}
        previousExcluded={cv?.cv_content?.excluded}
        onCancel={closeChooser}
        onGenerate={handleGenerate}
      />

      {/* Sidebar */}
      <aside className={`no-print fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0a18] border-r border-white/5 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-blue-500/30 rounded-xl blur-md" />
            <img src={logo} alt="ProFolio" className="relative w-8 h-8 object-contain" />
          </div>
          <span className="text-lg font-black text-white tracking-tight">Pro<span className="text-blue-400">Folio</span></span>
          <button className="ml-auto lg:hidden text-gray-500 hover:text-white" aria-label="Close menu" onClick={() => setSidebarOpen(false)}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.full_name}</p>
              <p className="text-gray-500 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-blue-500/15 text-white border border-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <FontAwesomeIcon icon={item.icon} className={`text-sm ${isActive ? 'text-blue-400' : ''}`} />
                {item.label}
                {item.path === '/student/messages' && totalUnread > 0 ? (
                  <span className="ml-auto text-[10px] font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded-full">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                ) : isActive ? (
                  <div className="ml-auto w-1.5 h-1.5 bg-blue-400 rounded-full" />
                ) : null}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
            <FontAwesomeIcon icon={faRightFromBracket} className="text-sm" /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="no-print fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="cv-main flex-1 min-w-0 lg:ml-64 flex flex-col min-h-screen">

        <header className="no-print sticky top-0 z-30 bg-[#060612]/90 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          <button className="lg:hidden text-gray-400 hover:text-white" aria-label="Open menu" onClick={() => setSidebarOpen(true)}>
            <FontAwesomeIcon icon={faBars} className="text-lg" />
          </button>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-base sm:text-lg truncate">CV Builder</h1>
            <p className="text-gray-500 text-xs truncate">One page, written from what you&apos;ve been assessed on</p>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {history.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] text-gray-400 hover:text-white text-sm font-medium px-3 py-2 rounded-xl transition-all"
              >
                <FontAwesomeIcon icon={faClockRotateLeft} className="text-sm" />
                <span className="hidden sm:inline">History ({history.length})</span>
              </button>
            )}
            {cv && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] text-gray-400 hover:text-white text-sm font-medium px-3 py-2 rounded-xl transition-all"
              >
                <FontAwesomeIcon icon={faDownload} className="text-sm" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
            )}
            <button
              onClick={openChooser}
              disabled={generating}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            >
              <FontAwesomeIcon icon={generating ? faSpinner : faWandMagicSparkles} className={generating ? 'animate-spin' : ''} />
              {generating ? 'Writing...' : cv ? 'Regenerate' : 'Generate CV'}
            </button>
          </div>
        </header>

        <main className="cv-main flex-1 px-4 sm:px-6 py-6 sm:py-8">

          {error && (
            <div className="no-print max-w-2xl mx-auto mb-6 border border-rose-500/20 bg-rose-500/5 rounded-2xl p-4 flex items-center gap-3">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 flex-shrink-0" />
              <p className="text-rose-400 text-sm">{error}</p>
            </div>
          )}

          {showHistory && history.length > 0 && (
            <div className="no-print max-w-2xl mx-auto mb-6 border border-white/8 bg-white/[0.03] rounded-2xl p-4">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Previous versions</p>
              <div className="flex flex-col gap-2">
                {history.map((h, i) => (
                  <button
                    key={h.id}
                    onClick={() => { setCv(h); setShowHistory(false) }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      cv?.id === h.id ? 'border-blue-500/30 bg-blue-500/10' : 'border-white/8 hover:bg-white/5'
                    }`}
                  >
                    <FontAwesomeIcon icon={faFileAlt} className="text-blue-400 text-sm" />
                    <div className="flex-1">
                      <p className="text-white text-sm">Version {history.length - i}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(h.generated_at).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {cv?.id === h.id && <FontAwesomeIcon icon={faCheck} className="text-blue-400 text-sm" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <FontAwesomeIcon icon={faSpinner} className="text-blue-400 text-3xl animate-spin" />
            </div>

          ) : !cv ? (
            <div className="no-print max-w-md mx-auto text-center py-16">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faFileAlt} className="text-white text-2xl" />
              </div>
              <h2 className="text-white font-bold text-xl mb-2">No CV yet</h2>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Your CV is written from your portfolio and from the tests your professor
                set for you. Fill in your portfolio, then generate.
              </p>

              <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-4 mb-6 text-left flex items-start gap-3">
                <FontAwesomeIcon icon={faShieldHalved} className="text-blue-400 text-sm mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 text-xs font-semibold mb-1">You need at least one assigned test</p>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    Practice attempts are for rehearsing — they don&apos;t appear on your CV.
                    Only work your professor set and timed counts as evidence.
                  </p>
                  <Link to="/student/assigned-tests"
                    className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs font-semibold mt-2 transition-colors">
                    See your assigned tests <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
                  </Link>
                </div>
              </div>

              <button
                onClick={openChooser}
                disabled={generating}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-violet-500 text-white font-bold px-6 py-3 rounded-2xl disabled:opacity-50 transition-all"
              >
                <FontAwesomeIcon icon={generating ? faSpinner : faWandMagicSparkles} className={generating ? 'animate-spin' : ''} />
                {generating ? 'Writing your CV...' : 'Generate my CV'}
              </button>
            </div>

          ) : (
            <>
              {/* In-app note, never printed */}
              {evidence && (
                <div className="no-print max-w-[210mm] mx-auto mb-6 border border-white/8 bg-white/[0.03] rounded-2xl p-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Built from</p>
                  <span className="flex items-center gap-2 text-gray-400 text-xs">
                    <FontAwesomeIcon icon={faShieldHalved} className="text-blue-400" />
                    {evidence.graded_assessments} professor-set test{evidence.graded_assessments !== 1 ? 's' : ''}
                  </span>
                  {evidence.career_readiness && (
                    <span className="flex items-center gap-2 text-gray-400 text-xs">
                      <FontAwesomeIcon icon={faBriefcase} className="text-amber-400" />
                      {readinessLabel[evidence.career_readiness] || evidence.career_readiness}
                    </span>
                  )}
                  <span className="text-gray-600 text-xs ml-auto">Professor-set work only · scores aren&apos;t printed</span>
                </div>
              )}

              {/* What's missing — shown in the app, never printed. A sparse CV is
                  almost always an unfilled portfolio, not a bad layout. */}
              {missing.length > 0 && (
                <div className="no-print max-w-[210mm] mx-auto mb-6 border border-amber-500/20 bg-amber-500/5 rounded-2xl p-4 flex items-start gap-3">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-amber-300 text-sm font-semibold">
                      Your CV is missing: {missing.join(', ')}
                    </p>
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                      These come from your portfolio. Add them there, then press Regenerate.
                    </p>
                    <Link to="/student/portfolio"
                      className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs font-semibold mt-2 transition-colors">
                      Open My Portfolio <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Photo controls — in the app only */}
              <div className="no-print max-w-[210mm] mx-auto mb-3 flex flex-wrap items-center gap-2">
                <input ref={photoInput} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                <button
                  onClick={() => photoInput.current?.click()}
                  disabled={photoBusy}
                  className="disabled:opacity-50 flex items-center gap-2 border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] text-gray-300 hover:text-white text-sm font-medium px-3 py-2 rounded-xl transition-all"
                >
                  <FontAwesomeIcon icon={photoBusy ? faSpinner : faCamera} className={`text-sm ${photoBusy ? 'animate-spin' : ''}`} />
                  {photo ? 'Change photo' : 'Add photo'}
                </button>
                {photo && (
                  <button
                    onClick={removePhoto}
                    disabled={photoBusy}
                    className="disabled:opacity-50 flex items-center gap-2 text-gray-500 hover:text-rose-400 text-sm font-medium px-3 py-2 rounded-xl transition-all"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-sm" /> Remove
                  </button>
                )}
                <span className="text-gray-600 text-xs">
                  {photo ? 'Same photo as your profile' : 'Optional · a 2x2 with a plain background works best'}
                </span>
                {fit && (
                  <span className={`ml-auto text-xs ${fit.overflow ? 'text-rose-400' : 'text-gray-500'}`}>
                    {fit.overflow
                      ? 'Too long for one page \u2014 shorten your portfolio entries'
                      : `One page \u00b7 ${Math.round(Math.min(fit.fill, 1) * 100)}% filled`}
                  </span>
                )}
              </div>

              {/* ── The document. One A4 page, same on screen as on paper. ── */}
              <div
                ref={frameRef}
                className="cv-frame"
                style={{ height: docHeight * zoom }}
              >
              <article ref={docRef} className="cv-doc" style={{ transform: zoom < 1 ? `scale(${zoom})` : undefined }}>
              <div ref={contentRef}>

                <header className={`cv-header${photo ? ' has-photo' : ''}`}>
                  <div className="cv-header-text">
                    <h1 className="cv-name">{c?.header?.full_name}</h1>
                    {c?.header?.professional_title && (
                      <p className="cv-title">{c.header.professional_title}</p>
                    )}
                    <p className="cv-contact">
                      {contact.map((item, i) => (
                        <span key={i}>{i > 0 && <span className="sep">|</span>}{item}</span>
                      ))}
                    </p>
                  </div>
                  {photo && <img src={photo} alt="" className="cv-photo" onLoad={refit} />}
                </header>

                {c?.about_me && (
                  <CVSection title="Career Objective">
                    <p className="cv-para">{c.about_me}</p>
                  </CVSection>
                )}

                {/* Education comes early: for a fresh graduate it's the
                    strongest fact on the page. */}
                {(edu?.course || edu?.school) && (
                  <CVSection title="Education">
                    <Entry
                      title={edu.course}
                      detail={edu.specialization}
                      date={edu.expected_graduation ? `Expected ${edu.expected_graduation}` : edu.year_level}
                      sub={[edu.school, edu.expected_graduation && edu.year_level].filter(Boolean).join(' \u00b7 ')}
                    >
                      {edu.academic_honors && <Bullets items={[edu.academic_honors]} />}
                    </Entry>
                  </CVSection>
                )}

                {/* Awarded by a professor's assessment, not claimed by the
                    student — the line no other CV can have. */}
                {(c?.verified_titles?.length > 0 || c?.verified_competencies?.length > 0) && (
                  <CVSection title="Verified Competencies" note="Demonstrated in timed, supervised assessments set by faculty">
                    {c?.verified_titles?.length > 0 && (
                      <Bullets items={c.verified_titles.map((t, i) => (
                        <span key={i} className="cv-inline"><strong>{t.label}</strong>{t.area ? ` \u2014 ${t.area}` : ''}</span>
                      ))} />
                    )}
                    {c?.verified_competencies?.length > 0 && <Bullets items={c.verified_competencies} />}
                  </CVSection>
                )}

                {c?.self_reported_skills?.length > 0 && (
                  <CVSection title="Skills">
                    <p>{c.self_reported_skills.map((s) => s.name).filter(Boolean).join(', ')}</p>
                  </CVSection>
                )}

                {c?.projects?.length > 0 && (
                  <CVSection title="Projects">
                    {c.projects.map((p, i) => (
                      <Entry key={i} title={p.title} detail={p.tech_stack}>
                        {p.github_url && <p className="cv-entry-link">{cleanUrl(p.github_url)}</p>}
                      </Entry>
                    ))}
                  </CVSection>
                )}

                {c?.work_experience?.length > 0 && (
                  <CVSection title="Experience">
                    {c.work_experience.map((e, i) => (
                      <Entry key={i} title={e.role} detail={e.organisation} date={e.period}>
                        {e.summary && <Bullets items={[e.summary]} />}
                      </Entry>
                    ))}
                  </CVSection>
                )}

                {c?.certifications?.length > 0 && (
                  <CVSection title="Certifications">
                    {c.certifications.map((cert, i) => (
                      <Entry
                        key={i}
                        title={cert.title}
                        detail={cert.issuer}
                        date={cert.date_earned ? new Date(cert.date_earned).getFullYear() : null}
                      />
                    ))}
                  </CVSection>
                )}

                {c?.achievements?.length > 0 && (
                  <CVSection title="Achievements">
                    <Bullets items={c.achievements.map((a, i) => (
                      <span key={i} className="cv-inline"><strong>{a.title}</strong>{a.category ? ` \u2014 ${a.category}` : ''}</span>
                    ))} />
                  </CVSection>
                )}

                {c?.suggested_roles?.length > 0 && (
                  <CVSection title="Target Roles">
                    <p>{c.suggested_roles.join(', ')}</p>
                  </CVSection>
                )}
              </div>
              </article>
              </div>

              {/* Growth areas — for the student, not for the page. Handing an
                  employer a list of your own weaknesses isn't a CV. */}
              {c?.growth_areas?.length > 0 && (
                <div className="no-print max-w-[210mm] mx-auto mt-6 border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                  <h2 className="text-white font-bold text-sm mb-0.5 flex items-center gap-2">
                    <FontAwesomeIcon icon={faSeedling} className="text-emerald-400" /> Where to grow next
                  </h2>
                  <p className="text-gray-500 text-xs mb-3">Only you see this — it isn&apos;t printed</p>
                  <ul className="flex flex-col gap-1.5">
                    {c.growth_areas.map((g, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-300 text-[13px] leading-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="no-print text-center text-gray-600 text-xs mt-4">
                Generated {new Date(cv.generated_at).toLocaleString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
                })}
              </p>
            </>
          )}
        </main>
      </div>
    </div>
  )
}