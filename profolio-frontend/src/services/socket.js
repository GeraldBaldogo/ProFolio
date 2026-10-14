import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL

let socket = null
let socketToken = null
let retryTimer = null

const currentToken = () => {
  try { return localStorage.getItem('token') } catch { return null }
}

// One live connection per browser tab, shared by every page.
//
// Two things used to leave it dead until the page was refreshed:
//  1. It was made once with whatever token existed at that moment and never
//     replaced. Signing out and in as someone else in the same tab (which is
//     exactly how testers switch accounts) kept the OLD user's connection, so
//     the server refused to let it into the new user's conversations.
//  2. When the server rejects a connection (expired token, server still
//     waking up), Socket.IO does not try again on its own.
// Now the connection is rebuilt whenever the token changes, reads the
// current token on every reconnect, and retries after a rejection.
export const getSocket = () => {
  const token = currentToken()

  if (socket && socketToken !== token) disconnectSocket()
  if (socket) return socket

  socketToken = token
  socket = io(SOCKET_URL, {
    // A function, so every reconnect sends the token as it is now.
    auth: (cb) => cb({ token: currentToken() }),
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  })

  socket.on('connect_error', () => {
    // The server refused the handshake (not a network drop, which Socket.IO
    // retries by itself). Try again shortly while someone is still signed in.
    if (socket?.active) return
    clearTimeout(retryTimer)
    retryTimer = setTimeout(() => {
      if (socket && !socket.connected && currentToken()) socket.connect()
    }, 3000)
  })

  return socket
}

export const disconnectSocket = () => {
  clearTimeout(retryTimer)
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
  socketToken = null
}