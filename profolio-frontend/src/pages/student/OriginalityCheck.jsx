import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faFolder, faRobot, faStar, faUser, faBars, faTimes,
  faTrophy, faRightFromBracket, faSpinner, faFingerprint, faCode,
  faFileLines, faMagnifyingGlass, faTriangleExclamation, faCircleCheck,
  faClockRotateLeft, faChevronRight, faXmark, faShieldHalved,
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
  { label: 'Profile', icon: faUser, path: '/student/profile' },
]

const CONTENT_TYPES = [
  { value: 'text', label: 'Text / Writeup', icon: faFileLines },
  { value: 'code', label: 'Code', icon: faCode },
]

const VERDICT_STYLE = {
  original: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Original' },
  likely_original: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Likely Original' },
  mixed: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Mixed' },
  likely_ai: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'Likely AI-Generated' },
  ai_generated: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', label: 'AI-Generated' },
}

const ScoreRing = ({ score, label, color }) => (
  <div className="flex flex-col items-center">
    <div className="relative w-20 h-20">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 251.2} 251.2`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-white font-black text-lg">{score}</span>
      </div>
    </div>
    <p className="text-gray-500 text-xs mt-2 text-center">{label}</p>
  </div>
)

const OriginalityCheck = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [view, setView] = useState('check') // check | history
  const [contentType, setContentType] = useState('text')
  const [content, setContent] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [selectedCheck, setSelectedCheck] = useState(null)

  useEffect(() => { fetchHistory() }, [])

  const fetchHistory = async () => {
    try {
      const res = await api.get('/originality/history')
      setHistory(res.data)
    } catch {
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleCheck = async () => {
    if (content.trim().length < 50) {
      setError('Content must be at least 50 characters for accurate analysis.')
      return
    }
    setError(null)
    setChecking(true)
    setResult(null)
    try {
      const res = await api.post('/originality/check', { content, content_type: contentType })
      setResult(res.data)
      fetchHistory()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check originality. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  const handleReset = () => {
    setContent('')
    setResult(null)
    setError(null)
  }

  const handleLogout = () => { logout(); navigate('/') }

  const charCount = content.trim().length

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
            <h1 className="text-white font-bold text-lg">Originality Check</h1>
            <p className="text-gray-500 text-xs">Verify your work reflects your own knowledge and effort</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setView('check')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${view === 'check' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'text-gray-500 hover:text-white'}`}
            >
              Check
            </button>
            <button
              onClick={() => setView('history')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${view === 'history' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'text-gray-500 hover:text-white'}`}
            >
              <FontAwesomeIcon icon={faClockRotateLeft} className="text-xs" /> History
              {history.length > 0 && (
                <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full">{history.length}</span>
              )}
            </button>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-6 py-8">

          {view === 'check' ? (
            <div className="flex flex-col gap-5 max-w-3xl">

              {!result ? (
                <>
                  {/* Intro */}
                  <div className="border border-violet-500/20 bg-violet-500/5 rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faFingerprint} className="text-violet-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm mb-1">Verify your originality before submitting</p>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        Paste your project writeup, documentation, or code below. AI will analyze it for signs of genuine human authorship versus AI-generated content. Use this to ensure your portfolio reflects your own knowledge and effort.
                      </p>
                    </div>
                  </div>

                  {/* Content type selector */}
                  <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Content Type</p>
                    <div className="flex gap-3">
                      {CONTENT_TYPES.map(ct => (
                        <button
                          key={ct.value}
                          onClick={() => setContentType(ct.value)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                            contentType === ct.value
                              ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
                              : 'border-white/8 text-gray-500 hover:text-white hover:border-white/20'
                          }`}
                        >
                          <FontAwesomeIcon icon={ct.icon} className="text-xs" />
                          {ct.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content input */}
                  <div className="border border-white/8 bg-[#0a0a18] rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#060610] border-b border-white/5">
                      <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                        {contentType === 'code' ? 'Paste your code' : 'Paste your writeup'}
                      </span>
                      <span className={`text-xs ${charCount < 50 ? 'text-rose-400' : 'text-gray-600'}`}>
                        {charCount} / 50 min
                      </span>
                    </div>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={contentType === 'code'
                        ? 'Paste your code here...'
                        : 'Paste your project description, documentation, or writeup here...'}
                      className={`w-full bg-transparent text-gray-200 ${contentType === 'code' ? 'font-mono' : ''} text-sm p-4 resize-none outline-none leading-7 min-h-[280px]`}
                      spellCheck={false}
                    />
                  </div>

                  {error && (
                    <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-4 flex items-center gap-3">
                      <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400" />
                      <p className="text-rose-400 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleCheck}
                    disabled={checking || charCount < 50}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 disabled:opacity-40 text-white font-bold py-3 rounded-2xl transition-all"
                  >
                    {checking
                      ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Analyzing originality...</>
                      : <><FontAwesomeIcon icon={faMagnifyingGlass} /> Check Originality</>}
                  </button>
                </>
              ) : (
                /* ── RESULT ── */
                <div className="flex flex-col gap-5">
                  <button onClick={handleReset} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors self-start">
                    <FontAwesomeIcon icon={faXmark} /> Check another submission
                  </button>

                  {/* Verdict header */}
                  <div className={`border rounded-2xl p-6 ${VERDICT_STYLE[result.verdict]?.border} ${VERDICT_STYLE[result.verdict]?.bg}`}>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="flex gap-6">
                        <ScoreRing score={result.originality_score} label="Originality" color={result.originality_score >= 70 ? '#10b981' : result.originality_score >= 40 ? '#f59e0b' : '#f43f5e'} />
                        <ScoreRing score={result.ai_detected_percentage} label="AI Detected" color={result.ai_detected_percentage <= 30 ? '#10b981' : result.ai_detected_percentage <= 60 ? '#f59e0b' : '#f43f5e'} />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                          <FontAwesomeIcon icon={faShieldHalved} className={VERDICT_STYLE[result.verdict]?.color} />
                          <p className={`font-black text-xl ${VERDICT_STYLE[result.verdict]?.color}`}>
                            {VERDICT_STYLE[result.verdict]?.label || result.verdict}
                          </p>
                        </div>
                        <p className="text-gray-400 text-xs">Content type: {result.content_type}</p>
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  {result.explanation && (
                    <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Analysis</p>
                      <p className="text-gray-300 text-sm leading-relaxed">{result.explanation}</p>
                    </div>
                  )}

                  {/* Human / AI signals */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {result.human_signals && (
                      <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-5">
                        <p className="text-emerald-400 text-xs font-semibold mb-2">✓ Human Signals</p>
                        <p className="text-gray-300 text-xs leading-relaxed">{result.human_signals}</p>
                      </div>
                    )}
                    {result.ai_signals && (
                      <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-5">
                        <p className="text-rose-400 text-xs font-semibold mb-2">⚠ AI Signals</p>
                        <p className="text-gray-300 text-xs leading-relaxed">{result.ai_signals}</p>
                      </div>
                    )}
                  </div>

                  {/* Recommendations */}
                  {result.recommendations && (
                    <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-5">
                      <p className="text-amber-400 text-xs font-semibold mb-2">Recommendations</p>
                      <p className="text-gray-300 text-sm leading-relaxed">{result.recommendations}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ── HISTORY ── */
            <div className="max-w-3xl">
              {loadingHistory ? (
                <div className="flex items-center justify-center h-64">
                  <FontAwesomeIcon icon={faSpinner} className="text-violet-400 text-3xl animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-4">
                    <FontAwesomeIcon icon={faClockRotateLeft} className="text-violet-400 text-2xl" />
                  </div>
                  <h2 className="text-white font-bold text-lg mb-2">No checks yet</h2>
                  <p className="text-gray-500 text-sm">Your originality check history will appear here.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedCheck(selectedCheck?.id === item.id ? null : item)}
                      className="text-left border border-white/8 bg-white/[0.03] hover:bg-white/[0.05] rounded-2xl p-5 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${VERDICT_STYLE[item.verdict]?.bg}`}>
                          <FontAwesomeIcon icon={item.content_type === 'code' ? faCode : faFileLines} className={VERDICT_STYLE[item.verdict]?.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className={`font-bold text-sm ${VERDICT_STYLE[item.verdict]?.color}`}>{VERDICT_STYLE[item.verdict]?.label || item.verdict}</p>
                            <span className="text-gray-600 text-xs capitalize">· {item.content_type}</span>
                          </div>
                          <p className="text-gray-500 text-xs">
                            {new Date(item.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-white font-black text-lg">{item.originality_score}</p>
                          <p className="text-gray-600 text-xs">originality</p>
                        </div>
                        <FontAwesomeIcon icon={faChevronRight} className={`text-gray-600 text-xs transition-transform ${selectedCheck?.id === item.id ? 'rotate-90' : ''}`} />
                      </div>

                      {selectedCheck?.id === item.id && (
                        <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-3">
                          {item.explanation && (
                            <div>
                              <p className="text-gray-500 text-xs font-semibold mb-1">Analysis</p>
                              <p className="text-gray-300 text-xs leading-relaxed">{item.explanation}</p>
                            </div>
                          )}
                          {item.recommendations && (
                            <div>
                              <p className="text-amber-400 text-xs font-semibold mb-1">Recommendations</p>
                              <p className="text-gray-300 text-xs leading-relaxed">{item.recommendations}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default OriginalityCheck