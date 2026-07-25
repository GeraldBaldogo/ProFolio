import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHouse, faFolder, faRobot, faStar, faUser, faBars, faTimes,
  faTrophy, faRightFromBracket, faSpinner, faFileLines, faBolt,
  faRotateRight, faPrint, faDownload, faTriangleExclamation,
  faCircleCheck, faEnvelope, faPhone, faLocationDot, faLink,
  faBriefcase, faGraduationCap, faCode, faCertificate, faMedal,
  faChartBar, faCheck, faComments, faFileAlt, faFingerprint, faLightbulb,
} from '@fortawesome/free-solid-svg-icons'
import { faLinkedin as faLinkedinBrand, faGithub as faGithubBrand } from '@fortawesome/free-brands-svg-icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

const navItems = [
  { label: 'Dashboard', icon: faHouse, path: '/student/dashboard' },
  { label: 'My Portfolio', icon: faFolder, path: '/student/portfolio' },
  { label: 'AI Feedback', icon: faRobot, path: '/student/ai-feedback' },
  { label: 'Evaluation', icon: faStar, path: '/student/evaluation' },
  { label: 'Assessment', icon: faTrophy, path: '/student/assessment' },
  { label: 'Messages', icon: faComments, path: '/student/messages' },
  { label: 'CV Builder', icon: faFileAlt, path: '/student/cv' },
  { label: 'Originality Check', icon: faFingerprint, path: '/student/originality' },
  { label: 'Recommendations', icon: faLightbulb, path: '/student/recommendations' },
  { label: 'Profile', icon: faUser, path: '/student/profile' },
]

