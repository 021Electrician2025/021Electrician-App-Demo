"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { MobileLayout } from "@/components/mobile-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface WorkOrder {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  createdAt: string
  location: {
    name: string
  }
  assignedTo?: {
    name: string
  }
  media: {
    id: string
    type: string
    url: string
  }[]
}

export default function MobileRequestsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [requests, setRequests] = useState<WorkOrder[]>([])
  const [filteredRequests, setFilteredRequests] = useState<WorkOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<WorkOrder | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  useEffect(() => {
    filterRequests()
  }, [requests, searchTerm, statusFilter])

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/work-orders/my-requests")
      if (response.ok) {
        const data = await response.json()
        setRequests(data.workOrders || [])
      }
    } catch (error) {
      console.error("Error fetching requests:", error)
      toast({
        title: "Error",
        description: "Failed to load requests",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterRequests = () => {
    let filtered = requests

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.location.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(request => request.status === statusFilter)
    }

    setFilteredRequests(filtered)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-500 text-white"
      case "HIGH":
        return "bg-orange-500 text-white"
      case "MEDIUM":
        return "bg-yellow-500 text-black"
      case "LOW":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500 text-white"
      case "IN_PROGRESS":
        return "bg-blue-500 text-white"
      case "LOGGED":
        return "bg-gray-500 text-white"
      case "ON_HOLD":
        return "bg-yellow-500 text-black"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const RequestDetailsDialog = ({ request }: { request: WorkOrder }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-sm font-medium">{request.title}</CardTitle>
              <div className="flex gap-1">
                <Badge className={getPriorityColor(request.priority)}>
                  {request.priority}
                </Badge>
              </div>
            </div>
            <CardDescription className="text-xs">
              {request.location.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <Badge className={getStatusColor(request.status)}>
                {request.status.replace('_', ' ')}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(request.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{request.title}</DialogTitle>
          <DialogDescription>
            {request.description || "No description provided"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <p className="text-sm text-muted-foreground">
                {request.status.replace('_', ' ')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <p className="text-sm text-muted-foreground">{request.priority}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Location</label>
            <p className="text-sm text-muted-foreground">{request.location.name}</p>
          </div>
          {request.assignedTo && (
            <div>
              <label className="text-sm font-medium">Assigned To</label>
              <p className="text-sm text-muted-foreground">{request.assignedTo.name}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Created</label>
            <p className="text-sm text-muted-foreground">
              {new Date(request.createdAt).toLocaleString()}
            </p>
          </div>
          {request.media.length > 0 && (
            <div>
              <label className="text-sm font-medium">Media</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {request.media.map((media) => (
                  <div key={media.id} className="aspect-square bg-muted rounded-md flex items-center justify-center">
                    {media.type === "image" ? (
                      <img
                        src={media.url}
                        alt="Request media"
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <Icons.fileText className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <MobileLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold">My Requests</h1>
          <p className="text-sm text-muted-foreground">
            Track all your maintenance requests
          </p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="LOGGED">Logged</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="ON_HOLD">On Hold</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Requests List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Icons.fileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchTerm || statusFilter !== "all" 
                    ? "No requests match your filters"
                    : "No requests found"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <RequestDetailsDialog key={request.id} request={request} />
            ))
          )}
        </div>

        {/* New Request Button */}
        <Button
          size="lg"
          className="w-full fixed bottom-20 left-4 right-4 z-20"
          onClick={() => window.location.href = "/mobile/new-request"}
        >
          <Icons.plus className="mr-2 h-5 w-5" />
          New Request
        </Button>
      </div>
    </MobileLayout>
  )
}