import { io, Socket } from 'socket.io-client'

const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export class SocketService {
  private static instance: Socket | null = null

  static getInstance(): Socket {
    if (!SocketService.instance) {
      SocketService.instance = io(socketUrl)
    }
    return SocketService.instance
  }
}
