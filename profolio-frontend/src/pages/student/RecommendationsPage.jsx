import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faFolder, faRobot, faStar, faUser, faBars, faTimes,
  faTrophy, faRightFromBracket, faSpinner, faLightbulb, faBook,
  faCertificate, faWrench, faBolt, faChevronDown, faChevronUp,
  faArrowUpRightFromSquare, faRotateRight, faTriangleExclamation,
  faCircleCheck, faChartLine, faGraduationCap, faListCheck, faComments,
  faFileAlt, faFingerprint,
} from '@fortawesome/free-solid-svg-icons'
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

const PRIORITY_COLOR = {
  high: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}

const CollapsibleSection = ({ title, icon, iconColor, count, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-white/8 bg-white/[0.03] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-all"
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
          <FontAwesomeIcon icon={icon} className="text-sm" />
        </div>
        <span className="text-white font-bold text-sm flex-1 text-left">{title}</span>
        {count !== undefined && (
          <span className="text-xs text-gray-500 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full mr-2">
            {count}
          </span>
        )}
        <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} className="text-gray-500 text-xs" />
      </button>
      {open && <div className="px-5 pb-5 border-t border-white/5">{children}</div>}
    </div>
  )
}

const RecommendationsPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rec, setRec] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchRecommendations() }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchRecommendations = async () => {
    try {
      const res = await api.get('/recommendations/latest')
      setRec(res.data)
    } catch {
      setRec(null)
    } finally {
      setLoading(false)
    }
  }

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await api.post('/recommendations/generate')
      setRec(res.data)
      showToast('Recommendations generated!')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to generate recommendations.', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  return (
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
            <h1 className="text-white font-bold text-lg">Recommendations</h1>
            <p className="text-gray-500 text-xs">Personalized learning path based on your profile</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {rec && (
              <button
                onClick={generate}
                disabled={generating}
                className="flex items-center gap-2 border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] text-gray-400 hover:text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faRotateRight} className={generating ? 'animate-spin' : ''} />
                Regenerate
              </button>
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
              <FontAwesomeIcon icon={faSpinner} className="text-violet-400 text-3xl animate-spin" />
            </div>
          ) : !rec ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-4">
                <FontAwesomeIcon icon={faLightbulb} className="text-violet-400 text-2xl" />
              </div>
              <h2 className="text-white font-bold text-lg mb-2">No recommendations yet</h2>
              <p className="text-gray-500 text-sm mb-6 max-w-sm">
                Complete at least one assessment or portfolio evaluation first, then generate your personalized learning path.
              </p>
              <button
                onClick={generate}
                disabled={generating}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-60"
              >
                {generating
                  ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Generating...</>
                  : <><FontAwesomeIcon icon={faBolt} /> Generate Recommendations</>}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5 max-w-4xl">

              {/* Generated date */}
              <p className="text-gray-600 text-xs">
                Generated {new Date(rec.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>

              {/* Summary card */}
              <div className="border border-violet-500/20 bg-violet-500/5 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                    <FontAwesomeIcon icon={faChartLine} className="text-violet-400 text-sm" />
                  </div>
                  <p className="text-violet-400 font-bold text-sm">Overall Summary</p>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{rec.overall_summary}</p>
              </div>

              {/* Skill gaps */}
              {rec.skill_gaps?.length > 0 && (
                <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-rose-500/20 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 text-sm" />
                    </div>
                    <p className="text-rose-400 font-bold text-sm">Skill Gaps to Address</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {rec.skill_gaps.map((gap, i) => (
                      <span key={i} className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl">
                        {gap}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Next steps */}
              {rec.next_steps && (
                <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faListCheck} className="text-amber-400 text-sm" />
                    </div>
                    <p className="text-amber-400 font-bold text-sm">This Week's Action Plan</p>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{rec.next_steps}</p>
                </div>
              )}

              {/* Courses */}
              {rec.courses?.length > 0 && (
                <CollapsibleSection
                  title="Recommended Courses"
                  icon={faBook}
                  iconColor="bg-blue-500/20 text-blue-400"
                  count={rec.courses.length}
                  defaultOpen={true}
                >
                  <div className="flex flex-col gap-3 mt-4">
                    {rec.courses.map((course, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 border border-white/8 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-all">
                        <div className="w-9 h-9 bg-blue-500/15 border border-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FontAwesomeIcon icon={faGraduationCap} className="text-blue-400 text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                            <p className="text-white font-semibold text-sm">{course.title}</p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize flex-shrink-0 ${PRIORITY_COLOR[course.priority] || PRIORITY_COLOR.medium}`}>
                              {course.priority}
                            </span>
                          </div>
                          <p className="text-gray-500 text-xs mb-1">{course.provider} · {course.duration}</p>
                          <p className="text-gray-400 text-xs">Addresses: <span className="text-violet-400">{course.addresses_gap}</span></p>
                        </div>
                        {course.url && (
                          <a href={course.url} target="_blank" rel="noopener noreferrer"
                            className="flex-shrink-0 w-8 h-8 border border-white/8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all mt-0.5">
                            <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-xs" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* Training Modules */}
              {rec.training_modules?.length > 0 && (
                <CollapsibleSection
                  title="Training Modules"
                  icon={faWrench}
                  iconColor="bg-emerald-500/20 text-emerald-400"
                  count={rec.training_modules.length}
                  defaultOpen={true}
                >
                  <div className="flex flex-col gap-3 mt-4">
                    {rec.training_modules.map((mod, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 border border-white/8 bg-white/[0.02] rounded-xl">
                        <div className="w-9 h-9 bg-emerald-500/15 border border-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FontAwesomeIcon icon={faWrench} className="text-emerald-400 text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                            <p className="text-white font-semibold text-sm">{mod.title}</p>
                            <span className="text-xs text-gray-500 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full flex-shrink-0">
                              ~{mod.estimated_hours}h
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs leading-relaxed mb-1">{mod.description}</p>
                          <p className="text-gray-500 text-xs">Addresses: <span className="text-emerald-400">{mod.addresses_gap}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* Certifications */}
              {rec.certifications?.length > 0 && (
                <CollapsibleSection
                  title="Certifications to Pursue"
                  icon={faCertificate}
                  iconColor="bg-amber-500/20 text-amber-400"
                  count={rec.certifications.length}
                  defaultOpen={true}
                >
                  <div className="flex flex-col gap-3 mt-4">
                    {rec.certifications.map((cert, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 border border-white/8 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-all">
                        <div className="w-9 h-9 bg-amber-500/15 border border-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FontAwesomeIcon icon={faCertificate} className="text-amber-400 text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                            <p className="text-white font-semibold text-sm">{cert.title}</p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize flex-shrink-0 ${PRIORITY_COLOR[cert.priority] || PRIORITY_COLOR.medium}`}>
                              {cert.priority}
                            </span>
                          </div>
                          <p className="text-gray-500 text-xs mb-1">{cert.provider}</p>
                          <p className="text-gray-400 text-xs leading-relaxed">{cert.relevance}</p>
                        </div>
                        {cert.url && (
                          <a href={cert.url} target="_blank" rel="noopener noreferrer"
                            className="flex-shrink-0 w-8 h-8 border border-white/8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all mt-0.5">
                            <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-xs" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

            </div>
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
  )
}

export default RecommendationsPage