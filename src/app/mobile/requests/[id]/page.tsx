'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  MessageCircle,
  Camera,
  Image as ImageIcon,
  Paperclip
} from 'lucide-react'
import { useSimpleAuth } from '@/hooks/use-simple-auth'
import { toast } from '@/hooks/use-toast'

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
  images?: string[]
  documents?: string[]
}

interface Comment {
  id: string
  content: string
  author: string
  createdAt: string
  type: 'STAFF' | 'TECHNICIAN' | 'MANAGER'
}

interface TimelineEvent {
  id: string
  type: 'CREATED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'COMMENT'
  description: string
  timestamp: string
  author: string
}

export default function RequestDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useSimpleAuth()
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [newComment, setNewComment] = useState('')
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchWorkOrderDetails()
    }
  }, [params.id])

  const fetchWorkOrderDetails = async () => {
    try {
      const response = await fetch(`/api/work-orders/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setWorkOrder(data)
        generateTimeline(data)
      }
    } catch (error) {
      console.error('Failed to fetch work order details:', error)
      toast({
        title: "Error",
        description: "Failed to load work order details",
        variant: "destructive"
      })
    }
  }

  const generateTimeline = (workOrder: WorkOrder) => {
    const events: TimelineEvent[] = [
      {
        id: '1',
        type: 'CREATED',
        description: `Work order created: ${workOrder.title}`,
        timestamp: workOrder.createdAt,
        author: workOrder.reportedBy
      }
    ]

    if (workOrder.assignedTo) {
      events.push({
        id: '2',
        type: 'ASSIGNED',
        description: `Assigned to ${workOrder.assignedTo}`,
        timestamp: workOrder.updatedAt,
        author: 'System'
      })
    }

    if (workOrder.status === 'IN_PROGRESS') {
      events.push({
        id: '3',
        type: 'IN_PROGRESS',
        description: 'Work started',
        timestamp: workOrder.updatedAt,
        author: workOrder.assignedTo || 'System'
      })
    }

    if (workOrder.status === 'COMPLETED') {
      events.push({
        id: '4',
        type: 'COMPLETED',
        description: 'Work completed',
        timestamp: workOrder.actualCompletion || workOrder.updatedAt,
        author: workOrder.assignedTo || 'System'
      })
    }

    if (workOrder.status === 'CANCELLED') {
      events.push({
        id: '5',
        type: 'CANCELLED',
        description: 'Work order cancelled',
        timestamp: workOrder.updatedAt,
        author: 'System'
      })
    }

    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    setTimeline(events)
  }

  const addComment = async () => {
    if (!newComment.trim()) return

    try {
      const response = await fetch(`/api/work-orders/${params.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          author: user?.name || 'Anonymous',
          type: user?.role || 'STAFF'
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Comment added successfully"
        })
        setNewComment('')
        setIsCommentDialogOpen(false)
        // Refresh the work order details
        fetchWorkOrderDetails()
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
      toast({
        title: "Error",
        description: "Failed to add comment",
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
      case 'IN_PROGRESS': return <Clock className="h-4 w-4" />
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'CREATED': return <AlertTriangle className="h-4 w-4 text-blue-500" />
      case 'ASSIGNED': return <User className="h-4 w-4 text-green-500" />
      case 'IN_PROGRESS': return <Wrench className="h-4 w-4 text-yellow-500" />
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'CANCELLED': return <XCircle className="h-4 w-4 text-red-500" />
      case 'COMMENT': return <MessageCircle className="h-4 w-4 text-purple-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  if (!workOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading work order details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3 flex items-center">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="ml-2 text-lg font-semibold">Request Details</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Work Order Info */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{workOrder.title}</CardTitle>
                <CardDescription className="mt-1">{workOrder.description}</CardDescription>
              </div>
              <Badge className={getStatusColor(workOrder.status)}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(workOrder.status)}
                  {workOrder.status.replace('_', ' ')}
                </div>
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Priority:</span>
                <Badge className={`ml-2 ${getPriorityColor(workOrder.priority)}`}>
                  {workOrder.priority}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Category:</span>
                <span className="ml-2 font-medium">{workOrder.category}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-3 w-3 text-muted-foreground mr-1" />
                <span className="text-muted-foreground">Location:</span>
                <span className="ml-2 font-medium">{workOrder.location}</span>
              </div>
              <div className="flex items-center">
                <User className="h-3 w-3 text-muted-foreground mr-1" />
                <span className="text-muted-foreground">Assigned to:</span>
                <span className="ml-2 font-medium">{workOrder.assignedTo || 'Unassigned'}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-3 w-3 text-muted-foreground mr-1" />
                <span className="text-muted-foreground">Created:</span>
                <span className="ml-2 font-medium">
                  {new Date(workOrder.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="h-3 w-3 text-muted-foreground mr-1" />
                <span className="text-muted-foreground">Updated:</span>
                <span className="ml-2 font-medium">
                  {new Date(workOrder.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        {workOrder.images && workOrder.images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {workOrder.images.map((image, index) => (
                  <div key={index} className="relative">
                    <Dialog open={selectedImage === image} onOpenChange={() => setSelectedImage(null)}>
                      <DialogTrigger asChild>
                        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-16 w-16 text-gray-400" />
                          <p className="absolute bottom-4 text-sm text-muted-foreground">Image {index + 1}</p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeline.map((event, index) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getTimelineIcon(event.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium">{event.description}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">by {event.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Technician Notes */}
        {workOrder.technicianNotes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Technician Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{workOrder.technicianNotes}</p>
            </CardContent>
          </Card>
        )}

        {/* Add Comment Button */}
        <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <MessageCircle className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Comment</DialogTitle>
              <DialogDescription>
                Add a comment or update to this work order
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Enter your comment..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={addComment}>Add Comment</Button>
                <Button variant="outline" onClick={() => setIsCommentDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}