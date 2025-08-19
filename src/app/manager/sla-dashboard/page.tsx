'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Icons } from '@/components/icons'
import { useSimpleAuth } from '@/hooks/use-simple-auth'
import { toast } from '@/hooks/use-toast'
import { format, formatDistanceToNow } from 'date-fns'

interface WorkOrderSLA {
  id: string
  workOrderId: string
  category: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  expectedResponseTime: number
  expectedResolutionTime: number
  actualResponseTime?: number
  actualResolutionTime?: number
  assignedAt?: string
  firstResponseAt?: string
  resolvedAt?: string
  isOverdue: boolean
  createdAt: string
  workOrder: {
    id: string
    title: string
    description: string
    status: string
    createdBy: {
      name: string
    }
    assignedTo?: {
      name: string
    }
  }
}

interface SLAMetrics {
  totalWorkOrders: number
  onTimeResponse: number
  onTimeResolution: number
  averageResponseTime: number
  averageResolutionTime: number
  overdueCount: number
  responseComplianceRate: number
  resolutionComplianceRate: number
}

export default function SLADashboardPage() {
  const { user } = useSimpleAuth()
  const [slaData, setSlaData] = useState<WorkOrderSLA[]>([])
  const [metrics, setMetrics] = useState<SLAMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    priority: '',
    category: '',
    status: 'all'
  })

  useEffect(() => {
    fetchSLAData()
  }, [filters])

  const fetchSLAData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.category) params.append('category', filters.category)
      if (filters.status !== 'all') params.append('status', filters.status)

      const response = await fetch(`/api/sla-dashboard?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSlaData(data.slaData || [])
        setMetrics(data.metrics)
      } else {
        throw new Error('Failed to fetch SLA data')
      }
    } catch (error) {
      console.error('Failed to fetch SLA data:', error)
      toast({
        title: "Error",
        description: "Failed to load SLA data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800'
      case 'LOGGED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) return `${hours}h`
    return `${hours}h ${remainingMinutes}m`
  }

  const getComplianceStatus = (actual?: number, expected?: number, isResolved = false) => {
    if (!actual && !isResolved) return { status: 'pending', color: 'text-gray-500' }
    if (!actual) return { status: 'no-response', color: 'text-gray-500' }
    if (!expected) return { status: 'unknown', color: 'text-gray-500' }
    
    const isCompliant = actual <= expected
    return {
      status: isCompliant ? 'compliant' : 'overdue',
      color: isCompliant ? 'text-green-600' : 'text-red-600'
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <Icons.spinner className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">SLA Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor service level agreements and response times
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Compliance</CardTitle>
              <Icons.clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(metrics.responseComplianceRate)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.onTimeResponse} of {metrics.totalWorkOrders} on time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolution Compliance</CardTitle>
              <Icons.checkCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(metrics.resolutionComplianceRate)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.onTimeResolution} of {metrics.totalWorkOrders} on time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Icons.clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatMinutes(Math.round(metrics.averageResponseTime))}
              </div>
              <p className="text-xs text-muted-foreground">
                Average first response
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
              <Icons.alertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {metrics.overdueCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Need immediate attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Priorities</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              <SelectItem value="Electrical">Electrical</SelectItem>
              <SelectItem value="Plumbing">Plumbing</SelectItem>
              <SelectItem value="HVAC">HVAC</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="overdue">Overdue Only</SelectItem>
              <SelectItem value="compliant">Compliant Only</SelectItem>
              <SelectItem value="pending">Pending Response</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Overdue Alerts */}
      {metrics && metrics.overdueCount > 0 && (
        <Alert variant="destructive">
          <Icons.alertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{metrics.overdueCount} work orders</strong> are overdue for their SLA targets and require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* SLA Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>SLA Details</CardTitle>
          <CardDescription>
            Detailed view of work order SLA compliance and timing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work Order</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response SLA</TableHead>
                  <TableHead>Resolution SLA</TableHead>
                  <TableHead>Assignee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slaData.map((sla) => {
                  const responseStatus = getComplianceStatus(sla.actualResponseTime, sla.expectedResponseTime, !!sla.firstResponseAt)
                  const resolutionStatus = getComplianceStatus(sla.actualResolutionTime, sla.expectedResolutionTime, !!sla.resolvedAt)
                  
                  return (
                    <TableRow key={sla.id} className={sla.isOverdue ? 'bg-red-50' : ''}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sla.workOrder.title}</div>
                          <div className="text-sm text-muted-foreground">
                            Created {format(new Date(sla.createdAt), 'MMM dd, HH:mm')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sla.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(sla.priority)}>
                          {sla.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(sla.workOrder.status)}>
                          {sla.workOrder.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            Target: {formatMinutes(sla.expectedResponseTime)}
                          </div>
                          <div className={`text-sm font-medium ${responseStatus.color}`}>
                            {sla.actualResponseTime 
                              ? `Actual: ${formatMinutes(sla.actualResponseTime)}`
                              : sla.firstResponseAt
                                ? 'Responded'
                                : 'Pending'
                            }
                          </div>
                          {sla.actualResponseTime && (
                            <Progress 
                              value={Math.min(100, (sla.actualResponseTime / sla.expectedResponseTime) * 100)} 
                              className="w-20 h-1"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            Target: {formatMinutes(sla.expectedResolutionTime)}
                          </div>
                          <div className={`text-sm font-medium ${resolutionStatus.color}`}>
                            {sla.actualResolutionTime 
                              ? `Actual: ${formatMinutes(sla.actualResolutionTime)}`
                              : sla.resolvedAt
                                ? 'Resolved'
                                : 'In Progress'
                            }
                          </div>
                          {sla.actualResolutionTime && (
                            <Progress 
                              value={Math.min(100, (sla.actualResolutionTime / sla.expectedResolutionTime) * 100)} 
                              className="w-20 h-1"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {sla.workOrder.assignedTo?.name || (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {slaData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Icons.clock className="h-12 w-12 text-muted-foreground" />
                        <div className="text-lg font-medium">No SLA data found</div>
                        <div className="text-sm text-muted-foreground">
                          Work orders with SLA tracking will appear here
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}