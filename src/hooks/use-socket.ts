'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseSocketOptions {
  autoConnect?: boolean
  room?: string
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { autoConnect = true, room } = options
  const socketRef = useRef<Socket | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      autoConnect,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    const socket = socketRef.current

    // Handle connection
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      reconnectAttempts.current = 0

      // Join room if specified
      if (room) {
        socket.emit('join-room', room)
      }
    })

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    // Handle connection error
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      reconnectAttempts.current++
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('Max reconnection attempts reached')
      }
    })

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [autoConnect, room])

  // Function to join a room
  const joinRoom = (roomName: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-room', roomName)
    }
  }

  // Function to leave a room
  const leaveRoom = (roomName: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', roomName)
    }
  }

  // Function to send work order update
  const sendWorkOrderUpdate = (workOrderId: string, status: string, userId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('work-order-update', {
        workOrderId,
        status,
        userId
      })
    }
  }

  // Function to send new work order notification
  const sendNewWorkOrder = (workOrder: any, userId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('new-work-order', {
        workOrder,
        userId
      })
    }
  }

  // Function to send PPM schedule update
  const sendPPMScheduleUpdate = (scheduleId: string, action: string, userId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('ppm-schedule-update', {
        scheduleId,
        action,
        userId
      })
    }
  }

  // Function to send safety incident
  const sendSafetyIncident = (incident: any, userId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('safety-incident', {
        incident,
        userId
      })
    }
  }

  // Function to send message
  const sendMessage = (text: string, senderId: string, room?: string) => {
    if (socketRef.current) {
      socketRef.current.emit('message', {
        text,
        senderId,
        room
      })
    }
  }

  // Function to listen for events
  const onWorkOrderUpdated = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('work-order-updated', callback)
    }
  }

  const onWorkOrderCreated = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('work-order-created', callback)
    }
  }

  const onPPMScheduleUpdated = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('ppm-schedule-updated', callback)
    }
  }

  const onSafetyIncidentReported = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('safety-incident-reported', callback)
    }
  }

  const onMessage = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('message', callback)
    }
  }

  // Function to remove event listeners
  const offWorkOrderUpdated = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off('work-order-updated', callback)
    }
  }

  const offWorkOrderCreated = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off('work-order-created', callback)
    }
  }

  const offPPMScheduleUpdated = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off('ppm-schedule-updated', callback)
    }
  }

  const offSafetyIncidentReported = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off('safety-incident-reported', callback)
    }
  }

  const offMessage = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off('message', callback)
    }
  }

  return {
    socket: socketRef.current,
    joinRoom,
    leaveRoom,
    sendWorkOrderUpdate,
    sendNewWorkOrder,
    sendPPMScheduleUpdate,
    sendSafetyIncident,
    sendMessage,
    onWorkOrderUpdated,
    onWorkOrderCreated,
    onPPMScheduleUpdated,
    onSafetyIncidentReported,
    onMessage,
    offWorkOrderUpdated,
    offWorkOrderCreated,
    offPPMScheduleUpdated,
    offSafetyIncidentReported,
    offMessage,
    isConnected: socketRef.current?.connected || false
  }
}