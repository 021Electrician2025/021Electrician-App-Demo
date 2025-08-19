'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Palette, 
  Save,
  RefreshCw,
  Download,
  Upload,
  CheckCircle
} from 'lucide-react'
import { useSimpleAuth } from '@/hooks/use-simple-auth'
import { toast } from '@/hooks/use-toast'
import OfflineStatus from '@/components/offline-status'

interface UserSettings {
  notifications: {
    email: boolean
    push: boolean
    workOrderUpdates: boolean
    safetyAlerts: boolean
    ppmReminders: boolean
  }
  display: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    timezone: string
    dateFormat: string
  }
  privacy: {
    profileVisibility: 'public' | 'private' | 'team'
    activityTracking: boolean
    dataSharing: boolean
  }
}

interface SystemSettings {
  general: {
    siteName: string
    siteDescription: string
    adminEmail: string
    defaultTimezone: string
    maintenanceMode: boolean
  }
  security: {
    sessionTimeout: number
    passwordPolicy: {
      minLength: number
      requireUppercase: boolean
      requireNumbers: boolean
      requireSpecialChars: boolean
    }
    twoFactorAuth: boolean
    loginAttempts: number
  }
  integrations: {
    emailProvider: string
    smtpServer: string
    smtpPort: number
    apiKeys: string[]
  }
}

