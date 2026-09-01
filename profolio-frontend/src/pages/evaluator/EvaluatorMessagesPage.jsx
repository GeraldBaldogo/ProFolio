import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faFlaskVial, faUsers, faComments, faBars, faTimes,
  faRightFromBracket, faSpinner, faTriangleExclamation, faRotateRight,
  faPlus, faUserGraduate, faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import { listConversations, startConversation } from '../../services/messaging.service'
import ChatThread from '../../components/ChatThread'
import api from '../../services/api'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

const navItems = [
  { label: 'Dashboard', icon: faHouse, path: '/evaluator/dashboard' },
  { label: 'My Tests', icon: faFlaskVial, path: '/evaluator/tests' },
  { label: 'Students', icon: faUsers, path: '/evaluator/students' },
  { label: 'Messages', icon: faComments, path: '/evaluator/messages' },
]

const EvaluatorMessagesPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  // Students this professor has actually set work for. The old page read from
  // getAssignedPortfolios, which belonged to the portfolio-review flow we
  // removed — so the list was permanently empty.
  const [students, setStudents] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [starting, setStarting] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    setLoadError('')

    const [convRes, studRes] = await Promise.allSettled([
      listConversations(),
      api.get('/tests/my-students'),
    ])

    if (convRes.status === 'fulfilled') {
      const data = convRes.value || []
      setConversations(data)
      if (data.length > 0) setSelectedId(prev => prev ?? data[0].id)
    }
    if (studRes.status === 'fulfilled') {
      setStudents(studRes.value.data.data || [])
    }

    if (convRes.status === 'rejected' && studRes.status === 'rejected') {
      setLoadError('Couldn\u2019t reach the server. Check your connection.')
    }

    setLoading(false)
  }

  const handleStart = async (studentId) => {
    setStarting(studentId)
    setLoadError('')
    try {
      const conversation = await startConversation(studentId)
      setShowPicker(false)
      setSearch('')
      // findOrCreate on the server returns the existing thread rather than a
      // duplicate, so pressing this twice is harmless.
      setConversations(prev =>
        prev.some(c => c.id === conversation.id) ? prev : [conversation, ...prev]
      )
      setSelectedId(conversation.id)
    } catch (err) {
      setLoadError(err.message || 'Couldn\u2019t start that conversation.')
    } finally {
      setStarting(null)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const selected = conversations.find((c) => c.id === selectedId)
  const studentName = selected?.student?.full_name || 'Student'

  // Anyone already in a thread drops out of the picker.
  const available = useMemo(() => {
    const existing = new Set(conversations.map(c => c.student?.id).filter(Boolean))
    const q = search.trim().toLowerCase()
    return students
      .filter(s => !existing.has(s.id))
      .filter(s => !q || s.full_name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q))
  }, [students, conversations, search])

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
              <p className="text-amber-400 text-xs">Professor</p>
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
            <FontAwesomeIcon icon={faRightFromBracket} className="text-sm" /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        <header className="sticky top-0 z-30 bg-[#060612]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <FontAwesomeIcon icon={faBars} className="text-lg" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">Messages</h1>
            <p className="text-gray-500 text-xs">Talk to the students you set work for</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {!loading && (
              <button onClick={fetchAll} aria-label="Refresh"
                className="w-9 h-9 border border-white/8 bg-white/[0.03] rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all">
                <FontAwesomeIcon icon={faRotateRight} className="text-sm" />
              </button>
            )}
            {students.length > 0 && (
              <button onClick={() => setShowPicker(true)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                <FontAwesomeIcon icon={faPlus} className="text-xs" /> New message
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 px-6 py-8">
          {loadError && (
            <div className="max-w-2xl mx-auto mb-6 border border-rose-500/20 bg-rose-500/5 rounded-2xl p-4 flex items-center gap-3">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 flex-shrink-0" />
              <p className="text-rose-400 text-sm">{loadError}</p>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <FontAwesomeIcon icon={faSpinner} className="text-amber-400 text-2xl animate-spin" />
              <p className="text-gray-500 text-sm">Loading...</p>
            </div>

          ) : conversations.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-16">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <FontAwesomeIcon icon={faComments} className="text-gray-600 text-xl" />
              </div>

              {students.length === 0 ? (
                <>
                  <p className="text-white font-bold text-lg mb-2">Nobody to message yet</p>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    You can message a student once you have assigned them a test.
                    You have not set work for anyone so far.
                  </p>
                  <Link to="/evaluator/tests"
                    className="inline-flex items-center gap-2 border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all">
                    <FontAwesomeIcon icon={faFlaskVial} className="text-xs" /> Go to My Tests
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-white font-bold text-lg mb-2">No conversations yet</p>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    You have set work for {students.length} student{students.length !== 1 ? 's' : ''}.
                    Start a conversation with any of them.
                  </p>
                  <button onClick={() => setShowPicker(true)}
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors">
                    <FontAwesomeIcon icon={faPlus} className="text-xs" /> Start a conversation
                  </button>
                </>
              )}
            </div>

          ) : (
            <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-4">
              <div className="lg:w-64 flex-shrink-0 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`text-left px-4 py-3 rounded-xl border transition-all flex-shrink-0 lg:w-full ${
                      selectedId === c.id
                        ? 'border-amber-500/30 bg-amber-500/10'
                        : 'border-white/8 bg-white/[0.03] hover:border-white/20'
                    }`}
                  >
                    <p className="text-white text-sm font-semibold truncate">
                      {c.student?.full_name || 'Student'}
                    </p>
                    <p className="text-gray-500 text-xs truncate">{c.student?.email}</p>
                  </button>
                ))}
              </div>

              <ChatThread
                conversationId={selectedId}
                currentUserId={user?.id}
                otherUserName={studentName}
              />
            </div>
          )}
        </main>
      </div>

      {/* Picker */}
      {showPicker && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-6"
          onClick={() => { setShowPicker(false); setSearch('') }}>
          <div className="w-full max-w-sm bg-[#0a0a18] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div>
                <p className="text-white font-bold text-sm">Start a conversation</p>
                <p className="text-gray-500 text-xs mt-0.5">Students you have set work for</p>
              </div>
              <button onClick={() => { setShowPicker(false); setSearch('') }} aria-label="Close"
                className="w-8 h-8 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center">
                <FontAwesomeIcon icon={faTimes} className="text-sm" />
              </button>
            </div>

            {/* A class of forty is a long scroll without this. */}
            {students.length > 6 && (
              <div className="px-3 pt-3">
                <div className="relative">
                  <FontAwesomeIcon icon={faMagnifyingGlass}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none" />
                  <input
                    type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name or email" aria-label="Search students"
                    className="w-full bg-white/5 border border-white/8 focus:border-amber-500/40 rounded-xl pl-9 pr-3 py-2 text-white text-xs placeholder-gray-600 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="p-3 flex flex-col gap-1.5 max-h-72 overflow-y-auto">
              {available.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">
                  {search ? `Nobody matches "${search}".` : 'You already have a conversation with everyone.'}
                </p>
              ) : (
                available.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleStart(s.id)}
                    disabled={starting === s.id}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-all text-left disabled:opacity-50"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {s.full_name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-semibold truncate">{s.full_name}</p>
                      <p className="text-gray-500 text-xs truncate">{s.email}</p>
                    </div>
                    <FontAwesomeIcon
                      icon={starting === s.id ? faSpinner : faUserGraduate}
                      className={`text-gray-600 text-xs flex-shrink-0 ${starting === s.id ? 'animate-spin' : ''}`}
                    />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EvaluatorMessagesPage