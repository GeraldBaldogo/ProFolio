import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL

let socket = null

// Singleton - one socket connection per browser tab, reused across pages.
export const getSocket = () => {
  if (socket) return socket

  const token = localStorage.getItem('token')
  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}