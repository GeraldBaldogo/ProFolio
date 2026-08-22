import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faFolder, faRobot, faStar, faUser, faBars, faTimes,
  faTrophy, faRightFromBracket, faFileAlt, faSpinner, faDownload,
  faWandMagicSparkles, faClockRotateLeft, faCheck, faBriefcase,
  faGraduationCap, faCertificate, faCode, faComments, faClipboardList,
  faFingerprint, faLightbulb, faChartLine, faTriangleExclamation,
  faSeedling, faShieldHalved,
} from '@fortawesome/free-solid-svg-icons'
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons'
import { useAuth } from '../../context/AuthContext'
import { generateCV, getLatestCV, getCVHistory } from '../../services/cv.service'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

const navItems = [
  { label: 'Dashboard', icon: faHouse, path: '/student/dashboard' },
  { label: 'Assigned Tests', icon: faClipboardList, path: '/student/assigned-tests' },
  { label: 'Assessment', icon: faTrophy, path: '/student/assessment' },
  { label: 'My Results', icon: faChartLine, path: '/student/results' },
  { label: 'My Portfolio', icon: faFolder, path: '/student/portfolio' },
  { label: 'CV Builder', icon: faFileAlt, path: '/student/cv' },
  { label: 'AI Feedback', icon: faRobot, path: '/student/ai-feedback' },
  { label: 'Evaluation', icon: faStar, path: '/student/evaluation' },
  { label: 'Recommendations', icon: faLightbulb, path: '/student/recommendations' },
  { label: 'Originality Check', icon: faFingerprint, path: '/student/originality' },
  { label: 'Messages', icon: faComments, path: '/student/messages' },
  { label: 'Profile', icon: faUser, path: '/student/profile' },
]

const readinessLabel = {
  not_ready: 'Not yet ready',
  developing: 'Developing',
  ready: 'Ready',
  highly_ready: 'Highly ready',
}

