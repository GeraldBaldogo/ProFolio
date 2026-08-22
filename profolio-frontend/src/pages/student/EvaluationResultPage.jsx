import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faFolder, faRobot, faStar, faUser, faBars, faTimes,
  faRightFromBracket, faSpinner, faArrowRight, faCircleCheck,
  faUserTie, faTrophy, faChartLine, faFileAlt, faTriangleExclamation,
  faClockRotateLeft, faComments, faFingerprint, faLightbulb, faClipboardList,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
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

const verdictConfig = {
  passed: { label: 'Passed', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: faCircleCheck },
  failed: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: faTriangleExclamation },
  needs_revision: { label: 'Needs Revision', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: faClockRotateLeft },
}

const readinessConfig = {
  not_ready: { label: 'Not Ready', color: 'text-red-400', pct: 25 },
  developing: { label: 'Developing', color: 'text-amber-400', pct: 50 },
  ready: { label: 'Ready', color: 'text-blue-400', pct: 75 },
  highly_ready: { label: 'Highly Ready', color: 'text-green-400', pct: 100 },
}

const EvaluationResultPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [portfolio, setPortfolio] = useState(null)
  const [humanEval, setHumanEval] = useState(null)
  const [aiEval, setAiEval] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const res = await api.get('/portfolios/my')
      const portfolios = res.data.data
      if (portfolios.length > 0) {
        setPortfolio(portfolios[0])
        try {
          const humanRes = await api.get(`/evaluations/human/${portfolios[0].id}`)
          setHumanEval(humanRes.data.data)
        } catch {}
        try {
          const aiRes = await api.get(`/evaluations/ai/${portfolios[0].id}`)
          setAiEval(aiRes.data.data)
        } catch {}
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const verdict = humanEval ? verdictConfig[humanEval.verdict] : null
  const readiness = humanEval ? readinessConfig[humanEval.career_readiness] : null

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
            <h1 className="text-white font-bold text-lg">Evaluation Result</h1>
            <p className="text-gray-500 text-xs">Your official career readiness assessment</p>
          </div>
          <div className="ml-auto">
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
          ) : !humanEval ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4">
                <FontAwesomeIcon icon={faUserTie} className="text-amber-400 text-2xl" />
              </div>
              <h2 className="text-white font-bold text-lg mb-2">No evaluation yet</h2>
              <p className="text-gray-500 text-sm mb-6 max-w-sm">
                {!portfolio ? 'Create and submit your portfolio first.' :
                  portfolio.status === 'draft' ? 'Submit your portfolio to start the evaluation process.' :
                  'Your portfolio is being reviewed. Please wait for your evaluator to complete the assessment.'}
              </p>
              <Link to="/student/portfolio" className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition-all">
                {portfolio?.status === 'draft' ? 'Complete Portfolio' : 'View Portfolio'}
                <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-6">

              {/* Verdict banner */}
              <div className={`border ${verdict.border} ${verdict.bg} rounded-2xl p-6 flex items-center gap-5`}>
                <div className={`w-14 h-14 ${verdict.bg} border ${verdict.border} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <FontAwesomeIcon icon={verdict.icon} className={`${verdict.color} text-2xl`} />
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Final Verdict</p>
                  <p className={`text-3xl font-black ${verdict.color}`}>{verdict.label}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Evaluated on {new Date(humanEval.evaluated_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                {humanEval.verdict === 'needs_revision' && (
                  <Link to="/student/portfolio" className="ml-auto flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-amber-500/30 transition-all flex-shrink-0">
                    Update Portfolio <FontAwesomeIcon icon={faArrowRight} />
                  </Link>
                )}
              </div>

              {/* Score cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 text-center">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FontAwesomeIcon icon={faStar} className="text-blue-400" />
                  </div>
                  <p className="text-gray-500 text-xs mb-1">Final Score</p>
                  <p className="text-4xl font-black text-white">{humanEval.final_score}<span className="text-xl text-gray-500">/100</span></p>
                </div>

                <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 text-center">
                  <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FontAwesomeIcon icon={faRobot} className="text-violet-400" />
                  </div>
                  <p className="text-gray-500 text-xs mb-1">AI Score</p>
                  <p className="text-4xl font-black text-white">{aiEval ? aiEval.overall_score : '—'}<span className="text-xl text-gray-500">/100</span></p>
                </div>

                <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 text-center">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FontAwesomeIcon icon={faChartLine} className="text-emerald-400" />
                  </div>
                  <p className="text-gray-500 text-xs mb-1">Career Readiness</p>
                  <p className={`text-xl font-black capitalize ${readiness?.color}`}>{readiness?.label}</p>
                </div>
              </div>

              {/* Career readiness bar */}
              <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                <h2 className="text-white font-bold text-sm mb-4">Career Readiness Level</h2>
                <div className="flex items-center gap-3 mb-3">
                  {Object.entries(readinessConfig).map(([key, val], i) => (
                    <div key={key} className={`flex-1 text-center ${humanEval.career_readiness === key ? 'opacity-100' : 'opacity-30'}`}>
                      <div className={`h-2 rounded-full mb-2 ${humanEval.career_readiness === key ? `bg-gradient-to-r ${key === 'not_ready' ? 'from-red-500 to-rose-500' : key === 'developing' ? 'from-amber-500 to-orange-500' : key === 'ready' ? 'from-blue-500 to-cyan-500' : 'from-green-500 to-teal-500'}` : 'bg-white/10'}`} />
                      <p className={`text-xs font-medium ${humanEval.career_readiness === key ? val.color : 'text-gray-600'}`}>{val.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {humanEval.comments && (
                  <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faUserTie} className="text-blue-400 text-sm" />
                      </div>
                      <p className="text-white font-bold text-sm">Evaluator Comments</p>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">"{humanEval.comments}"</p>
                  </div>
                )}
                {humanEval.recommendations && (
                  <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faTrophy} className="text-emerald-400 text-sm" />
                      </div>
                      <p className="text-white font-bold text-sm">Recommendations</p>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{humanEval.recommendations}</p>
                  </div>
                )}
              </div>

              {/* Next steps */}
              <div className="border border-blue-500/20 bg-blue-500/5 rounded-2xl p-5">
                <h2 className="text-white font-bold text-sm mb-3">Next Steps</h2>
                <div className="flex flex-col gap-2">
                  {humanEval.verdict === 'passed' ? (
                    <>
                      <div className="flex items-center gap-3 text-sm text-gray-300">
                        <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 flex-shrink-0" />
                        Share your portfolio with employers using your public link
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-300">
                        <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 flex-shrink-0" />
                        Continue adding more projects to strengthen your portfolio
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-300">
                        <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 flex-shrink-0" />
                        Apply for internships and job opportunities in your field
                      </div>
                    </>
                  ) : humanEval.verdict === 'needs_revision' ? (
                    <>
                      <div className="flex items-center gap-3 text-sm text-gray-300">
                        <FontAwesomeIcon icon={faArrowRight} className="text-amber-400 flex-shrink-0" />
                        Review the evaluator's comments and make the requested changes
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-300">
                        <FontAwesomeIcon icon={faArrowRight} className="text-amber-400 flex-shrink-0" />
                        Update your portfolio and resubmit for evaluation
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 text-sm text-gray-300">
                        <FontAwesomeIcon icon={faArrowRight} className="text-red-400 flex-shrink-0" />
                        Review all feedback carefully and improve your portfolio
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-300">
                        <FontAwesomeIcon icon={faArrowRight} className="text-red-400 flex-shrink-0" />
                        Add more projects and certifications to strengthen your profile
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default EvaluationResultPage