const LEVEL_COLOR = {
  Expert: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  Advanced: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Intermediate: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Beginner: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

const VALIDATED_COLOR = {
  Assessment: 'text-amber-400',
  'AI Evaluation': 'text-violet-400',
  Portfolio: 'text-blue-400',
  Certification: 'text-emerald-400',
}

// ── CV Print Preview (white background, printer-friendly) ──────────────────
const CVPreview = ({ cv }) => {
  const p = cv.personal_info || {}
  const perf = cv.performance_indicators || {}

  return (
    <div id="cv-print-area" className="bg-white text-gray-900 font-sans w-full max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl">

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-8">
        <h1 className="text-white font-black text-3xl tracking-tight mb-1">{p.full_name || '—'}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
          {p.email && (
            <span className="flex items-center gap-1.5 text-slate-300 text-xs">
              <FontAwesomeIcon icon={faEnvelope} className="text-slate-400 text-[10px]" /> {p.email}
            </span>
          )}
          {p.phone && (
            <span className="flex items-center gap-1.5 text-slate-300 text-xs">
              <FontAwesomeIcon icon={faPhone} className="text-slate-400 text-[10px]" /> {p.phone}
            </span>
          )}
          {p.location && (
            <span className="flex items-center gap-1.5 text-slate-300 text-xs">
              <FontAwesomeIcon icon={faLocationDot} className="text-slate-400 text-[10px]" /> {p.location}
            </span>
          )}
          {p.linkedin && (
            <a href={p.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-300 text-xs hover:text-blue-200">
              <FontAwesomeIcon icon={faLink} className="text-[10px]" /> LinkedIn
            </a>
          )}
          {p.github && (
            <a href={p.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-slate-300 text-xs hover:text-white">
              <FontAwesomeIcon icon={faLink} className="text-[10px]" /> GitHub
            </a>
          )}
        </div>
      </div>

      <div className="px-8 py-6 flex flex-col gap-6">

        {/* Professional Summary */}
        {cv.professional_summary && (
          <section>
            <h2 className="text-slate-800 font-black text-xs uppercase tracking-widest mb-2 pb-1 border-b-2 border-slate-200">Professional Summary</h2>
            <p className="text-gray-700 text-sm leading-relaxed">{cv.professional_summary}</p>
          </section>
        )}

        {/* Performance Indicators */}
        {perf && Object.values(perf).some(v => v && v !== 'Not assessed') && (
          <section>
            <h2 className="text-slate-800 font-black text-xs uppercase tracking-widest mb-3 pb-1 border-b-2 border-slate-200">Validated Performance Indicators</h2>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(perf).map(([key, val]) => val && val !== 'Not assessed' && (
                <div key={key} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <FontAwesomeIcon icon={faCheck} className="text-emerald-500 text-xs flex-shrink-0" />
                  <div>
                    <p className="text-gray-500 text-[10px] capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-gray-900 text-xs font-bold">{val}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {cv.validated_skills?.length > 0 && (
          <section>
            <h2 className="text-slate-800 font-black text-xs uppercase tracking-widest mb-3 pb-1 border-b-2 border-slate-200">Validated Skills</h2>
            <div className="flex flex-wrap gap-2">
              {cv.validated_skills.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-1.5">
                  <span className="text-gray-900 text-xs font-semibold">{s.skill}</span>
                  <span className="text-[10px] text-gray-500">·</span>
                  <span className="text-[10px] text-gray-500">{s.level}</span>
                  {s.validated_by && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">{s.validated_by}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {cv.projects?.length > 0 && (
          <section>
            <h2 className="text-slate-800 font-black text-xs uppercase tracking-widest mb-3 pb-1 border-b-2 border-slate-200">Projects</h2>
            <div className="flex flex-col gap-4">
              {cv.projects.map((proj, i) => (
                <div key={i}>
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="text-gray-900 font-bold text-sm">{proj.title}</p>
                    {proj.role && <span className="text-gray-500 text-xs flex-shrink-0">{proj.role}</span>}
                  </div>
                  <p className="text-gray-600 text-xs leading-relaxed mb-1">{proj.description}</p>
                  {proj.highlights && <p className="text-emerald-700 text-xs font-medium mb-1.5">★ {proj.highlights}</p>}
                  {proj.technologies?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {proj.technologies.map((t, j) => (
                        <span key={j} className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md font-mono">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Experience */}
        {cv.experiences?.length > 0 && (
          <section>
            <h2 className="text-slate-800 font-black text-xs uppercase tracking-widest mb-3 pb-1 border-b-2 border-slate-200">Experience</h2>
            <div className="flex flex-col gap-4">
              {cv.experiences.map((exp, i) => (
                <div key={i}>
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="text-gray-900 font-bold text-sm">{exp.title}</p>
                    <span className="text-gray-500 text-xs flex-shrink-0">{exp.duration}</span>
                  </div>
                  <p className="text-gray-600 text-xs font-semibold mb-1">{exp.company}</p>
                  <p className="text-gray-600 text-xs leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {cv.education && (
          <section>
            <h2 className="text-slate-800 font-black text-xs uppercase tracking-widest mb-3 pb-1 border-b-2 border-slate-200">Education</h2>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-900 font-bold text-sm">{cv.education.degree}</p>
                <p className="text-gray-600 text-xs">{cv.education.school}</p>
              </div>
              {cv.education.year && <span className="text-gray-500 text-xs">{cv.education.year}</span>}
            </div>
          </section>
        )}

        {/* Certifications */}
        {cv.certifications?.length > 0 && (
          <section>
            <h2 className="text-slate-800 font-black text-xs uppercase tracking-widest mb-3 pb-1 border-b-2 border-slate-200">Certifications</h2>
            <div className="flex flex-col gap-1.5">
              {cv.certifications.map((cert, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 text-xs font-semibold">{cert.name}</p>
                    <p className="text-gray-500 text-[10px]">{cert.issuer}</p>
                  </div>
                  {cert.date && <span className="text-gray-500 text-[10px]">{cert.date}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Achievements */}
        {cv.achievements?.length > 0 && (
          <section>
            <h2 className="text-slate-800 font-black text-xs uppercase tracking-widest mb-3 pb-1 border-b-2 border-slate-200">Achievements</h2>
            <ul className="flex flex-col gap-1">
              {cv.achievements.map((ach, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                  <span className="text-amber-500 mt-0.5">★</span> {ach}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-slate-300 text-[10px]">Generated by ProFolio · AI-Assisted Portfolio Platform</p>
        </div>

      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
const CVPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cvData, setCvData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchCV() }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchCV = async () => {
    try {
      const res = await api.get('/cv/latest')
      setCvData(res.data.cv_data)
    } catch {
      setCvData(null)
    } finally {
      setLoading(false)
    }
  }

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await api.post('/cv/generate')
      setCvData(res.data.cv_data)
      showToast('CV generated successfully!')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to generate CV.', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #cv-print-area, #cv-print-area * { visibility: visible; }
          #cv-print-area {
            position: fixed;
            top: 0; left: 0;
            width: 100%;
            box-shadow: none;
            border-radius: 0;
          }
        }
      `}</style>

      <div className="min-h-screen bg-[#060612] flex font-sans">

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0a18] border-r border-white/5 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
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
              <FontAwesomeIcon icon={faRightFromBracket} className="text-sm" />
              Sign Out
            </button>
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main */}
        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

          {/* Topbar */}
          <header className="sticky top-0 z-30 bg-[#060612]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
            <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
              <FontAwesomeIcon icon={faBars} className="text-lg" />
            </button>
            <div>
              <h1 className="text-white font-bold text-lg">My CV</h1>
              <p className="text-gray-500 text-xs">AI-generated from your portfolio and assessments</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {cvData && (
                <>
                  <button
                    onClick={generate}
                    disabled={generating}
                    className="flex items-center gap-2 border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] text-gray-400 hover:text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faRotateRight} className={generating ? 'animate-spin' : ''} />
                    Regenerate
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
                  >
                    <FontAwesomeIcon icon={faPrint} />
                    Print / Save PDF
                  </button>
                </>
              )}
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                {user?.full_name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 px-6 py-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <FontAwesomeIcon icon={faSpinner} className="text-blue-400 text-3xl animate-spin" />
              </div>
            ) : !cvData ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4">
                  <FontAwesomeIcon icon={faFileLines} className="text-blue-400 text-2xl" />
                </div>
                <h2 className="text-white font-bold text-lg mb-2">No CV generated yet</h2>
                <p className="text-gray-500 text-sm mb-6 max-w-sm">
                  Complete your portfolio and at least one assessment, then generate your AI-powered CV.
                </p>
                <button
                  onClick={generate}
                  disabled={generating}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-60"
                >
                  {generating
                    ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Generating CV...</>
                    : <><FontAwesomeIcon icon={faBolt} /> Generate My CV</>}
                </button>
              </div>
            ) : generating ? (
              <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
                <FontAwesomeIcon icon={faSpinner} className="text-blue-400 text-3xl animate-spin" />
                <p className="text-gray-400 text-sm">AI is writing your CV...</p>
              </div>
            ) : (
              <CVPreview cv={cvData} />
            )}
          </main>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl text-sm font-semibold ${toast.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-green-500/30 bg-green-500/10 text-green-400'}`}>
            <FontAwesomeIcon icon={toast.type === 'error' ? faTriangleExclamation : faCircleCheck} />
            {toast.message}
          </div>
        )}
      </div>
    </>
  )
}

export default CVPage