import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faComments, faSpinner, faUserGraduate } from '@fortawesome/free-solid-svg-icons'
import { listConversations, startConversation } from '../../services/messaging.service'
import { getAssignedPortfolios } from '../../services/evaluation.service'
import ChatThread from '../../components/ChatThread'
import { useAuth } from '../../context/AuthContext' // adjust if your hook/context is named differently

const EvaluatorMessagesPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [conversations, setConversations] = useState([])
  const [assignedStudents, setAssignedStudents] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(null) // student user_id currently being started

  const loadData = async () => {
    setLoading(true)
    try {
      const [convos, assignments] = await Promise.all([
        listConversations(),
        getAssignedPortfolios(),
      ])
      setConversations(convos)
      setAssignedStudents(assignments)
      if (convos.length > 0 && !selectedId) setSelectedId(convos[0].id)
    } catch (err) {
      console.error('Failed to load messages data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Find an existing conversation for a given student's user_id (if any)
  const findConversationForStudent = (studentUserId) =>
    conversations.find((c) => c.student_id === studentUserId)

  const handleStudentClick = async (studentUserId) => {
    const existing = findConversationForStudent(studentUserId)
    if (existing) {
      setSelectedId(existing.id)
      return
    }
    // No conversation yet - create one
    setStarting(studentUserId)
    try {
      const conversation = await startConversation(studentUserId)
      setConversations((prev) => [conversation, ...prev])
      setSelectedId(conversation.id)
    } catch (err) {
      console.error('Failed to start conversation:', err)
      alert('Failed to start conversation. Please try again.')
    } finally {
      setStarting(null)
    }
  }

  const selected = conversations.find((c) => c.id === selectedId)
  const selectedStudentName = selected?.student?.full_name || 'Student'

  return (
    <div className="min-h-screen bg-[#060612] font-sans px-6 py-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/evaluator/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <div>
          <h1 className="text-white font-bold text-lg flex items-center gap-2">
            <FontAwesomeIcon icon={faComments} className="text-blue-400" /> Messages
          </h1>
          <p className="text-gray-500 text-xs">Chat with students assigned to you</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <FontAwesomeIcon icon={faSpinner} className="text-gray-500 text-2xl animate-spin" />
        </div>
      ) : assignedStudents.length === 0 ? (
        <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-10 text-center">
          <FontAwesomeIcon icon={faUserGraduate} className="text-gray-600 text-3xl mb-3" />
          <p className="text-gray-400 text-sm font-medium mb-1">No students assigned yet</p>
          <p className="text-gray-600 text-xs">
            Once an admin assigns a student's portfolio to you for review, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="flex gap-4">
          {/* Assigned students list */}
          <div className="w-64 flex-shrink-0 flex flex-col gap-2">
            {assignedStudents.map((assignment) => {
              const studentProfile = assignment.portfolios?.student_profiles
              const studentUserId = studentProfile?.user_id
              const studentName = studentProfile?.users?.full_name || 'Student'
              const studentEmail = studentProfile?.users?.email
              const existing = findConversationForStudent(studentUserId)
              const isSelected = existing && selectedId === existing.id
              const isStarting = starting === studentUserId

              return (
                <button
                  key={assignment.id}
                  onClick={() => handleStudentClick(studentUserId)}
                  disabled={isStarting}
                  className={`text-left px-4 py-3 rounded-xl border transition-all disabled:opacity-50 ${
                    isSelected
                      ? 'border-blue-500/30 bg-blue-500/10'
                      : 'border-white/8 bg-white/[0.03] hover:border-white/20'
                  }`}
                >
                  <p className="text-white text-sm font-semibold truncate">{studentName}</p>
                  <p className="text-gray-500 text-xs truncate">{studentEmail}</p>
                  {!existing && (
                    <p className="text-blue-400 text-[10px] mt-1 font-medium">
                      {isStarting ? 'Starting chat...' : 'Tap to start chat'}
                    </p>
                  )}
                </button>
              )
            })}
          </div>

          {/* Thread */}
          <ChatThread
            conversationId={selectedId}
            currentUserId={user?.id}
            otherUserName={selectedStudentName}
          />
        </div>
      )}
    </div>
  )
}

export default EvaluatorMessagesPage