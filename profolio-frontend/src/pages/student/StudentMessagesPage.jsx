import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faComments, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { listConversations } from '../../services/messaging.service'
import ChatThread from '../../components/ChatThread'
import { useAuth } from '../../context/AuthContext' // adjust if your hook/context is named differently

const StudentMessagesPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listConversations()
      .then((data) => {
        setConversations(data)
        if (data.length > 0) setSelectedId(data[0].id)
      })
      .catch((err) => console.error('Failed to load conversations:', err))
      .finally(() => setLoading(false))
  }, [])

  const selected = conversations.find((c) => c.id === selectedId)
  const professorName = selected?.professor?.full_name || 'Your Professor'

  return (
    <div className="min-h-screen bg-[#060612] font-sans px-6 py-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/student/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <div>
          <h1 className="text-white font-bold text-lg flex items-center gap-2">
            <FontAwesomeIcon icon={faComments} className="text-blue-400" /> Messages
          </h1>
          <p className="text-gray-500 text-xs">Chat with your assigned professor</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <FontAwesomeIcon icon={faSpinner} className="text-gray-500 text-2xl animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-10 text-center">
          <FontAwesomeIcon icon={faComments} className="text-gray-600 text-3xl mb-3" />
          <p className="text-gray-400 text-sm font-medium mb-1">No messages yet</p>
          <p className="text-gray-600 text-xs">
            Once a professor is assigned to review your portfolio, they'll be able to message you here.
          </p>
        </div>
      ) : (
        <div className="flex gap-4">
          {/* Conversation list */}
          <div className="w-64 flex-shrink-0 flex flex-col gap-2">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`text-left px-4 py-3 rounded-xl border transition-all ${
                  selectedId === c.id
                    ? 'border-blue-500/30 bg-blue-500/10'
                    : 'border-white/8 bg-white/[0.03] hover:border-white/20'
                }`}
              >
                <p className="text-white text-sm font-semibold truncate">
                  {c.professor?.full_name || 'Professor'}
                </p>
                <p className="text-gray-500 text-xs truncate">{c.professor?.email}</p>
              </button>
            ))}
          </div>

          {/* Thread */}
          <ChatThread
            conversationId={selectedId}
            currentUserId={user?.id}
            otherUserName={professorName}
          />
        </div>
      )}
    </div>
  )
}

export default StudentMessagesPage