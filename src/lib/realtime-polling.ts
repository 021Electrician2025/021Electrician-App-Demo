// Replacement for Socket.IO with React Query polling for Vercel compatibility
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from '@/hooks/use-toast'

// Polling intervals (in milliseconds)
const WORK_ORDER_POLL_INTERVAL = 5000 // 5 seconds
const NOTIFICATION_POLL_INTERVAL = 10000 // 10 seconds

// Custom hook to simulate real-time work order updates
export function useRealtimeWorkOrders(userId?: string) {
  const queryClient = useQueryClient()
  
  const { data: workOrders } = useQuery({
    queryKey: ['work-orders'],
    queryFn: async () => {
      const response = await fetch('/api/work-orders')
      return response.json()
    },
    refetchInterval: WORK_ORDER_POLL_INTERVAL,
    enabled: !!userId
  })

  // Simulate real-time notifications when work orders change
  useEffect(() => {
    if (workOrders) {
      // Check for new work orders (in a real app, you'd compare with previous data)
      const recentWorkOrder = workOrders.find((wo: any) => {
        const createdAt = new Date(wo.createdAt)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
        return createdAt > tenMinutesAgo && wo.status === 'LOGGED'
      })

      if (recentWorkOrder && recentWorkOrder.assignedToId === userId) {
        toast({
          title: "New Work Order Assigned",
          description: `${recentWorkOrder.title} - Priority: ${recentWorkOrder.priority}`,
          duration: 5000
        })
      }
    }
  }, [workOrders, userId])

  return workOrders
}

// Custom hook for real-time notifications
export function useRealtimeNotifications(userId?: string) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      // Mock notifications - in real app would fetch from API
      return [
        {
          id: 'notif-1',
          title: 'SLA Alert',
          message: 'Work order #WO-002 is approaching SLA deadline',
          type: 'warning',
          isRead: false,
          createdAt: new Date(Date.now() - 5 * 60 * 1000)
        },
        {
          id: 'notif-2',
          title: 'PPM Task Due',
          message: 'Pool System Filter Check is overdue',
          type: 'error',
          isRead: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }
      ]
    },
    refetchInterval: NOTIFICATION_POLL_INTERVAL,
    enabled: !!userId
  })
}

// Custom hook for dashboard stats with polling
export function useRealtimeDashboardStats(hotelId?: string) {
  return useQuery({
    queryKey: ['dashboard-stats', hotelId],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats')
      return response.json()
    },
    refetchInterval: WORK_ORDER_POLL_INTERVAL,
    enabled: !!hotelId
  })
}

// Helper function to invalidate queries (simulates Socket.IO room updates)
export function invalidateRealtimeQueries(queryClient: any) {
  queryClient.invalidateQueries({ queryKey: ['work-orders'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
  queryClient.invalidateQueries({ queryKey: ['notifications'] })
}

// Optimistic updates helper
export function useOptimisticUpdates() {
  const queryClient = useQueryClient()

  const updateWorkOrder = (workOrderId: string, updates: any) => {
    // Optimistic update
    queryClient.setQueryData(['work-orders'], (old: any) => {
      if (!old) return old
      return old.map((wo: any) => 
        wo.id === workOrderId ? { ...wo, ...updates } : wo
      )
    })

    // Show immediate feedback
    toast({
      title: "Work Order Updated",
      description: "Changes have been saved successfully",
    })

    // Invalidate to refetch actual data
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    }, 1000)
  }

  const createWorkOrder = (newWorkOrder: any) => {
    // Show immediate feedback
    toast({
      title: "Work Order Created",
      description: `${newWorkOrder.title} has been logged successfully`,
    })

    // Invalidate queries to show new data
    queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
  }

  return {
    updateWorkOrder,
    createWorkOrder
  }
}

// Mock real-time events for demo purposes
export function triggerMockRealtimeEvents(queryClient: any) {
  // Simulate receiving real-time updates
  setInterval(() => {
    // Randomly trigger some "events"
    if (Math.random() < 0.1) { // 10% chance every poll
      toast({
        title: "System Update",
        description: "New maintenance alert received",
        variant: "default"
      })
    }
  }, 30000) // Every 30 seconds
}