import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faFolder, faRobot, faStar, faUser, faBars, faTimes,
  faTrophy, faRightFromBracket, faFileAlt, faSpinner, faDownload,
  faWandMagicSparkles, faClockRotateLeft, faCheck, faBriefcase,
  faClipboardList, faFingerprint, faLightbulb, faChartLine, faComments,
  faTriangleExclamation, faSeedling, faShieldHalved, faArrowRight, faDumbbell,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import { generateCV, getLatestCV, getCVHistory } from '../../services/cv.service'
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

// One shared row shape for every bullet section, so the page reads as a single
// list rather than five differently-styled ones.
const Bullet = ({ children }) => (
  <li className="flex items-start gap-3 text-gray-300 text-[13px] leading-6">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
    <span>{children}</span>
  </li>
)

// Skills and Suited to are tags, not things with names and dates — so they get
// a shape of their own. Making them match each other matters more than making
// them match the bulleted sections; two sections that differ on purpose read
// better than one that looks forgotten.
const Chip = ({ children }) => (
  <span className="text-gray-300 text-[12px] border border-white/10 bg-white/[0.04] px-2.5 py-1 rounded-full">
    {children}
  </span>
)

const Section = ({ title, note, children }) => (
  <div className="print-section mb-5">
    <h2 className="text-white font-bold text-[11px] uppercase tracking-[0.14em] mb-0.5">{title}</h2>
    {note && <p className="text-gray-600 text-[10px] mb-2">{note}</p>}
    {!note && <div className="mb-2" />}
    {children}
  </div>
)

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
  const edu = c?.education

  return (
    <div className="min-h-screen bg-[#060612] flex font-sans">

      <style>{`
        @media print {
          /* One page means one page: nothing but the document reaches paper. */
          @page { margin: 14mm; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-area {
            position: static !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            font-size: 10.5pt;
          }
          .print-area * {
            color: black !important;
            border-color: #ccc !important;
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
            <p className="text-gray-500 text-xs">One page, written from what you&apos;ve been assessed on</p>
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
              {/* In-app note, never printed */}
              {evidence && (
                <div className="no-print max-w-2xl mx-auto mb-6 border border-white/8 bg-white/[0.03] rounded-2xl p-4 flex flex-wrap items-center gap-x-6 gap-y-2">
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

              {/* ── The document. Everything below fits one A4 page. ── */}
              <div className="print-area max-w-2xl mx-auto bg-[#0a0a18] border border-white/8 rounded-2xl px-8 py-7 sm:px-10 sm:py-9">

                {/* Header */}
                <div className="print-section border-b border-white/10 pb-4 mb-5">
                  <h1 className="text-white font-black text-2xl tracking-tight">{c?.header?.full_name}</h1>
                  {c?.header?.professional_title && (
                    <p className="text-blue-400 text-[13px] font-semibold mb-1.5">{c.header.professional_title}</p>
                  )}
                  {/* Contact details joined into one line — a stacked list of
                      five items is most of an inch of a one-page CV. */}
                  <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-gray-400 text-[11px]">
                    {[
                      c?.header?.email,
                      c?.header?.phone,
                      c?.header?.location,
                      c?.header?.github_url,
                      c?.header?.linkedin_url,
                      c?.header?.portfolio_url,
                    ].filter(Boolean).map((item, i) => (
                      <span key={i}>{i > 0 && <span className="text-gray-600 mr-2.5">·</span>}{item}</span>
                    ))}
                  </div>
                </div>

                {/* About me — the only prose on the page */}
                {c?.about_me && (
                  <Section title="About me">
                    <p className="text-gray-300 text-[13px] leading-6">{c.about_me}</p>
                  </Section>
                )}

                {/* The part no other CV can claim */}
                {c?.verified_competencies?.length > 0 && (
                  <Section title="Demonstrated under supervision" note="Observed during timed, monitored assessments set by faculty">
                    <ul className="flex flex-col gap-1">
                      {c.verified_competencies.map((v, i) => <Bullet key={i}>{v}</Bullet>)}
                    </ul>
                  </Section>
                )}

                {/* Education */}
                {(edu?.course || edu?.school) && (
                  <Section title="Education">
                    <ul className="flex flex-col gap-1">
                      <Bullet>
                        <span className="text-white font-semibold">{edu.course}</span>
                        {edu.specialization && <span className="text-gray-400"> — {edu.specialization}</span>}
                        {edu.school && <span className="text-gray-400"> · {edu.school}</span>}
                        {edu.year_level && <span className="text-gray-500"> · {edu.year_level}</span>}
                        {edu.expected_graduation && <span className="text-gray-500"> · Graduating {edu.expected_graduation}</span>}
                      </Bullet>
                      {edu.academic_honors && <Bullet>{edu.academic_honors}</Bullet>}
                    </ul>
                  </Section>
                )}

                {/* Work experience — sits above Projects, because a real job
                    outweighs coursework to anyone reading this. */}
                {c?.work_experience?.length > 0 && (
                  <Section title="Experience">
                    <ul className="flex flex-col gap-1">
                      {c.work_experience.map((e, i) => (
                        <Bullet key={i}>
                          <span className="text-white font-semibold">{e.role}</span>
                          {e.organisation && <span className="text-gray-400"> — {e.organisation}</span>}
                          {e.period && <span className="text-gray-500"> · {e.period}</span>}
                          {e.summary && <span className="text-gray-400 block text-[12px]">{e.summary}</span>}
                        </Bullet>
                      ))}
                    </ul>
                  </Section>
                )}

                {/* Projects — title and stack only, so four of them still fit */}
                {c?.projects?.length > 0 && (
                  <Section title="Projects">
                    <ul className="flex flex-col gap-1">
                      {c.projects.map((p, i) => (
                        <Bullet key={i}>
                          <span className="text-white font-semibold">{p.title}</span>
                          {p.tech_stack && <span className="text-gray-400"> — {p.tech_stack}</span>}
                          {p.github_url && <span className="text-gray-500 text-[11px]"> · {p.github_url}</span>}
                        </Bullet>
                      ))}
                    </ul>
                  </Section>
                )}

                {/* Skills — inline, not one bullet each, or this alone eats a
                    third of the page */}
                {c?.self_reported_skills?.length > 0 && (
                  <Section title="Skills" note="Self-reported">
                    <div className="flex flex-wrap gap-1.5">
                      {c.self_reported_skills.map((s, i) => <Chip key={i}>{s.name}</Chip>)}
                    </div>
                  </Section>
                )}

                {/* Certifications */}
                {c?.certifications?.length > 0 && (
                  <Section title="Certifications">
                    <ul className="flex flex-col gap-1">
                      {c.certifications.map((cert, i) => (
                        <Bullet key={i}>
                          <span className="text-white font-semibold">{cert.title}</span>
                          {cert.issuer && <span className="text-gray-400"> — {cert.issuer}</span>}
                          {cert.date_earned && <span className="text-gray-500"> · {new Date(cert.date_earned).getFullYear()}</span>}
                        </Bullet>
                      ))}
                    </ul>
                  </Section>
                )}

                {/* Achievements */}
                {c?.achievements?.length > 0 && (
                  <Section title="Achievements">
                    <ul className="flex flex-col gap-1">
                      {c.achievements.map((a, i) => (
                        <Bullet key={i}>
                          <span className="text-white font-semibold">{a.title}</span>
                          {a.category && <span className="text-gray-400"> — {a.category}</span>}
                        </Bullet>
                      ))}
                    </ul>
                  </Section>
                )}

                {/* Suited to */}
                {c?.suggested_roles?.length > 0 && (
                  <Section title="Suited to">
                    <div className="flex flex-wrap gap-1.5">
                      {c.suggested_roles.map((r, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-gray-300 text-[12px] border border-white/10 bg-white/[0.04] px-2.5 py-1 rounded-full">
                          <FontAwesomeIcon icon={faBriefcase} className="text-blue-400 text-[9px]" /> {r}
                        </span>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Growth areas — for the student, not for the page.
                    Handing an employer a list of your own weaknesses isn't a CV. */}
                {c?.growth_areas?.length > 0 && (
                  <div className="no-print border-t border-white/10 pt-5 mt-2">
                    <h2 className="text-white font-bold text-[11px] uppercase tracking-[0.14em] mb-0.5 flex items-center gap-2">
                      <FontAwesomeIcon icon={faSeedling} className="text-emerald-400" /> Where to grow next
                    </h2>
                    <p className="text-gray-600 text-[10px] mb-2">For you — this section isn&apos;t printed</p>
                    <ul className="flex flex-col gap-1">
                      {c.growth_areas.map((g, i) => <Bullet key={i}>{g}</Bullet>)}
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