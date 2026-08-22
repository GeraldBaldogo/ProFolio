import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faFolder, faRobot, faStar, faUser, faBars, faTimes,
  faRightFromBracket, faTrophy, faChartLine, faSpinner, faClipboardList,
  faFileAlt, faComments, faFingerprint, faLightbulb, faPaperPlane,
  faTriangleExclamation, faTrashCan, faMicrophone, faStop,
  faVolumeHigh, faVolumeXmark, faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import { sendChatMessage, getChatHistory, clearChatHistory } from '../../services/chatbot.service'
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
  { label: 'Assistant', icon: faWandMagicSparkles, path: '/student/assistant' },
  { label: 'Messages', icon: faComments, path: '/student/messages' },
  { label: 'Profile', icon: faUser, path: '/student/profile' },
]

// Openers, so a student isn't staring at an empty box wondering what this is
// for. Each one is something the assistant can genuinely answer.
const SUGGESTIONS = [
  'How does the scoring work?',
  'What should I put in my portfolio?',
  'How do I get ready for a coding assessment?',
  'What certifications are worth taking?',
]

const StudentAssistant = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  // Voice — the panel asked for "voice-enabled or conversational AI", so both
  // directions are here: speech in, speech out.
  const [listening, setListening] = useState(false)
  const [speakReplies, setSpeakReplies] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)

  const scrollRef = useRef(null)
  const recognitionRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { loadHistory() }, [])

  // Speech recognition is Chrome/Edge only. Setting up the object once and
  // checking for it means the button simply doesn't appear elsewhere, rather
  // than appearing and failing.
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (e) => {
      const said = e.results[0][0].transcript
      setInput(prev => (prev ? `${prev} ${said}` : said))
      inputRef.current?.focus()
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    setVoiceSupported(true)

    return () => {
      try { recognition.stop() } catch { /* already stopped */ }
      window.speechSynthesis?.cancel()
    }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  const loadHistory = async () => {
    setLoading(true)
    setError('')
    try {
      const history = await getChatHistory()
      setMessages(history || [])
    } catch (err) {
      setError(err.message || 'Couldn\u2019t load your conversation.')
    } finally {
      setLoading(false)
    }
  }

  const speak = (text) => {
    if (!speakReplies || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.05
    window.speechSynthesis.speak(utterance)
  }

  const handleSend = async (text) => {
    const content = (text ?? input).trim()
    if (!content || sending) return

    // Show the student's own message straight away. Waiting for the round trip
    // makes the app feel broken on a slow connection.
    const optimistic = { id: `local-${Date.now()}`, role: 'user', content }
    setMessages(prev => [...prev, optimistic])
    setInput('')
    setSending(true)
    setError('')

    try {
      const res = await sendChatMessage(content)
      setMessages(prev => [...prev, {
        id: `reply-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
      }])
      speak(res.reply)
    } catch (err) {
      // Put their message back in the box rather than losing it, and take the
      // failed one off the thread so it doesn't look like it was sent.
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setInput(content)
      setError(err.message || 'Couldn\u2019t send that. Try again.')
    } finally {
      setSending(false)
    }
  }

  const toggleListening = () => {
    const recognition = recognitionRef.current
    if (!recognition) return
    if (listening) {
      recognition.stop()
      setListening(false)
    } else {
      try {
        recognition.start()
        setListening(true)
      } catch {
        setListening(false)
      }
    }
  }

  const handleClear = async () => {
    if (!window.confirm('Clear this conversation? It can\u2019t be undone.')) return
    try {
      await clearChatHistory()
      setMessages([])
      window.speechSynthesis?.cancel()
    } catch (err) {
      setError(err.message || 'Couldn\u2019t clear the conversation.')
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
            <FontAwesomeIcon icon={faRightFromBracket} className="text-sm" /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col h-screen">

        <header className="sticky top-0 z-30 bg-[#060612]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4 flex-shrink-0">
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <FontAwesomeIcon icon={faBars} className="text-lg" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">ProFolio Assistant</h1>
            <p className="text-gray-500 text-xs">Ask about your assessments, portfolio, or what to learn next</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Speech output is off by default — nobody wants a laptop talking
                at them in a computer lab without being asked. */}
            {'speechSynthesis' in window && (
              <button
                onClick={() => {
                  setSpeakReplies(v => !v)
                  window.speechSynthesis.cancel()
                }}
                title={speakReplies ? 'Turn off spoken replies' : 'Read replies aloud'}
                className={`w-9 h-9 border rounded-xl flex items-center justify-center transition-all ${
                  speakReplies
                    ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                    : 'border-white/8 bg-white/[0.03] text-gray-400 hover:text-white'
                }`}
              >
                <FontAwesomeIcon icon={speakReplies ? faVolumeHigh : faVolumeXmark} className="text-sm" />
              </button>
            )}
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                title="Clear conversation"
                className="w-9 h-9 border border-white/8 bg-white/[0.03] rounded-xl flex items-center justify-center text-gray-400 hover:text-rose-400 transition-all"
              >
                <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
              </button>
            )}
          </div>
        </header>

        {/* Thread */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-2xl mx-auto flex flex-col gap-4">

            {loading ? (
              <div className="flex items-center justify-center h-40">
                <FontAwesomeIcon icon={faSpinner} className="text-blue-400 text-2xl animate-spin" />
              </div>

            ) : messages.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faWandMagicSparkles} className="text-white text-xl" />
                </div>
                <p className="text-white font-bold text-lg mb-1">How can I help?</p>
                <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
                  I can explain how ProFolio works, how your scores are worked out,
                  and what to focus on next.
                </p>
                <div className="flex flex-col gap-2 max-w-sm mx-auto">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s)}
                      className="border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] text-gray-300 hover:text-white text-sm text-left px-4 py-3 rounded-xl transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FontAwesomeIcon icon={faWandMagicSparkles} className="text-white text-xs" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-6 ${
                    m.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'border border-white/8 bg-white/[0.03] text-gray-300 rounded-bl-md'
                  }`}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))
            )}

            {sending && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FontAwesomeIcon icon={faWandMagicSparkles} className="text-white text-xs" />
                </div>
                <div className="border border-white/8 bg-white/[0.03] px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-white/5 px-6 py-4 flex-shrink-0">
          <div className="max-w-2xl mx-auto">

            {error && (
              <div className="border border-rose-500/20 bg-rose-500/5 rounded-xl px-4 py-2.5 mb-3 flex items-center gap-3">
                <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 text-sm flex-shrink-0" />
                <p className="text-rose-400 text-xs flex-1">{error}</p>
              </div>
            )}

            {listening && (
              <div className="border border-blue-500/20 bg-blue-500/5 rounded-xl px-4 py-2.5 mb-3 flex items-center gap-3">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse flex-shrink-0" />
                <p className="text-blue-400 text-xs">Listening — speak now</p>
              </div>
            )}

            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  // Enter sends, Shift+Enter makes a new line — what people
                  // expect from a chat box.
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                rows={1}
                placeholder="Ask me anything about ProFolio..."
                className="flex-1 bg-white/5 border border-white/8 hover:border-white/15 focus:border-blue-500/40 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none resize-none transition-all max-h-32"
                style={{ minHeight: '46px' }}
              />

              {voiceSupported && (
                <button
                  onClick={toggleListening}
                  title={listening ? 'Stop listening' : 'Speak instead of typing'}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 ${
                    listening
                      ? 'bg-rose-500 text-white'
                      : 'border border-white/8 bg-white/[0.03] text-gray-400 hover:text-white'
                  }`}
                >
                  <FontAwesomeIcon icon={listening ? faStop : faMicrophone} className="text-sm" />
                </button>
              )}

              <button
                onClick={() => handleSend()}
                disabled={sending || !input.trim()}
                className="w-11 h-11 bg-blue-500 hover:bg-blue-600 disabled:opacity-30 text-white rounded-2xl flex items-center justify-center transition-all flex-shrink-0"
              >
                <FontAwesomeIcon icon={sending ? faSpinner : faPaperPlane} className={`text-sm ${sending ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <p className="text-gray-700 text-[11px] mt-2 text-center">
              The assistant can be wrong — check anything important with your professor.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentAssistant