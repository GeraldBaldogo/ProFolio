import { useEffect, useRef, useState, useCallback } from 'react'
import { getSocket } from '../services/socket'
import { getMessages, postMessage } from '../services/messaging.service'

// Newest copy of each message by id, oldest first. Messages can now arrive
// twice — once from the send request and once from the live connection — and
// after a reconnect the whole history is fetched again.
const mergeMessages = (prev, incoming) => {
  const byId = new Map(prev.map((m) => [m.id, m]))
  for (const m of incoming) if (m?.id) byId.set(m.id, m)
  return [...byId.values()].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
}

// While the live connection is down, check for new messages this often.
const POLL_MS = 5000

/**
 * useConversation
 *
 * Loads a conversation's messages and keeps them up to date.
 *
 *   const { messages, loading, sending, error, sendMessage } = useConversation(conversationId)
 *
 * Sending goes through a normal request, so it works even when the live
 * connection is down. Receiving uses the live connection, re-joins the
 * conversation after every reconnect, fetches anything missed while
 * disconnected, and falls back to checking every few seconds until the
 * connection is back. None of it needs a page refresh.
 */
export function useConversation(conversationId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!conversationId) return undefined
    let cancelled = false
    const socket = getSocket()

    setMessages([])
    setError('')
    setLoading(true)

    const refresh = () =>
      getMessages(conversationId)
        .then((data) => { if (!cancelled) setMessages((prev) => mergeMessages(prev, data || [])) })
        .catch((err) => console.error('Failed to load messages:', err))

    refresh().finally(() => { if (!cancelled) setLoading(false) })

    const join = () => {
      socket.emit('join_conversation', conversationId, (res) => {
        if (!res?.success) console.error('Failed to join conversation:', res?.message)
      })
    }

    // Joining a room only lasts as long as the connection. Every new
    // connection (including automatic reconnects) joins again and catches up.
    const handleConnect = () => { join(); refresh() }
    if (socket.connected) join()
    socket.on('connect', handleConnect)

    const handleNewMessage = (message) => {
      if (message?.conversation_id === conversationId) {
        setMessages((prev) => mergeMessages(prev, [message]))
      }
    }
    socket.on('new_message', handleNewMessage)

    // Safety net: if the live connection is down, look for new messages anyway.
    const poll = setInterval(() => { if (!socket.connected) refresh() }, POLL_MS)

    return () => {
      cancelled = true
      clearInterval(poll)
      socket.off('connect', handleConnect)
      socket.off('new_message', handleNewMessage)
      socket.emit('leave_conversation', conversationId)
    }
  }, [conversationId])

  // Resolves true when the message was saved, false if it wasn't (the error
  // says why), so the box can keep the text for another try.
  const sendMessage = useCallback(async (content) => {
    const text = content?.trim()
    if (!conversationId || !text) return false
    setSending(true)
    setError('')
    try {
      const message = await postMessage(conversationId, text)
      setMessages((prev) => mergeMessages(prev, [message]))
      return true
    } catch (err) {
      setError(err.message || 'Message not sent. Please try again.')
      return false
    } finally {
      setSending(false)
    }
  }, [conversationId])

  return { messages, loading, sending, error, sendMessage }
}