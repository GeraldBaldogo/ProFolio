import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faSpinner, faComments, faPen, faXmark } from '@fortawesome/free-solid-svg-icons'
import { useConversation } from '../hooks/useConversation'
import { setNickname } from '../services/messaging.service'
import { chatSides } from '../utils/chatNames'

/**
 * ChatThread - reusable message thread, used by both student and
 * evaluator message pages.
 *
 * Props:
 *  - conversationId: the conversation to display/send in
 *  - currentUserId: the logged-in user's id (to tell own vs other messages apart)
 *  - otherUserName: display name of the other participant, shown in header
 *  - conversation: the conversation row (for nicknames), optional
 *  - onConversationChange(conversation): called after a nickname is saved
 */
const ChatThread = ({ conversationId, currentUserId, otherUserName, conversation, onConversationChange }) => {
  const { messages, loading, sending, error, sendMessage } = useConversation(conversationId)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef(null)

  // Nicknames, Messenger-style: either person can name either side, and both
  // see it. Only used inside Messages.
  const { me, other } = chatSides(conversation, currentUserId)
  const otherReal = conversation ? other.real : (otherUserName || 'Conversation')
  const otherShown = conversation ? other.display : (otherUserName || 'Conversation')
  const [editingNames, setEditingNames] = useState(false)
  const [names, setNames] = useState({ me: '', other: '' })
  const [savingNames, setSavingNames] = useState(false)
  const [namesError, setNamesError] = useState('')

  useEffect(() => { setEditingNames(false); setNamesError('') }, [conversationId])

  const openNames = () => {
    setNames({ me: me.nickname, other: other.nickname })
    setNamesError('')
    setEditingNames(true)
  }

  const saveNames = async (e) => {
    e?.preventDefault()
    setSavingNames(true)
    setNamesError('')
    try {
      let latest = conversation
      if ((names.other.trim()) !== (other.nickname || '')) {
        latest = { ...latest, ...(await setNickname(conversationId, other.side, names.other)) }
      }
      if ((names.me.trim()) !== (me.nickname || '')) {
        latest = { ...latest, ...(await setNickname(conversationId, me.side, names.me)) }
      }
      if (latest !== conversation) onConversationChange?.(latest)
      setEditingNames(false)
    } catch (err) {
      setNamesError(err.message)
    } finally {
      setSavingNames(false)
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = draft
    if (!text.trim() || sending) return
    // Clear straight away so it feels instant; put the text back if it failed.
    setDraft('')
    const ok = await sendMessage(text)
    if (!ok) setDraft((d) => d || text)
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
      <div className="flex items-center gap-3 px-5 py-3.5 bg-white/[0.03] border-b border-white/5">
        <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <FontAwesomeIcon icon={faComments} className="text-blue-400 text-sm" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white font-semibold text-sm truncate">{otherShown}</p>
          {otherShown !== otherReal && (
            <p className="text-gray-500 text-[11px] truncate">{otherReal}</p>
          )}
        </div>
        {conversation && (
          <button
            type="button"
            onClick={() => (editingNames ? setEditingNames(false) : openNames())}
            aria-label={editingNames ? 'Close nicknames' : 'Edit nicknames'}
            title="Nicknames"
            className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <FontAwesomeIcon icon={editingNames ? faXmark : faPen} className="text-xs" />
          </button>
        )}
      </div>

      {editingNames && (
        <form onSubmit={saveNames} className="px-5 py-4 bg-white/[0.03] border-b border-white/5 flex flex-col gap-3">
          <p className="text-gray-400 text-xs">
            Nicknames show only in this chat, for both of you. Leave one empty to use the real name.
          </p>
          <label className="flex flex-col gap-1">
            <span className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider">Nickname for {other.real}</span>
            <input value={names.other} maxLength={40} onChange={(e) => setNames((n) => ({ ...n, other: e.target.value }))}
              placeholder={other.real}
              className="bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500/40 placeholder:text-gray-600" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider">Your nickname</span>
            <input value={names.me} maxLength={40} onChange={(e) => setNames((n) => ({ ...n, me: e.target.value }))}
              placeholder={me.real}
              className="bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500/40 placeholder:text-gray-600" />
          </label>
          {namesError && <p role="alert" className="text-rose-300 text-xs">{namesError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditingNames(false)} disabled={savingNames}
              className="px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={savingNames}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 transition-colors">
              {savingNames ? 'Saving\u2026' : 'Save'}
            </button>
          </div>
        </form>
      )}

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
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] ${
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

      {error && (
        <p role="alert" className="px-4 py-2 text-xs text-rose-300 bg-rose-500/10 border-t border-rose-500/20">{error}</p>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.03] border-t border-white/5">
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
          disabled={!draft.trim() || sending}
          aria-label="Send message"
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-blue-500 hover:bg-blue-600 disabled:opacity-30 text-white rounded-xl transition-all"
        >
          <FontAwesomeIcon icon={sending ? faSpinner : faPaperPlane} className={`text-sm ${sending ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  )
}

export default ChatThread