export default function CVPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cv, setCv] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => { loadCV() }, [])

  const loadCV = async () => {
    setLoading(true)
    setError('')
    try {
      const [latest, hist] = await Promise.all([getLatestCV(), getCVHistory()])
      setCv(latest)
      setHistory(hist || [])
    } catch (err) {
      // A student with no CV yet and a broken connection are different
      // situations and shouldn't produce the same blank screen.
      setError(err.message || 'Couldn\u2019t load your CV.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const newCV = await generateCV()
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
  const c = cv?.cv_content
  const evidence = c?.internal_evidence

  return (
    <div className="min-h-screen bg-[#060612] flex font-sans">

      <style>{`
        @media print {
          /* Only the document itself should reach paper — no sidebar, no
             buttons, and none of the in-app evidence notes. */
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-area {
            position: static !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-area * {
            color: black !important;
            border-color: #ddd !important;
            background: transparent !important;
          }
          .print-section { break-inside: avoid; }
        }
      `}</style>

      {/* Sidebar */}
      <aside className={`no-print fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0a18] border-r border-white/5 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-blue-500/30 rounded-xl blur-md" />
            <img src={logo} alt="ProFolio" className="relative w-8 h-8 object-contain" />
          </div>
          <span className="text-lg font-black text-white tracking-tight">Pro<span className="text-blue-400">Folio</span></span>
          <button className="ml-auto lg:hidden text-gray-500 hover:text-white" onClick={() => setSidebarOpen(false)}>
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
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-blue-400 rounded-full" />}
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
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        <header className="no-print sticky top-0 z-30 bg-[#060612]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <FontAwesomeIcon icon={faBars} className="text-lg" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">CV Builder</h1>
            <p className="text-gray-500 text-xs">Written from what you&apos;ve actually been assessed on</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
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
                onClick={() => window.print()}
                className="flex items-center gap-2 border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] text-gray-400 hover:text-white text-sm font-medium px-3 py-2 rounded-xl transition-all"
              >
                <FontAwesomeIcon icon={faDownload} className="text-sm" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
            )}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            >
              <FontAwesomeIcon icon={generating ? faSpinner : faWandMagicSparkles} className={generating ? 'animate-spin' : ''} />
              {generating ? 'Writing...' : cv ? 'Regenerate' : 'Generate CV'}
            </button>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">

          {error && (
            <div className="no-print max-w-3xl mx-auto mb-6 border border-rose-500/20 bg-rose-500/5 rounded-2xl p-4 flex items-center gap-3">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 flex-shrink-0" />
              <p className="text-rose-400 text-sm">{error}</p>
            </div>
          )}

          {/* History dropdown */}
          {showHistory && history.length > 0 && (
            <div className="no-print max-w-3xl mx-auto mb-6 border border-white/8 bg-white/[0.03] rounded-2xl p-4">
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
                set — not from a form you fill in. Fill your portfolio and take a few
                assessments first, then generate.
              </p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-violet-500 text-white font-bold px-6 py-3 rounded-2xl disabled:opacity-50 transition-all"
              >
                <FontAwesomeIcon icon={generating ? faSpinner : faWandMagicSparkles} className={generating ? 'animate-spin' : ''} />
                {generating ? 'Writing your CV...' : 'Generate my CV'}
              </button>
            </div>

          ) : (
            <>
              {/* ── In-app note, never printed ──
                  The student should know what their CV was built from. An
                  employer shouldn't see the machinery. */}
              {evidence && (
                <div className="no-print max-w-3xl mx-auto mb-6 border border-white/8 bg-white/[0.03] rounded-2xl p-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Built from</p>
                  <span className="flex items-center gap-2 text-gray-400 text-xs">
                    <FontAwesomeIcon icon={faShieldHalved} className="text-blue-400" />
                    {evidence.graded_assessments} professor-set test{evidence.graded_assessments !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-2 text-gray-400 text-xs">
                    <FontAwesomeIcon icon={faStar} className={evidence.faculty_reviewed ? 'text-emerald-400' : 'text-gray-600'} />
                    {evidence.faculty_reviewed
                      ? `Reviewed${evidence.reviewed_by ? ` by ${evidence.reviewed_by}` : ''}`
                      : 'Not yet reviewed by faculty'}
                  </span>
                  {evidence.career_readiness && (
                    <span className="flex items-center gap-2 text-gray-400 text-xs">
                      <FontAwesomeIcon icon={faBriefcase} className="text-amber-400" />
                      {readinessLabel[evidence.career_readiness] || evidence.career_readiness}
                    </span>
                  )}
                  <span className="text-gray-600 text-xs ml-auto">Scores stay in the app — they aren&apos;t printed.</span>
                </div>
              )}

              {/* ── The document ── */}
              <div className="print-area max-w-3xl mx-auto bg-[#0a0a18] border border-white/8 rounded-2xl p-8 sm:p-10">

                {/* Header */}
                <div className="print-section border-b border-white/10 pb-6 mb-6">
                  <h1 className="text-white font-black text-3xl mb-1">{c?.header?.full_name}</h1>
                  <p className="text-blue-400 text-sm mb-3">
                    {c?.header?.course}{c?.header?.year_level ? ` · ${c.header.year_level}` : ''}
                  </p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-gray-400 text-xs">
                    {c?.header?.email && <span>{c.header.email}</span>}
                    {c?.header?.school && (
                      <span className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faGraduationCap} /> {c.header.school}
                      </span>
                    )}
                    {c?.header?.github_url && (
                      <span className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faGithub} /> {c.header.github_url}
                      </span>
                    )}
                    {c?.header?.linkedin_url && (
                      <span className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faLinkedin} /> {c.header.linkedin_url}
                      </span>
                    )}
                  </div>
                </div>

                {/* Professional summary */}
                {c?.professional_summary && (
                  <div className="print-section mb-7">
                    <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Profile</h2>
                    <p className="text-gray-300 text-sm leading-7">{c.professional_summary}</p>
                  </div>
                )}

                {/* Technical narrative */}
                {c?.technical_narrative && (
                  <div className="print-section mb-7">
                    <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Technical ability</h2>
                    <p className="text-gray-300 text-sm leading-7">{c.technical_narrative}</p>
                  </div>
                )}

                {/* Soft skills narrative */}
                {c?.soft_skills_narrative && (
                  <div className="print-section mb-7">
                    <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Working style and communication</h2>
                    <p className="text-gray-300 text-sm leading-7">{c.soft_skills_narrative}</p>
                  </div>
                )}

                {/* Verified competencies */}
                {c?.verified_competencies?.length > 0 && (
                  <div className="print-section mb-7">
                    <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-1">Demonstrated under supervision</h2>
                    <p className="text-gray-500 text-xs mb-3">Observed during timed, monitored assessments</p>
                    <ul className="flex flex-col gap-2">
                      {c.verified_competencies.map((v, i) => (
                        <li key={i} className="flex items-start gap-3 text-gray-300 text-sm leading-6">
                          <FontAwesomeIcon icon={faCheck} className="text-emerald-400 text-xs mt-1.5 flex-shrink-0" />
                          {v}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Projects */}
                {c?.projects?.length > 0 && (
                  <div className="print-section mb-7">
                    <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Projects</h2>
                    <div className="flex flex-col gap-4">
                      {c.projects.map((p, i) => (
                        <div key={i}>
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <p className="text-white font-semibold text-sm">{p.title}</p>
                            {p.tech_stack && <p className="text-blue-400 text-xs">{p.tech_stack}</p>}
                          </div>
                          {p.description && <p className="text-gray-400 text-sm leading-6 mt-1">{p.description}</p>}
                          <div className="flex gap-4 mt-1">
                            {p.github_url && <span className="text-gray-500 text-xs">{p.github_url}</span>}
                            {p.live_url && <span className="text-gray-500 text-xs">{p.live_url}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Self-reported skills — labelled honestly, so a reader can tell
                    these apart from the assessed claims above. */}
                {c?.self_reported_skills?.length > 0 && (
                  <div className="print-section mb-7">
                    <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-1">Additional skills</h2>
                    <p className="text-gray-500 text-xs mb-3">Self-reported</p>
                    <div className="flex flex-wrap gap-2">
                      {c.self_reported_skills.map((s, i) => (
                        <span key={i} className="text-gray-300 text-xs border border-white/10 px-3 py-1.5 rounded-full">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {c?.certifications?.length > 0 && (
                  <div className="print-section mb-7">
                    <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Certifications</h2>
                    <div className="flex flex-col gap-2">
                      {c.certifications.map((cert, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <FontAwesomeIcon icon={faCertificate} className="text-amber-400 text-xs mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-white text-sm">{cert.title}</p>
                            <p className="text-gray-500 text-xs">
                              {cert.issuer}
                              {cert.date_earned ? ` · ${new Date(cert.date_earned).getFullYear()}` : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Achievements */}
                {c?.achievements?.length > 0 && (
                  <div className="print-section mb-7">
                    <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Achievements</h2>
                    <div className="flex flex-col gap-2">
                      {c.achievements.map((a, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <FontAwesomeIcon icon={faTrophy} className="text-amber-400 text-xs mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-white text-sm">{a.title}</p>
                            {a.category && <p className="text-gray-500 text-xs">{a.category}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested roles */}
                {c?.suggested_roles?.length > 0 && (
                  <div className="print-section mb-7">
                    <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Suited to</h2>
                    <div className="flex flex-wrap gap-2">
                      {c.suggested_roles.map((r, i) => (
                        <span key={i} className="flex items-center gap-2 text-gray-300 text-xs border border-white/10 px-3 py-1.5 rounded-full">
                          <FontAwesomeIcon icon={faBriefcase} className="text-blue-400 text-[10px]" /> {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Growth areas — shown to the student, not printed. Honest with
                    themselves is useful; handing an employer a list of your own
                    weaknesses is not. */}
                {c?.growth_areas?.length > 0 && (
                  <div className="no-print border-t border-white/10 pt-6 mt-2">
                    <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                      <FontAwesomeIcon icon={faSeedling} className="text-emerald-400" /> Where to grow next
                    </h2>
                    <p className="text-gray-500 text-xs mb-3">For you — this section isn&apos;t printed</p>
                    <ul className="flex flex-col gap-2">
                      {c.growth_areas.map((g, i) => (
                        <li key={i} className="flex items-start gap-3 text-gray-400 text-sm leading-6">
                          <FontAwesomeIcon icon={faCode} className="text-gray-600 text-xs mt-1.5 flex-shrink-0" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

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