export default function SettingsPage() {
  const { user } = useSimpleAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [userSettings, setUserSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: true,
      workOrderUpdates: true,
      safetyAlerts: true,
      ppmReminders: false
    },
    display: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY'
    },
    privacy: {
      profileVisibility: 'team',
      activityTracking: true,
      dataSharing: false
    }
  })

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    general: {
      siteName: 'Hotel Facilities Manager',
      siteDescription: 'Comprehensive facilities management system',
      adminEmail: 'admin@hotel.com',
      defaultTimezone: 'UTC',
      maintenanceMode: false
    },
    security: {
      sessionTimeout: 30,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialChars: false
      },
      twoFactorAuth: false,
      loginAttempts: 5
    },
    integrations: {
      emailProvider: 'smtp',
      smtpServer: 'smtp.gmail.com',
      smtpPort: 587,
      apiKeys: []
    }
  })

  const saveUserSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userSettings)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User settings saved successfully"
        })
      }
    } catch (error) {
      console.error('Failed to save user settings:', error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveSystemSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/system/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemSettings)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "System settings saved successfully"
        })
      }
    } catch (error) {
      console.error('Failed to save system settings:', error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const exportSettings = () => {
    const data = {
      userSettings,
      systemSettings,
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `settings-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    toast({
      title: "Success",
      description: "Settings exported successfully"
    })
  }

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.userSettings) setUserSettings(data.userSettings)
        if (data.systemSettings) setSystemSettings(data.systemSettings)
        
        toast({
          title: "Success",
          description: "Settings imported successfully"
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to import settings",
          variant: "destructive"
        })
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure system and user preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Label htmlFor="import-settings" className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </span>
            </Button>
          </Label>
          <input
            id="import-settings"
            type="file"
            accept=".json"
            className="hidden"
            onChange={importSettings}
          />
        </div>
      </div>

      <Tabs defaultValue="user" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="user">User Settings</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
          <TabsTrigger value="offline">Offline Mode</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        {/* User Settings */}
        <TabsContent value="user" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Configure how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email updates</p>
                  </div>
                  <Switch
                    checked={userSettings.notifications.email}
                    onCheckedChange={(checked) => 
                      setUserSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, email: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Browser push notifications</p>
                  </div>
                  <Switch
                    checked={userSettings.notifications.push}
                    onCheckedChange={(checked) => 
                      setUserSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, push: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Work Order Updates</Label>
                    <p className="text-sm text-muted-foreground">Status changes and assignments</p>
                  </div>
                  <Switch
                    checked={userSettings.notifications.workOrderUpdates}
                    onCheckedChange={(checked) => 
                      setUserSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, workOrderUpdates: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Safety Alerts</Label>
                    <p className="text-sm text-muted-foreground">Safety incidents and compliance</p>
                  </div>
                  <Switch
                    checked={userSettings.notifications.safetyAlerts}
                    onCheckedChange={(checked) => 
                      setUserSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, safetyAlerts: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>PPM Reminders</Label>
                    <p className="text-sm text-muted-foreground">Preventive maintenance schedules</p>
                  </div>
                  <Switch
                    checked={userSettings.notifications.ppmReminders}
                    onCheckedChange={(checked) => 
                      setUserSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, ppmReminders: checked }
                      }))
                    }
                  />
                </div>

                <Button onClick={saveUserSettings} disabled={isLoading} className="w-full">
                  {isLoading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>

            {/* Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Display
                </CardTitle>
                <CardDescription>
                  Customize the appearance and language
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Theme</Label>
                  <Select 
                    value={userSettings.display.theme}
                    onValueChange={(value: 'light' | 'dark' | 'auto') => 
                      setUserSettings(prev => ({
                        ...prev,
                        display: { ...prev.display, theme: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Language</Label>
                  <Select 
                    value={userSettings.display.language}
                    onValueChange={(value) => 
                      setUserSettings(prev => ({
                        ...prev,
                        display: { ...prev.display, language: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Timezone</Label>
                  <Select 
                    value={userSettings.display.timezone}
                    onValueChange={(value) => 
                      setUserSettings(prev => ({
                        ...prev,
                        display: { ...prev.display, timezone: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date Format</Label>
                  <Select 
                    value={userSettings.display.dateFormat}
                    onValueChange={(value) => 
                      setUserSettings(prev => ({
                        ...prev,
                        display: { ...prev.display, dateFormat: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={saveUserSettings} disabled={isLoading} className="w-full">
                  {isLoading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Save Display Settings
                </Button>
              </CardContent>
            </Card>

            {/* Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy
                </CardTitle>
                <CardDescription>
                  Manage your privacy and data sharing preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Profile Visibility</Label>
                  <Select 
                    value={userSettings.privacy.profileVisibility}
                    onValueChange={(value: 'public' | 'private' | 'team') => 
                      setUserSettings(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, profileVisibility: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="team">Team Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Activity Tracking</Label>
                    <p className="text-sm text-muted-foreground">Track user activity</p>
                  </div>
                  <Switch
                    checked={userSettings.privacy.activityTracking}
                    onCheckedChange={(checked) => 
                      setUserSettings(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, activityTracking: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Data Sharing</Label>
                    <p className="text-sm text-muted-foreground">Share analytics data</p>
                  </div>
                  <Switch
                    checked={userSettings.privacy.dataSharing}
                    onCheckedChange={(checked) => 
                      setUserSettings(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, dataSharing: checked }
                      }))
                    }
                  />
                </div>

                <Button onClick={saveUserSettings} disabled={isLoading} className="w-full">
                  {isLoading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Save Privacy Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General */}
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Basic system configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={systemSettings.general.siteName}
                    onChange={(e) => 
                      setSystemSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, siteName: e.target.value }
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={systemSettings.general.siteDescription}
                    onChange={(e) => 
                      setSystemSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, siteDescription: e.target.value }
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={systemSettings.general.adminEmail}
                    onChange={(e) => 
                      setSystemSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, adminEmail: e.target.value }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Disable user access</p>
                  </div>
                  <Switch
                    checked={systemSettings.general.maintenanceMode}
                    onCheckedChange={(checked) => 
                      setSystemSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, maintenanceMode: checked }
                      }))
                    }
                  />
                </div>

                <Button onClick={saveSystemSettings} disabled={isLoading} className="w-full">
                  {isLoading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Save General Settings
                </Button>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure security policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={systemSettings.security.sessionTimeout}
                    onChange={(e) => 
                      setSystemSettings(prev => ({
                        ...prev,
                        security: { 
                          ...prev.security, 
                          sessionTimeout: parseInt(e.target.value) 
                        }
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="minLength">Minimum Password Length</Label>
                  <Input
                    id="minLength"
                    type="number"
                    value={systemSettings.security.passwordPolicy.minLength}
                    onChange={(e) => 
                      setSystemSettings(prev => ({
                        ...prev,
                        security: { 
                          ...prev.security, 
                          passwordPolicy: { 
                            ...prev.security.passwordPolicy, 
                            minLength: parseInt(e.target.value) 
                          }
                        }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Uppercase Letters</Label>
                    <p className="text-sm text-muted-foreground">Password complexity</p>
                  </div>
                  <Switch
                    checked={systemSettings.security.passwordPolicy.requireUppercase}
                    onCheckedChange={(checked) => 
                      setSystemSettings(prev => ({
                        ...prev,
                        security: { 
                          ...prev.security, 
                          passwordPolicy: { 
                            ...prev.security.passwordPolicy, 
                            requireUppercase: checked 
                          }
                        }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Numbers</Label>
                    <p className="text-sm text-muted-foreground">Password complexity</p>
                  </div>
                  <Switch
                    checked={systemSettings.security.passwordPolicy.requireNumbers}
                    onCheckedChange={(checked) => 
                      setSystemSettings(prev => ({
                        ...prev,
                        security: { 
                          ...prev.security, 
                          passwordPolicy: { 
                            ...prev.security.passwordPolicy, 
                            requireNumbers: checked 
                          }
                        }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Enhanced security</p>
                  </div>
                  <Switch
                    checked={systemSettings.security.twoFactorAuth}
                    onCheckedChange={(checked) => 
                      setSystemSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, twoFactorAuth: checked }
                      }))
                    }
                  />
                </div>

                <Button onClick={saveSystemSettings} disabled={isLoading} className="w-full">
                  {isLoading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Offline Mode */}
        <TabsContent value="offline">
          <OfflineStatus />
        </TabsContent>

        {/* About */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>
                  About the facilities management system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Version</Label>
                    <p className="text-sm text-muted-foreground">1.0.0</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Environment</Label>
                    <Badge variant="outline">Development</Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Database</Label>
                  <p className="text-sm text-muted-foreground">SQLite</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Framework</Label>
                  <p className="text-sm text-muted-foreground">Next.js 15 with React 19</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
                <CardDescription>
                  System capabilities and modules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Work Order Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">PPM Scheduling</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Asset Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Safety & Training</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Reports & Analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Real-time Updates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Offline Mode</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Mobile Responsive</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}