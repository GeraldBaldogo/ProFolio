import { useEffect, useRef, useState, useCallback } from 'react'
import { getSocket } from '../services/socket'
import { getMessages } from '../services/messaging.service'

/**
 * useConversation
 *
 * Loads message history for a conversation, joins its Socket.IO room,
 * and keeps the message list live-updated as new messages arrive.
 *
 * Usage:
 *   const { messages, loading, sendMessage } = useConversation(conversationId)
 */
export function useConversation(conversationId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const socketRef = useRef(null)

  useEffect(() => {
    if (!conversationId) return
    let cancelled = false
    const socket = getSocket()
    socketRef.current = socket

    setLoading(true)
    getMessages(conversationId)
      .then((data) => { if (!cancelled) setMessages(data) })
      .catch((err) => console.error('Failed to load messages:', err))
      .finally(() => { if (!cancelled) setLoading(false) })

    socket.emit('join_conversation', conversationId, (res) => {
      if (!res?.success) console.error('Failed to join conversation:', res?.message)
    })

    const handleNewMessage = (message) => {
      if (message.conversation_id === conversationId) {
        setMessages((prev) => [...prev, message])
      }
    }
    socket.on('new_message', handleNewMessage)

    return () => {
      cancelled = true
      socket.off('new_message', handleNewMessage)
    }
  }, [conversationId])

  const sendMessage = useCallback((content) => {
    if (!socketRef.current || !content.trim()) return
    socketRef.current.emit(
      'send_message',
      { conversation_id: conversationId, content: content.trim() },
      (res) => {
        if (!res?.success) console.error('Send failed:', res?.message)
      }
    )
  }, [conversationId])

  return { messages, loading, sendMessage }
}