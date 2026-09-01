import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { getSocket } from '../services/socket'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

/**
 * Listens for message_notification once, at the top of the app, so a message
 * arriving while you're on any page still produces a badge and a sound.
 *
 * The conversation pages keep their own new_message listener for the thread
 * itself — this is only about telling someone who isn't looking.
 */
export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()

  // Unread count per conversation, so a badge can be shown per thread as well
  // as in total.
  const [unread, setUnread] = useState({})
  const [toast, setToast] = useState(null)
  const [soundOn, setSoundOn] = useState(() => {
    try { return localStorage.getItem('profolio-notif-sound') !== 'off' } catch { return true }
  })

  // The conversation currently on screen. Messages arriving in it are already
  // visible, so they shouldn't raise a badge.
  const openConversation = useRef(null)
  const toastTimer = useRef(null)
  const audioCtx = useRef(null)

  // A short two-tone chime, synthesised rather than loaded — no audio file to
  // ship, and nothing to 404 in production.
  const playChime = useCallback(() => {
    if (!soundOn) return
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return
      if (!audioCtx.current) audioCtx.current = new Ctx()
      const ctx = audioCtx.current

      // Browsers suspend audio until the page has been interacted with. This
      // is why the very first notification after a fresh load is often silent —
      // it's the browser's rule, not a bug.
      if (ctx.state === 'suspended') ctx.resume()

      const now = ctx.currentTime
      const play = (freq, start, duration) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + start)
        gain.gain.setValueAtTime(0, now + start)
        gain.gain.linearRampToValueAtTime(0.14, now + start + 0.015)
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + start)
        osc.stop(now + start + duration + 0.02)
      }

      play(660, 0, 0.16)
      play(880, 0.11, 0.22)
    } catch {
      // Audio is a nicety. A browser that refuses shouldn't break the badge.
    }
  }, [soundOn])

  useEffect(() => {
    if (!user?.id) return

    const socket = getSocket()

    const handleNotification = (payload) => {
      // Already looking at this thread — no badge, no noise.
      if (payload.conversation_id === openConversation.current) return

      setUnread(prev => ({
        ...prev,
        [payload.conversation_id]: (prev[payload.conversation_id] || 0) + 1,
      }))

      setToast({
        id: payload.message_id,
        conversationId: payload.conversation_id,
        name: payload.sender_name || 'New message',
        content: payload.content,
      })

      clearTimeout(toastTimer.current)
      toastTimer.current = setTimeout(() => setToast(null), 5000)

      playChime()
    }

    socket.on('message_notification', handleNotification)
    return () => {
      socket.off('message_notification', handleNotification)
      clearTimeout(toastTimer.current)
    }
  }, [user?.id, playChime])

  const markRead = useCallback((conversationId) => {
    setUnread(prev => {
      if (!prev[conversationId]) return prev
      const next = { ...prev }
      delete next[conversationId]
      return next
    })
  }, [])

  // Called by the messages pages as the selected thread changes, so a message
  // arriving in the thread you're reading doesn't light up a badge.
  const setOpenConversation = useCallback((conversationId) => {
    openConversation.current = conversationId
    if (conversationId) markRead(conversationId)
  }, [markRead])

  const toggleSound = useCallback(() => {
    setSoundOn(v => {
      const next = !v
      try { localStorage.setItem('profolio-notif-sound', next ? 'on' : 'off') } catch { /* private mode */ }
      return next
    })
  }, [])

  const totalUnread = Object.values(unread).reduce((sum, n) => sum + n, 0)

  return (
    <NotificationContext.Provider value={{
      unread,
      totalUnread,
      toast,
      dismissToast: () => setToast(null),
      markRead,
      setOpenConversation,
      soundOn,
      toggleSound,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  // Returning a safe shape rather than throwing means a page that forgets the
  // provider renders without a badge instead of crashing.
  return ctx || {
    unread: {},
    totalUnread: 0,
    toast: null,
    dismissToast: () => {},
    markRead: () => {},
    setOpenConversation: () => {},
    soundOn: true,
    toggleSound: () => {},
  }
}