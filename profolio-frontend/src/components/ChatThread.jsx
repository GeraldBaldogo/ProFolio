import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faSpinner, faComments } from '@fortawesome/free-solid-svg-icons'
import { useConversation } from '../hooks/useConversation'

/**
 * ChatThread - reusable message thread, used by both student and
 * evaluator message pages.
 *
 * Props:
 *  - conversationId: the conversation to display/send in
 *  - currentUserId: the logged-in user's id (to tell own vs other messages apart)
 *  - otherUserName: display name of the other participant, shown in header
 */
const ChatThread = ({ conversationId, currentUserId, otherUserName }) => {
  const { messages, loading, sendMessage } = useConversation(conversationId)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!draft.trim()) return
    sendMessage(draft)
    setDraft('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
        Select a conversation to start chatting
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col border border-white/8 bg-[#0a0a18] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-[#060610] border-b border-white/5">
        <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <FontAwesomeIcon icon={faComments} className="text-blue-400 text-sm" />
        </div>
        <p className="text-white font-semibold text-sm">{otherUserName || 'Conversation'}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 min-h-[320px] max-h-[480px]">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <FontAwesomeIcon icon={faSpinner} className="text-gray-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-600 text-xs">
            No messages yet — say hello!
          </div>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_id === currentUserId
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMine
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-white/5 border border-white/8 text-gray-200 rounded-bl-sm'
                  }`}
                >
                  {m.content}
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-blue-100/70' : 'text-gray-500'}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#060610] border-t border-white/5">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm resize-none outline-none focus:border-blue-500/40 placeholder:text-gray-600"
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim()}
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-blue-500 hover:bg-blue-600 disabled:opacity-30 text-white rounded-xl transition-all"
        >
          <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
        </button>
      </div>
    </div>
  )
}

export default ChatThread