'use client'

import { useState, useEffect } from 'react'

interface OfflineQueueItem {
  id: string
  type: 'work_order' | 'comment' | 'image_upload'
  data: any
  timestamp: string
  retryCount: number
}

interface OfflineStorage {
  workOrders: any[]
  comments: any[]
  queue: OfflineQueueItem[]
  lastSync: string | null
}

export const useOfflineMode = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingItems, setPendingItems] = useState(0)

  // Storage key for offline data
  const STORAGE_KEY = 'facilities_offline_data'

  // Initialize offline storage
  const initializeStorage = (): OfflineStorage => {
    if (typeof window === 'undefined') {
      return {
        workOrders: [],
        comments: [],
        queue: [],
        lastSync: null
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error)
    }

    return {
      workOrders: [],
      comments: [],
      queue: [],
      lastSync: null
    }
  }

  // Save data to localStorage
  const saveToStorage = (data: OfflineStorage) => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  // Load data from localStorage
  const loadFromStorage = (): OfflineStorage => {
    return initializeStorage()
  }

  // Add item to offline queue
  const addToQueue = (type: OfflineQueueItem['type'], data: any) => {
    const storage = loadFromStorage()
    const queueItem: OfflineQueueItem = {
      id: `queue-${Date.now()}-${Math.random()}`,
      type,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0
    }

    storage.queue.push(queueItem)
    saveToStorage(storage)
    setPendingItems(storage.queue.length)

    // Try to sync immediately if online
    if (isOnline) {
      syncQueue()
    }
  }

  // Save work order offline
  const saveWorkOrderOffline = (workOrder: any) => {
    const storage = loadFromStorage()
    storage.workOrders.push({
      ...workOrder,
      id: `offline-${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString(),
      isOffline: true
    })
    saveToStorage(storage)
  }

  // Save comment offline
  const saveCommentOffline = (comment: any) => {
    const storage = loadFromStorage()
    storage.comments.push({
      ...comment,
      id: `offline-${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString(),
      isOffline: true
    })
    saveToStorage(storage)
  }

  // Get offline work orders
  const getOfflineWorkOrders = (): any[] => {
    const storage = loadFromStorage()
    return storage.workOrders.filter(wo => wo.isOffline)
  }

  // Get offline comments
  const getOfflineComments = (): any[] => {
    const storage = loadFromStorage()
    return storage.comments.filter(c => c.isOffline)
  }

  // Sync queue with server
  const syncQueue = async () => {
    if (!isOnline || isSyncing) return

    const storage = loadFromStorage()
    if (storage.queue.length === 0) return

    setIsSyncing(true)
    const failedItems: OfflineQueueItem[] = []

    for (const item of storage.queue) {
      try {
        let success = false

        switch (item.type) {
          case 'work_order':
            const workOrderResponse = await fetch('/api/work-orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data)
            })
            success = workOrderResponse.ok
            break

          case 'comment':
            const commentResponse = await fetch(`/api/work-orders/${item.data.workOrderId}/comments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data)
            })
            success = commentResponse.ok
            break

          case 'image_upload':
            const formData = new FormData()
            formData.append('file', item.data.file)
            
            const imageResponse = await fetch('/api/upload', {
              method: 'POST',
              body: formData
            })
            success = imageResponse.ok
            break
        }

        if (!success) {
          item.retryCount++
          if (item.retryCount < 3) {
            failedItems.push(item)
          }
        }
      } catch (error) {
        console.error(`Failed to sync ${item.type}:`, error)
        item.retryCount++
        if (item.retryCount < 3) {
          failedItems.push(item)
        }
      }
    }

    // Update storage
    storage.queue = failedItems
    storage.lastSync = new Date().toISOString()
    saveToStorage(storage)
    setPendingItems(failedItems.length)
    setIsSyncing(false)

    // Return success status
    return failedItems.length === 0
  }

  // Sync all offline data
  const syncAll = async () => {
    if (!isOnline) return false

    setIsSyncing(true)
    let allSynced = true

    try {
      // Sync work orders first
      const storage = loadFromStorage()
      const offlineWorkOrders = storage.workOrders.filter(wo => wo.isOffline)

      for (const workOrder of offlineWorkOrders) {
        try {
          const response = await fetch('/api/work-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...workOrder,
              isOffline: undefined // Remove offline flag
            })
          })

          if (response.ok) {
            // Remove from offline storage
            storage.workOrders = storage.workOrders.filter(wo => wo.id !== workOrder.id)
          } else {
            allSynced = false
          }
        } catch (error) {
          console.error('Failed to sync work order:', error)
          allSynced = false
        }
      }

      // Sync comments
      const offlineComments = storage.comments.filter(c => c.isOffline)
      for (const comment of offlineComments) {
        try {
          const response = await fetch(`/api/work-orders/${comment.workOrderId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...comment,
              isOffline: undefined
            })
          })

          if (response.ok) {
            storage.comments = storage.comments.filter(c => c.id !== comment.id)
          } else {
            allSynced = false
          }
        } catch (error) {
          console.error('Failed to sync comment:', error)
          allSynced = false
        }
      }

      // Sync queue
      const queueSynced = await syncQueue()
      allSynced = allSynced && queueSynced

      // Update last sync time
      storage.lastSync = new Date().toISOString()
      saveToStorage(storage)

    } catch (error) {
      console.error('Error during sync:', error)
      allSynced = false
    }

    setIsSyncing(false)
    return allSynced
  }

  // Clear offline data
  const clearOfflineData = () => {
    const storage: OfflineStorage = {
      workOrders: [],
      comments: [],
      queue: [],
      lastSync: null
    }
    saveToStorage(storage)
    setPendingItems(0)
  }

  // Get storage stats
  const getStorageStats = () => {
    const storage = loadFromStorage()
    return {
      workOrders: storage.workOrders.length,
      comments: storage.comments.length,
      queue: storage.queue.length,
      lastSync: storage.lastSync
    }
  }

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Auto-sync when coming back online
      setTimeout(syncQueue, 1000)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  // Update pending items count
  useEffect(() => {
    const storage = loadFromStorage()
    setPendingItems(storage.queue.length)
  }, [])

  return {
    isOnline,
    isSyncing,
    pendingItems,
    addToQueue,
    saveWorkOrderOffline,
    saveCommentOffline,
    getOfflineWorkOrders,
    getOfflineComments,
    syncQueue,
    syncAll,
    clearOfflineData,
    getStorageStats
  }
}