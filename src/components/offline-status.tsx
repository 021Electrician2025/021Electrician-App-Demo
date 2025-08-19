'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Database, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Trash2
} from 'lucide-react'
import { useOfflineMode } from '@/hooks/use-offline-mode'

export default function OfflineStatus() {
  const {
    isOnline,
    isSyncing,
    pendingItems,
    syncAll,
    clearOfflineData,
    getStorageStats
  } = useOfflineMode()

  const [stats, setStats] = useState(getStorageStats())
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getStorageStats())
    }, 5000)

    return () => clearInterval(interval)
  }, [getStorageStats])

  const handleSync = async () => {
    if (!isOnline) return

    const success = await syncAll()
    if (success) {
      setStats(getStorageStats())
    }
  }

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all offline data? This cannot be undone.')) {
      clearOfflineData()
      setStats(getStorageStats())
    }
  }

  const getLastSyncTime = () => {
    if (!stats.lastSync) return 'Never'
    return new Date(stats.lastSync).toLocaleString()
  }

  const getStorageUsage = () => {
    try {
      if (typeof window === 'undefined') return 0
      const data = localStorage.getItem('facilities_offline_data')
      if (!data) return 0
      return new Blob([data]).size / 1024 // Size in KB
    } catch {
      return 0
    }
  }

  const storageUsage = getStorageUsage()
  const maxStorage = 5120 // 5MB in KB
  const usagePercentage = Math.min((storageUsage / maxStorage) * 100, 100)

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isOnline ? 'Connected to server' : 'Working offline'}
              </p>
            </div>
            <Badge variant={isOnline ? 'default' : 'secondary'}>
              {isOnline ? 'Connected' : 'Offline'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Pending Items</p>
              <p className="text-xs text-muted-foreground">
                Items waiting to sync
              </p>
            </div>
            <Badge variant={pendingItems > 0 ? 'destructive' : 'default'}>
              {pendingItems}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Last Sync</p>
              <p className="text-xs text-muted-foreground">
                {getLastSyncTime()}
              </p>
            </div>
            {stats.lastSync && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSync} 
              disabled={!isOnline || isSyncing || pendingItems === 0}
              className="flex-1"
            >
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync Now
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowDetails(!showDetails)}
            >
              Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Used: {storageUsage.toFixed(1)} KB</span>
              <span>{maxStorage} KB max</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {usagePercentage.toFixed(1)}% of storage used
            </p>
          </div>

          {usagePercentage > 80 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Storage usage is high. Consider syncing or clearing old data.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Detailed Stats */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Offline Work Orders</p>
                <p className="text-2xl font-bold">{stats.workOrders}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Offline Comments</p>
                <p className="text-2xl font-bold">{stats.comments}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button 
                variant="destructive" 
                onClick={handleClearData}
                className="w-full"
                disabled={stats.workOrders === 0 && stats.comments === 0 && stats.queue.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Offline Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Offline Mode Info */}
      {!isOnline && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You are currently offline. Any changes you make will be saved locally and synced when you reconnect.
          </AlertDescription>
        </Alert>
      )}

      {pendingItems > 0 && isOnline && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            You have {pendingItems} item(s) waiting to sync. Click "Sync Now" to upload them to the server.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}