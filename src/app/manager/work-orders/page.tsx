'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar, Clock, MapPin, User, Wrench, AlertTriangle, CheckCircle, XCircle, Clock3, Filter, Download, Eye } from 'lucide-react'
import { useSimpleAuth } from '@/hooks/use-simple-auth'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface WorkOrder {
  id: string
  title: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  category: string
  location: string
  assignedTo?: string
  reportedBy: string
  createdAt: string
  updatedAt: string
  estimatedCompletion?: string
  actualCompletion?: string
  technicianNotes?: string
}

export default function WorkOrdersPage() {
  const { user } = useSimpleAuth()
  const router = useRouter()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrder[]>([])
  const [selectedWorkOrders, setSelectedWorkOrders] = useState<string[]>([])
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: '',
    location: '',
    search: ''
  })
  const [sortConfig, setSortConfig] = useState<{
    key: keyof WorkOrder
    direction: 'asc' | 'desc'
  }>({ key: 'createdAt', direction: 'desc' })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null)
  const [technicianNotes, setTechnicianNotes] = useState('')

  useEffect(() => {
    fetchWorkOrders()
  }, [])

  useEffect(() => {
    filterAndSortWorkOrders()
  }, [workOrders, filters, sortConfig])

  const fetchWorkOrders = async () => {
    try {
      const response = await fetch('/api/work-orders')
      if (response.ok) {
        const data = await response.json()
        setWorkOrders(data)
      }
    } catch (error) {
      console.error('Failed to fetch work orders:', error)
      toast({
        title: "Error",
        description: "Failed to load work orders",
        variant: "destructive"
      })
    }
  }

  const filterAndSortWorkOrders = () => {
    let filtered = [...workOrders]

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(wo => wo.status === filters.status)
    }
    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(wo => wo.priority === filters.priority)
    }
    if (filters.category) {
      filtered = filtered.filter(wo => wo.category.toLowerCase().includes(filters.category.toLowerCase()))
    }
    if (filters.location) {
      filtered = filtered.filter(wo => wo.location.toLowerCase().includes(filters.location.toLowerCase()))
    }
    if (filters.search) {
      filtered = filtered.filter(wo => 
        wo.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        wo.description.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1
      
      // Convert to strings for safe comparison
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()
      
      if (aStr < bStr) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aStr > bStr) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })

    setFilteredWorkOrders(filtered)
  }

  const handleSort = (key: keyof WorkOrder) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleBulkAction = async (action: string) => {
    if (selectedWorkOrders.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select work orders to perform bulk actions",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/work-orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          workOrderIds: selectedWorkOrders
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Bulk action completed successfully`
        })
        fetchWorkOrders()
        setSelectedWorkOrders([])
      }
    } catch (error) {
      console.error('Bulk action failed:', error)
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive"
      })
    }
  }

  const updateWorkOrderStatus = async (workOrderId: string, status: string, notes?: string) => {
    try {
      const response = await fetch(`/api/work-orders/${workOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, technicianNotes: notes })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Work order updated successfully"
        })
        fetchWorkOrders()
        setIsDialogOpen(false)
        setSelectedWorkOrder(null)
        setTechnicianNotes('')
      }
    } catch (error) {
      console.error('Failed to update work order:', error)
      toast({
        title: "Error",
        description: "Failed to update work order",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <AlertTriangle className="h-4 w-4" />
      case 'IN_PROGRESS': return <Clock3 className="h-4 w-4" />
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Work Orders</h1>
          <p className="text-muted-foreground">Manage and track all maintenance requests</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      

      {/* Bulk Actions */}
      {selectedWorkOrders.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedWorkOrders.length} work order(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('assign')}
                >
                  Assign
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('cancel')}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('delete')}
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Work Orders List</CardTitle>
          <CardDescription>
            {filteredWorkOrders.length} work orders found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedWorkOrders.length === filteredWorkOrders.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedWorkOrders(filteredWorkOrders.map(wo => wo.id))
                        } else {
                          setSelectedWorkOrders([])
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('title')}
                  >
                    Title
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('priority')}
                  >
                    Priority
                  </TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    Created
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkOrders.map((workOrder) => (
                  <TableRow key={workOrder.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedWorkOrders.includes(workOrder.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedWorkOrders(prev => [...prev, workOrder.id])
                          } else {
                            setSelectedWorkOrders(prev => prev.filter(id => id !== workOrder.id))
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{workOrder.title}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(workOrder.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(workOrder.status)}
                          {workOrder.status.replace('_', ' ')}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(workOrder.priority)}>
                        {workOrder.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{workOrder.category}</TableCell>
                    <TableCell className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {workOrder.location}
                    </TableCell>
                    <TableCell className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {workOrder.assignedTo || 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(workOrder.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/manager/work-orders/${workOrder.id}`)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Dialog open={isDialogOpen && selectedWorkOrder?.id === workOrder.id} onOpenChange={(open) => {
                          setIsDialogOpen(open)
                          if (open) {
                            setSelectedWorkOrder(workOrder)
                            setTechnicianNotes(workOrder.technicianNotes || '')
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Wrench className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Work Order</DialogTitle>
                              <DialogDescription>
                                {workOrder.title} - {workOrder.location}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="notes">Technician Notes</Label>
                                <Textarea
                                  id="notes"
                                  value={technicianNotes}
                                  onChange={(e) => setTechnicianNotes(e.target.value)}
                                  placeholder="Add notes about the work performed..."
                                />
                              </div>
                              <div className="flex gap-2">
                                {workOrder.status === 'OPEN' && (
                                  <Button
                                    onClick={() => updateWorkOrderStatus(workOrder.id, 'IN_PROGRESS', technicianNotes)}
                                  >
                                    Start Work
                                  </Button>
                                )}
                                {workOrder.status === 'IN_PROGRESS' && (
                                  <Button
                                    onClick={() => updateWorkOrderStatus(workOrder.id, 'COMPLETED', technicianNotes)}
                                  >
                                    Complete
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  onClick={() => updateWorkOrderStatus(workOrder.id, 'CANCELLED', technicianNotes)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
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