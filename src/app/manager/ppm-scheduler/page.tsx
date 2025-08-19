'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar, Clock, MapPin, User, Wrench, AlertTriangle, CheckCircle, Plus, Filter, Download, CalendarDays, Repeat } from 'lucide-react'
import { useSimpleAuth } from '@/hooks/use-simple-auth'
import { toast } from '@/hooks/use-toast'

interface PPMSchedule {
  id: string
  title: string
  description: string
  assetId: string
  assetName: string
  location: string
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  nextDueDate: string
  lastCompleted?: string
  assignedTo?: string
  isActive: boolean
  estimatedDuration: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  category: string
}

export default function PPMSchedulerPage() {
  const { user } = useSimpleAuth()
  const [schedules, setSchedules] = useState<PPMSchedule[]>([])
  const [filteredSchedules, setFilteredSchedules] = useState<PPMSchedule[]>([])
  const [filters, setFilters] = useState({
    frequency: 'all',
    status: 'all',
    category: '',
    location: '',
    search: ''
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<PPMSchedule | null>(null)
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    description: '',
    assetId: '',
    frequency: 'MONTHLY',
    estimatedDuration: 60,
    priority: 'MEDIUM',
    category: ''
  })

  useEffect(() => {
    fetchSchedules()
  }, [])

  useEffect(() => {
    filterAndSortSchedules()
  }, [schedules, filters])

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/ppm-schedules')
      if (response.ok) {
        const data = await response.json()
        setSchedules(data)
      }
    } catch (error) {
      console.error('Failed to fetch PPM schedules:', error)
      toast({
        title: "Error",
        description: "Failed to load PPM schedules",
        variant: "destructive"
      })
    }
  }

  const filterAndSortSchedules = () => {
    let filtered = [...schedules]

    // Apply filters
    if (filters.frequency && filters.frequency !== 'all') {
      filtered = filtered.filter(s => s.frequency === filters.frequency)
    }
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'OVERDUE') {
        filtered = filtered.filter(s => new Date(s.nextDueDate) < new Date())
      } else if (filters.status === 'ACTIVE') {
        filtered = filtered.filter(s => s.isActive)
      } else if (filters.status === 'INACTIVE') {
        filtered = filtered.filter(s => !s.isActive)
      }
    }
    if (filters.category) {
      filtered = filtered.filter(s => s.category.toLowerCase().includes(filters.category.toLowerCase()))
    }
    if (filters.location) {
      filtered = filtered.filter(s => s.location.toLowerCase().includes(filters.location.toLowerCase()))
    }
    if (filters.search) {
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        s.description.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // Sort by next due date
    filtered.sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())

    setFilteredSchedules(filtered)
  }

  const createSchedule = async () => {
    try {
      const response = await fetch('/api/ppm-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "PPM schedule created successfully"
        })
        fetchSchedules()
        setIsCreateDialogOpen(false)
        setNewSchedule({
          title: '',
          description: '',
          assetId: '',
          frequency: 'MONTHLY',
          estimatedDuration: 60,
          priority: 'MEDIUM',
          category: ''
        })
      }
    } catch (error) {
      console.error('Failed to create PPM schedule:', error)
      toast({
        title: "Error",
        description: "Failed to create PPM schedule",
        variant: "destructive"
      })
    }
  }

  const toggleScheduleStatus = async (scheduleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/ppm-schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Schedule ${isActive ? 'activated' : 'deactivated'}`
        })
        fetchSchedules()
      }
    } catch (error) {
      console.error('Failed to update schedule status:', error)
      toast({
        title: "Error",
        description: "Failed to update schedule status",
        variant: "destructive"
      })
    }
  }

  const generateWorkOrder = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/ppm-schedules/${scheduleId}/generate-work-order`, {
        method: 'POST'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Work order generated successfully"
        })
        fetchSchedules()
      }
    } catch (error) {
      console.error('Failed to generate work order:', error)
      toast({
        title: "Error",
        description: "Failed to generate work order",
        variant: "destructive"
      })
    }
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'DAILY': return 'bg-blue-100 text-blue-800'
      case 'WEEKLY': return 'bg-green-100 text-green-800'
      case 'MONTHLY': return 'bg-yellow-100 text-yellow-800'
      case 'QUARTERLY': return 'bg-orange-100 text-orange-800'
      case 'YEARLY': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-blue-100 text-blue-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'URGENT': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isOverdue = (nextDueDate: string) => {
    return new Date(nextDueDate) < new Date()
  }

  const getDaysUntilDue = (nextDueDate: string) => {
    const due = new Date(nextDueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">PPM Scheduler</h1>
          <p className="text-muted-foreground">Manage preventive maintenance schedules</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create PPM Schedule</DialogTitle>
                <DialogDescription>
                  Set up a new preventive maintenance schedule
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newSchedule.title}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Schedule title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newSchedule.description}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the maintenance task"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={newSchedule.frequency} onValueChange={(value) => setNewSchedule(prev => ({ ...prev, frequency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                        <SelectItem value="YEARLY">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newSchedule.priority} onValueChange={(value) => setNewSchedule(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={newSchedule.estimatedDuration}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={newSchedule.category}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., HVAC, Electrical"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={createSchedule}>Create Schedule</Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.length}</div>
            <p className="text-xs text-muted-foreground">
              {schedules.filter(s => s.isActive).length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {schedules.filter(s => isOverdue(s.nextDueDate)).length}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {schedules.filter(s => getDaysUntilDue(s.nextDueDate) <= 7 && getDaysUntilDue(s.nextDueDate) >= 0).length}
            </div>
            <p className="text-xs text-muted-foreground">Upcoming tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {schedules.filter(s => s.lastCompleted && new Date(s.lastCompleted).getMonth() === new Date().getMonth()).length}
            </div>
            <p className="text-xs text-muted-foreground">Maintenance completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={filters.frequency} onValueChange={(value) => setFilters(prev => ({ ...prev, frequency: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frequency</SelectItem>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                <SelectItem value="YEARLY">Yearly</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Category"
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            />

            <Input
              placeholder="Location"
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
            />

            <Input
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Schedules Table */}
      <Card>
        <CardHeader>
          <CardTitle>PPM Schedules</CardTitle>
          <CardDescription>
            {filteredSchedules.length} schedules found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.title}</TableCell>
                    <TableCell className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {schedule.assetName}
                    </TableCell>
                    <TableCell>
                      <Badge className={getFrequencyColor(schedule.frequency)}>
                        <div className="flex items-center gap-1">
                          <Repeat className="h-3 w-3" />
                          {schedule.frequency}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={isOverdue(schedule.nextDueDate) ? 'text-red-600 font-medium' : ''}>
                          {new Date(schedule.nextDueDate).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {isOverdue(schedule.nextDueDate) 
                            ? `${Math.abs(getDaysUntilDue(schedule.nextDueDate))} days overdue`
                            : `${getDaysUntilDue(schedule.nextDueDate)} days`
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(schedule.priority)}>
                        {schedule.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={schedule.isActive ? "default" : "secondary"}>
                        {schedule.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateWorkOrder(schedule.id)}
                          disabled={!schedule.isActive}
                        >
                          <Wrench className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleScheduleStatus(schedule.id, !schedule.isActive)}
                        >
                          {schedule.isActive ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}