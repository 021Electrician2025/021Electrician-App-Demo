'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, X, CheckCircle, AlertTriangle, Wrench, Shield } from 'lucide-react'
import { useRealtimeNotifications } from '@/lib/realtime-polling'
import { useSimpleAuth } from '@/hooks/use-simple-auth'

interface Notification {
  id: string
  type: 'work_order_created' | 'work_order_updated' | 'safety_incident' | 'ppm_schedule'
  title: string
  message: string
  timestamp: string
  read: boolean
  data?: any
}

export default function RealTimeNotifications() {
  const { user } = useSimpleAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Use our new polling-based notification system
  const { data: notifications = [] } = useRealtimeNotifications(user?.id)
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([])

  // Convert mock notifications to our format
  useEffect(() => {
    if (notifications) {
      const converted = notifications.map((notif: any) => ({
        id: notif.id,
        type: 'work_order_updated' as const,
        title: notif.title,
        message: notif.message,
        timestamp: notif.createdAt.toISOString(),
        read: notif.isRead,
        data: null
      }))
      setLocalNotifications(converted)
      setUnreadCount(converted.filter((n: any) => !n.read).length)
    }
  }, [notifications])

  const addNotification = (notification: Omit<Notification, 'id' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random()}`,
      read: false
    }

    setLocalNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)
  }

  const markAsRead = (id: string) => {
    setLocalNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setLocalNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
    setUnreadCount(0)
  }

  const removeNotification = (id: string) => {
    setLocalNotifications(prev => prev.filter(notif => notif.id !== id))
    const isUnread = localNotifications.find(n => n.id === id)?.read === false
    if (isUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'work_order_created':
      case 'work_order_updated':
        return <Wrench className="h-4 w-4 text-blue-500" />
      case 'safety_incident':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'ppm_schedule':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'work_order_created':
        return 'border-blue-200 bg-blue-50'
      case 'work_order_updated':
        return 'border-blue-200 bg-blue-50'
      case 'safety_incident':
        return 'border-red-200 bg-red-50'
      case 'ppm_schedule':
        return 'border-green-200 bg-green-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <Card className="absolute right-0 top-12 w-80 z-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Notifications</CardTitle>
                <CardDescription>Real-time updates</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                Mark all as read
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {localNotifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {localNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border ${getNotificationColor(notification.type)} ${
                        !notification.read ? 'shadow-sm' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2 flex-1">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium truncate">
                                {notification.title}
                              </h4>
                              <span className="text-xs text-muted-foreground ml-2">
                                {new Date(notification.timestamp).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNotification(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}