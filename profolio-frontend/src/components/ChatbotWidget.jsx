import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRobot, faTimes, faPaperPlane, faMicrophone, faMicrophoneSlash,
  faVolumeHigh, faVolumeXmark, faSpinner, faTrash, faComments,
} from '@fortawesome/free-solid-svg-icons'
import { sendChatMessage, getChatHistory, clearChatHistory } from '../services/chatbot.service'

// Browser Speech Recognition (Chrome/Edge). Gracefully degrades if unsupported.
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)

  const recognitionRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen && !historyLoaded) loadHistory()
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const loadHistory = async () => {
    try {
      const history = await getChatHistory()
      setMessages(history.map((m) => ({ role: m.role, content: m.content })))
    } catch {
      setMessages([])
    } finally {
      setHistoryLoaded(true)
    }
  }

  const speak = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }

  const handleSend = async (textOverride) => {
    const text = (textOverride ?? input).trim()
    if (!text || loading) return

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)

    try {
      const { reply } = await sendChatMessage(text)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      speak(reply)
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: "Sorry, may nagka-problema sa pagkuha ng sagot. Please try again."
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleMicClick = () => {
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Try Chrome or Edge.')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-PH'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      handleSend(transcript)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const handleClear = async () => {
    if (!confirm('Clear this conversation? This cannot be undone.')) return
    try {
      await clearChatHistory()
      setMessages([])
    } catch {
      // silent fail is fine here, non-critical action
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center text-white hover:scale-105 transition-transform"
      >
        <FontAwesomeIcon icon={isOpen ? faTimes : faComments} className="text-xl" />
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[70vh] bg-[#0a0a18] border border-white/8 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faRobot} className="text-white text-sm" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-bold truncate">ProFolio Assistant</p>
              <p className="text-gray-500 text-[11px] truncate">Ask about skills, assessments & career tips</p>
            </div>
            <button
              onClick={() => setVoiceEnabled((v) => !v)}
              title={voiceEnabled ? 'Voice replies: on' : 'Voice replies: off'}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${voiceEnabled ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              <FontAwesomeIcon icon={voiceEnabled ? faVolumeHigh : faVolumeXmark} className="text-xs" />
            </button>
            <button
              onClick={handleClear}
              title="Clear conversation"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all flex-shrink-0"
            >
              <FontAwesomeIcon icon={faTrash} className="text-xs" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.length === 0 && !loading && (
              <div className="text-center text-gray-600 text-xs mt-8 px-4">
                Hi! Ako si ProFolio Assistant. Pwede mo akong tanungin tungkol sa assessments mo, portfolio,
                o kung anong dapat mong gawin next. Type ka lang o pindutin ang mic para mag-voice.
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-violet-500 text-white rounded-br-sm'
                      : 'bg-white/[0.05] border border-white/8 text-gray-200 rounded-bl-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.05] border border-white/8 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                  <FontAwesomeIcon icon={faSpinner} className="text-blue-400 text-sm animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/5 bg-white/[0.02] flex items-center gap-2">
            <button
              onClick={handleMicClick}
              title={isListening ? 'Stop listening' : 'Speak your message'}
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                isListening ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-white/[0.03] border border-white/8 text-gray-400 hover:text-white'
              }`}
            >
              <FontAwesomeIcon icon={isListening ? faMicrophoneSlash : faMicrophone} className="text-sm" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? 'Listening...' : 'Type your message...'}
              disabled={loading}
              className="flex-1 min-w-0 bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/40"
            />

            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40 transition-opacity"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}