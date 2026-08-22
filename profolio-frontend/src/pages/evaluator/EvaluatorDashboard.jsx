import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faClipboardCheck, faClockRotateLeft, faBars, faTimes,
  faRightFromBracket, faSpinner, faArrowRight, faCircleCheck,
  faUserTie, faStar, faRobot, faChartLine, faFolder, faFlaskVial, 
  faTriangleExclamation, faXmark, faSave, faUser, faBell,
  faEye,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

const navItems = [
  { label: 'Dashboard', icon: faHouse, path: '/evaluator/dashboard' },
  { label: 'Assigned Portfolios', icon: faClipboardCheck, path: '/evaluator/assigned' },
  { label: 'History', icon: faClockRotateLeft, path: '/evaluator/history' },
  { label: 'My Tests', icon: faFlaskVial, path: '/evaluator/tests' },
]

const statusConfig = {
  draft: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
  submitted: { label: 'Submitted', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  ai_reviewed: { label: 'AI Reviewed', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  under_review: { label: 'Under Review', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  revision_requested: { label: 'Needs Revision', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  completed: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
}

const inputClass = "w-full bg-white/5 border border-white/8 hover:border-white/15 focus:border-blue-500/50 focus:bg-blue-500/5 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none transition-all"
const labelClass = "text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block"

const EvaluatorDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPortfolio, setSelectedPortfolio] = useState(null)
  const [portfolioDetail, setPortfolioDetail] = useState(null)
  const [aiEval, setAiEval] = useState(null)
  const [showEvalForm, setShowEvalForm] = useState(false)
  const [evalForm, setEvalForm] = useState({
    final_score: '',
    comments: '',
    recommendations: '',
    career_readiness: 'developing',
    verdict: 'passed',
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => { fetchAssignments() }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/evaluations/assigned')
      setAssignments(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const viewPortfolio = async (assignment) => {
    setSelectedPortfolio(assignment)
    setLoadingDetail(true)
    setShowEvalForm(false)
    try {
      const res = await api.get(`/portfolios/${assignment.portfolio_id}`)
      setPortfolioDetail(res.data.data)
      try {
        const aiRes = await api.get(`/evaluations/ai/${assignment.portfolio_id}`)
        setAiEval(aiRes.data.data)
      } catch { setAiEval(null) }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDetail(false)
    }
  }

  const submitEvaluation = async () => {
    if (!evalForm.final_score || !evalForm.comments) {
      showToast('Please fill in all required fields.', 'error')
      return
    }
    setSaving(true)
    try {
      await api.post(`/evaluations/human/${selectedPortfolio.portfolio_id}`, {
        ...evalForm,
        final_score: parseFloat(evalForm.final_score),
      })
      showToast('Evaluation submitted successfully!')
      setShowEvalForm(false)
      setSelectedPortfolio(null)
      setPortfolioDetail(null)
      fetchAssignments()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit evaluation.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const pending = assignments.filter(a => a.portfolios?.status !== 'completed')
  const completed = assignments.filter(a => a.portfolios?.status === 'completed')

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
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.full_name}</p>
              <p className="text-amber-400 text-xs">Evaluator</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-amber-500/15 text-white border border-amber-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <FontAwesomeIcon icon={item.icon} className={`text-sm ${isActive ? 'text-amber-400' : ''}`} />
                {item.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-amber-400 rounded-full" />}
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
            <h1 className="text-white font-bold text-lg">Evaluator Dashboard</h1>
            <p className="text-gray-500 text-xs">Welcome, {user?.full_name?.split(' ')[0]}!</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-6 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <FontAwesomeIcon icon={faSpinner} className="text-amber-400 text-3xl animate-spin" />
            </div>
          ) : selectedPortfolio ? (

            /* Portfolio Detail View */
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <button onClick={() => { setSelectedPortfolio(null); setPortfolioDetail(null); setShowEvalForm(false) }}
                  className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
                  ← Back to assignments
                </button>
              </div>

              {loadingDetail ? (
                <div className="flex items-center justify-center h-64">
                  <FontAwesomeIcon icon={faSpinner} className="text-amber-400 text-3xl animate-spin" />
                </div>
              ) : portfolioDetail && (
                <div className="flex flex-col gap-5">

                  {/* Student info */}
                  <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                      {portfolioDetail.student_profiles?.users?.full_name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <p className="text-white font-bold">{portfolioDetail.student_profiles?.users?.full_name || 'Student'}</p>
                      <p className="text-gray-500 text-xs">{portfolioDetail.student_profiles?.course} · {portfolioDetail.student_profiles?.school}</p>
                      <p className="text-gray-500 text-xs">{portfolioDetail.student_profiles?.year_level}</p>
                    </div>
                    <div className="ml-auto">
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${statusConfig[portfolioDetail.status]?.bg} ${statusConfig[portfolioDetail.status]?.border} ${statusConfig[portfolioDetail.status]?.color}`}>
                        {statusConfig[portfolioDetail.status]?.label}
                      </span>
                    </div>
                  </div>

                  {/* AI Evaluation summary */}
                  {aiEval && (
                    <div className="border border-violet-500/20 bg-violet-500/5 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                          <FontAwesomeIcon icon={faRobot} className="text-violet-400 text-sm" />
                        </div>
                        <p className="text-white font-bold text-sm">AI Evaluation Report</p>
                        <span className="ml-auto text-violet-400 font-black text-lg">{aiEval.overall_score}/100</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-white/5 rounded-xl p-3">
                          <p className="text-green-400 text-xs font-bold mb-1">Strengths</p>
                          <p className="text-gray-300 text-xs leading-relaxed">{aiEval.strengths}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <p className="text-red-400 text-xs font-bold mb-1">Weaknesses</p>
                          <p className="text-gray-300 text-xs leading-relaxed">{aiEval.weaknesses}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <p className="text-amber-400 text-xs font-bold mb-1">Suggestions</p>
                          <p className="text-gray-300 text-xs leading-relaxed">{aiEval.suggestions}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Portfolio sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Projects */}
                    {portfolioDetail.projects?.length > 0 && (
                      <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                        <p className="text-white font-bold text-sm mb-3">Projects ({portfolioDetail.projects.length})</p>
                        <div className="flex flex-col gap-2">
                          {portfolioDetail.projects.map((p, i) => (
                            <div key={i} className="p-3 bg-white/5 rounded-xl">
                              <p className="text-white text-xs font-semibold">{p.title}</p>
                              <p className="text-blue-400 text-xs mt-0.5">{p.tech_stack}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {portfolioDetail.skills?.length > 0 && (
                      <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                        <p className="text-white font-bold text-sm mb-3">Skills ({portfolioDetail.skills.length})</p>
                        <div className="flex flex-col gap-2">
                          {portfolioDetail.skills.map((s, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <p className="text-gray-300 text-xs flex-1">{s.skill_name}</p>
                              <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full" style={{ width: `${(s.self_rating / 10) * 100}%` }} />
                              </div>
                              <span className="text-gray-500 text-xs">{s.self_rating}/10</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    {portfolioDetail.certifications?.length > 0 && (
                      <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                        <p className="text-white font-bold text-sm mb-3">Certifications ({portfolioDetail.certifications.length})</p>
                        <div className="flex flex-col gap-2">
                          {portfolioDetail.certifications.map((c, i) => (
                            <div key={i} className="p-3 bg-white/5 rounded-xl">
                              <p className="text-white text-xs font-semibold">{c.title}</p>
                              <p className="text-amber-400 text-xs mt-0.5">{c.issuer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Achievements */}
                    {portfolioDetail.achievements?.length > 0 && (
                      <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                        <p className="text-white font-bold text-sm mb-3">Achievements ({portfolioDetail.achievements.length})</p>
                        <div className="flex flex-col gap-2">
                          {portfolioDetail.achievements.map((a, i) => (
                            <div key={i} className="p-3 bg-white/5 rounded-xl">
                              <p className="text-white text-xs font-semibold">{a.title}</p>
                              <p className="text-emerald-400 text-xs mt-0.5">{a.category}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Evaluation Form */}
                  {portfolioDetail.status !== 'completed' && (
                    <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-amber-500/10">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faClipboardCheck} className="text-amber-400" />
                          <p className="text-white font-bold text-sm">Submit Evaluation</p>
                        </div>
                        <button onClick={() => setShowEvalForm(!showEvalForm)}
                          className="text-amber-400 text-xs font-semibold hover:text-amber-300 transition-colors">
                          {showEvalForm ? 'Hide Form' : 'Open Form'}
                        </button>
                      </div>

                      {showEvalForm && (
                        <div className="px-5 py-5 flex flex-col gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={labelClass}>Final Score (0-100) *</label>
                              <input type="number" min="0" max="100" className={inputClass} placeholder="e.g. 82"
                                value={evalForm.final_score} onChange={e => setEvalForm({ ...evalForm, final_score: e.target.value })} />
                            </div>
                            <div>
                              <label className={labelClass}>Verdict *</label>
                              <select className={inputClass} value={evalForm.verdict} onChange={e => setEvalForm({ ...evalForm, verdict: e.target.value })}>
                                <option value="passed">Passed</option>
                                <option value="failed">Failed</option>
                                <option value="needs_revision">Needs Revision</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className={labelClass}>Career Readiness *</label>
                            <select className={inputClass} value={evalForm.career_readiness} onChange={e => setEvalForm({ ...evalForm, career_readiness: e.target.value })}>
                              <option value="not_ready">Not Ready</option>
                              <option value="developing">Developing</option>
                              <option value="ready">Ready</option>
                              <option value="highly_ready">Highly Ready</option>
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Comments *</label>
                            <textarea className={inputClass + ' resize-none h-24'} placeholder="Write your evaluation comments..."
                              value={evalForm.comments} onChange={e => setEvalForm({ ...evalForm, comments: e.target.value })} />
                          </div>
                          <div>
                            <label className={labelClass}>Recommendations</label>
                            <textarea className={inputClass + ' resize-none h-20'} placeholder="Write your recommendations for the student..."
                              value={evalForm.recommendations} onChange={e => setEvalForm({ ...evalForm, recommendations: e.target.value })} />
                          </div>
                          <div className="flex gap-3">
                            <button onClick={submitEvaluation} disabled={saving}
                              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all disabled:opacity-60">
                              {saving ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faSave} />}
                              {saving ? 'Submitting...' : 'Submit Evaluation'}
                            </button>
                            <button onClick={() => setShowEvalForm(false)}
                              className="border border-white/8 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {portfolioDetail.status === 'completed' && (
                    <div className="border border-green-500/20 bg-green-500/5 rounded-2xl p-5 flex items-center gap-3">
                      <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 text-xl flex-shrink-0" />
                      <p className="text-green-400 font-semibold text-sm">This portfolio has already been evaluated.</p>
                    </div>
                  )}

                </div>
              )}
            </div>

          ) : (

            /* Dashboard Overview */
            <div className="flex flex-col gap-6">

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total Assigned', value: assignments.length, icon: faClipboardCheck, gradient: 'from-amber-500 to-orange-500' },
                  { label: 'Pending Review', value: pending.length, icon: faClockRotateLeft, gradient: 'from-blue-500 to-cyan-500' },
                  { label: 'Completed', value: completed.length, icon: faCircleCheck, gradient: 'from-green-500 to-teal-500' },
                ].map((stat, i) => (
                  <div key={i} className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                    <div className={`w-10 h-10 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center mb-3`}>
                      <FontAwesomeIcon icon={stat.icon} className="text-white text-sm" />
                    </div>
                    <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
                    <p className="text-gray-500 text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Pending assignments */}
              <div className="border border-white/8 bg-white/[0.03] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-white font-bold text-sm">Pending Evaluations</h2>
                  <span className="text-xs text-gray-500">{pending.length} portfolios</span>
                </div>
                {pending.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 text-3xl mb-3" />
                    <p className="text-gray-400 text-sm font-medium">All caught up!</p>
                    <p className="text-gray-600 text-xs mt-1">No pending evaluations at the moment.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {pending.map((assignment, i) => {
                      const status = statusConfig[assignment.portfolios?.status] || statusConfig.submitted
                      return (
                        <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-all">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {assignment.portfolios?.student_profiles?.users?.full_name?.charAt(0) || 'S'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">
                              {assignment.portfolios?.student_profiles?.users?.full_name || 'Student'}
                            </p>
                            <p className="text-gray-500 text-xs truncate">
                              {assignment.portfolios?.student_profiles?.course} · {assignment.portfolios?.student_profiles?.school}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${status.bg} ${status.border} ${status.color} flex-shrink-0`}>
                            {status.label}
                          </span>
                          <button onClick={() => viewPortfolio(assignment)}
                            className="flex items-center gap-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/20 text-amber-400 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex-shrink-0">
                            <FontAwesomeIcon icon={faEye} /> Review
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Completed */}
              {completed.length > 0 && (
                <div className="border border-white/8 bg-white/[0.03] rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/5">
                    <h2 className="text-white font-bold text-sm">Completed Evaluations</h2>
                  </div>
                  <div className="divide-y divide-white/5">
                    {completed.map((assignment, i) => (
                      <div key={i} className="flex items-center gap-4 px-5 py-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {assignment.portfolios?.student_profiles?.users?.full_name?.charAt(0) || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">
                            {assignment.portfolios?.student_profiles?.users?.full_name || 'Student'}
                          </p>
                          <p className="text-gray-500 text-xs">Evaluation complete</p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-green-500/10 border-green-500/20 text-green-400 flex-shrink-0">
                          Completed
                        </span>
                        <button onClick={() => viewPortfolio(assignment)}
                          className="flex items-center gap-2 border border-white/8 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all flex-shrink-0">
                          <FontAwesomeIcon icon={faEye} /> View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
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

export default EvaluatorDashboard