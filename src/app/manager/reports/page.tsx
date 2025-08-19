'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { 
  Calendar as CalendarIcon, 
  Download, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Filter,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { useSimpleAuth } from '@/hooks/use-simple-auth'
import { toast } from '@/hooks/use-toast'

interface ReportData {
  totalWorkOrders: number
  completedWorkOrders: number
  pendingWorkOrders: number
  overdueWorkOrders: number
  averageResolutionTime: number
  topCategories: Array<{
    category: string
    count: number
    percentage: number
  }>
  topLocations: Array<{
    location: string
    count: number
    percentage: number
  }>
  monthlyTrends: Array<{
    month: string
    total: number
    completed: number
  }>
  recentWorkOrders: Array<{
    id: string
    title: string
    status: string
    priority: string
    location: string
    createdAt: string
    completedAt?: string
  }>
}

export default function ReportsPage() {
  const { user } = useSimpleAuth()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [filters, setFilters] = useState({
    dateRange: 'last30days',
    startDate: '',
    endDate: '',
    category: '',
    location: '',
    status: ''
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf')

  useEffect(() => {
    generateReport()
  }, [])

  const generateReport = async () => {
    setIsGenerating(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error('Failed to generate report:', error)
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const exportReport = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      params.append('format', exportFormat)

      const response = await fetch(`/api/reports/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `facilities-report-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "Success",
          description: `Report exported as ${exportFormat.toUpperCase()}`
        })
      }
    } catch (error) {
      console.error('Failed to export report:', error)
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'OPEN': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCompletionRate = () => {
    if (!reportData) return 0
    return Math.round((reportData.completedWorkOrders / reportData.totalWorkOrders) * 100)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive facility management reports</p>
        </div>
        <div className="flex gap-2">
          <Select value={exportFormat} onValueChange={(value: 'pdf' | 'excel') => setExportFormat(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} disabled={isGenerating}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={generateReport} disabled={isGenerating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="last90days">Last 90 Days</SelectItem>
                <SelectItem value="thisyear">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {filters.dateRange === 'custom' && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.startDate ? format(new Date(filters.startDate), 'MMM dd, yyyy') : 'Start Date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.startDate ? new Date(filters.startDate) : undefined}
                      onSelect={(date) => setFilters(prev => ({ ...prev, startDate: date?.toISOString() || '' }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.endDate ? format(new Date(filters.endDate), 'MMM dd, yyyy') : 'End Date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.endDate ? new Date(filters.endDate) : undefined}
                      onSelect={(date) => setFilters(prev => ({ ...prev, endDate: date?.toISOString() || '' }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </>
            )}

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

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Work Orders</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.totalWorkOrders}</div>
              <p className="text-xs text-muted-foreground">
                {getCompletionRate()}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{reportData.completedWorkOrders}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((reportData.completedWorkOrders / reportData.totalWorkOrders) * 100)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{reportData.pendingWorkOrders}</div>
              <p className="text-xs text-muted-foreground">
                {reportData.overdueWorkOrders} overdue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Resolution Time</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{reportData.averageResolutionTime}h</div>
              <p className="text-xs text-muted-foreground">
                Hours per work order
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts and Analytics */}
      {reportData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Top Categories</CardTitle>
              <CardDescription>Most frequent maintenance requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.topCategories.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{category.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {category.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Locations */}
          <Card>
            <CardHeader>
              <CardTitle>Top Locations</CardTitle>
              <CardDescription>Areas with most maintenance requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.topLocations.map((location, index) => (
                  <div key={location.location} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{location.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${location.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {location.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Work Orders */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Work Orders</CardTitle>
            <CardDescription>Latest maintenance activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.recentWorkOrders.map((workOrder) => (
                    <TableRow key={workOrder.id}>
                      <TableCell className="font-medium">{workOrder.title}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(workOrder.status)}>
                          {workOrder.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(workOrder.priority)}>
                          {workOrder.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{workOrder.location}</TableCell>
                      <TableCell>
                        {format(new Date(workOrder.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {workOrder.completedAt 
                          ? format(new Date(workOrder.completedAt), 'MMM dd, yyyy')
                          : '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}