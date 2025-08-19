'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Icons } from '@/components/icons'
import { useSimpleAuth } from '@/hooks/use-simple-auth'
import { toast } from '@/hooks/use-toast'
import DigitalSignature from '@/components/digital-signature'
import { format, formatDistanceToNow } from 'date-fns'

interface WorkOrderDetail {
  id: string
  title: string
  description: string
  category: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: string
  createdAt: string
  updatedAt: string
  location?: {
    id: string
    name: string
  }
  asset?: {
    id: string
    name: string
  }
  createdBy: {
    id: string
    name: string
    email: string
  }
  assignedTo?: {
    id: string
    name: string
    email: string
  }
  media: Array<{
    id: string
    type: string
    url: string
  }>
  statusHistory: Array<{
    id: string
    status: string
    notes?: string
    createdAt: string
    user: {
      name: string
    }
  }>
  signatures: Array<{
    id: string
    signatureType: string
    signerName: string
    signerTitle: string
    notes?: string
    createdAt: string
    signer: {
      name: string
      role: string
    }
  }>
  sla?: {
    expectedResponseTime: number
    expectedResolutionTime: number
    actualResponseTime?: number
    actualResolutionTime?: number
    isOverdue: boolean
  }
}

export default function WorkOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useSimpleAuth()
  const [workOrder, setWorkOrder] = useState<WorkOrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [signatureType, setSignatureType] = useState<'completion' | 'approval' | 'handover'>('completion')

  const workOrderId = params.id as string

  useEffect(() => {
    if (workOrderId) {
      fetchWorkOrderDetail()
    }
  }, [workOrderId])

  const fetchWorkOrderDetail = async () => {
    setIsLoading(true)
    try {
      const [workOrderRes, signaturesRes] = await Promise.all([
        fetch(`/api/work-orders/${workOrderId}`),
        fetch(`/api/work-orders/${workOrderId}/signatures`)
      ])

      if (workOrderRes.ok) {
        const workOrderData = await workOrderRes.json()
        let signatures = []
        
        if (signaturesRes.ok) {
          const signaturesData = await signaturesRes.json()
          signatures = signaturesData.signatures || []
        }

        setWorkOrder({
          ...workOrderData.workOrder,
          signatures
        })
      } else {
        throw new Error('Work order not found')
      }
    } catch (error) {
      console.error('Failed to fetch work order:', error)
      toast({
        title: "Error",
        description: "Failed to load work order details",
        variant: "destructive"
      })
      router.push('/manager/work-orders')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignature = async (signatureData: any) => {
    try {
      const response = await fetch(`/api/work-orders/${workOrderId}/signatures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureType,
          signatureData: signatureData.signature,
          signerName: signatureData.signerName,
          signerTitle: signatureData.signerTitle,
          notes: signatureData.notes
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Digital signature recorded successfully"
        })
        fetchWorkOrderDetail() // Refresh data
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to record signature')
      }
    } catch (error: any) {
      throw error // Re-throw to be handled by DigitalSignature component
    }
  }

  const initiateSignature = (type: 'completion' | 'approval' | 'handover') => {
    setSignatureType(type)
    setShowSignatureModal(true)
  }

  const canSignCompletion = () => {
    return workOrder?.assignedTo?.id === user?.id && workOrder?.status === 'IN_PROGRESS'
  }

  const canSignApproval = () => {
    return ['MANAGER', 'ADMIN'].includes(user?.role || '') && workOrder?.status === 'COMPLETED'
  }

  const hasSignatureType = (type: string) => {
    return workOrder?.signatures?.some(sig => sig.signatureType === type)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOGGED': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) return `${hours}h`
    return `${hours}h ${remainingMinutes}m`
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

  if (!workOrder) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Icons.fileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Work Order Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested work order could not be found.</p>
            <Button onClick={() => router.push('/manager/work-orders')}>
              Back to Work Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/manager/work-orders')}
            >
              <Icons.arrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold">{workOrder.title}</h1>
          <p className="text-muted-foreground">
            Work Order #{workOrder.id.slice(-8).toUpperCase()}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Badge className={getStatusColor(workOrder.status)}>
            {workOrder.status.replace('_', ' ')}
          </Badge>
          <Badge className={getPriorityColor(workOrder.priority)}>
            {workOrder.priority}
          </Badge>
        </div>
      </div>

      {/* SLA Alert */}
      {workOrder.sla?.isOverdue && (
        <Alert variant="destructive">
          <Icons.alertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>SLA Overdue:</strong> This work order has exceeded its expected resolution time.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="signatures">
                Signatures
                {workOrder.signatures.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {workOrder.signatures.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Work Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-muted-foreground">{workOrder.description}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-1">Category</h4>
                      <Badge variant="outline">{workOrder.category}</Badge>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Location</h4>
                      <p className="text-sm">{workOrder.location?.name || 'Not specified'}</p>
                    </div>
                  </div>

                  {workOrder.asset && (
                    <div>
                      <h4 className="font-medium mb-1">Asset</h4>
                      <p className="text-sm">{workOrder.asset.name}</p>
                    </div>
                  )}

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-1">Created By</h4>
                      <p className="text-sm">{workOrder.createdBy.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(workOrder.createdAt), 'PPp')}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Assigned To</h4>
                      <p className="text-sm">
                        {workOrder.assignedTo?.name || 'Unassigned'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Status History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workOrder.statusHistory.map((history, index) => (
                      <div key={history.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          {index < workOrder.statusHistory.length - 1 && (
                            <div className="w-0.5 h-8 bg-border" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getStatusColor(history.status)}>
                              {history.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              by {history.user.name}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {format(new Date(history.createdAt), 'PPp')}
                          </p>
                          {history.notes && (
                            <p className="text-sm">{history.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media">
              <Card>
                <CardHeader>
                  <CardTitle>Media Files</CardTitle>
                </CardHeader>
                <CardContent>
                  {workOrder.media.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {workOrder.media.map((item) => (
                        <div key={item.id} className="border rounded-lg overflow-hidden">
                          <img
                            src={item.url}
                            alt="Work order media"
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Icons.camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No media files uploaded</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signatures">
              <Card>
                <CardHeader>
                  <CardTitle>Digital Signatures</CardTitle>
                  <CardDescription>
                    Electronic signatures for work completion and approval
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workOrder.signatures.map((signature) => (
                      <Card key={signature.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium">{signature.signerName}</h4>
                              <p className="text-sm text-muted-foreground">{signature.signerTitle}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline">
                                {signature.signatureType.charAt(0).toUpperCase() + signature.signatureType.slice(1)}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(signature.createdAt), 'PPp')}
                              </p>
                            </div>
                          </div>
                          
                          {signature.notes && (
                            <p className="text-sm mb-3">{signature.notes}</p>
                          )}
                          
                          <div className="border rounded bg-gray-50 p-2">
                            <img
                              src={signature.id} // This would be the signature data URL
                              alt="Digital signature"
                              className="max-h-20 mx-auto"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {workOrder.signatures.length === 0 && (
                      <div className="text-center py-8">
                        <Icons.edit className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No signatures recorded</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* SLA Information */}
          {workOrder.sla && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icons.clock className="h-4 w-4" />
                  SLA Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Response Time</span>
                    <span className={workOrder.sla.actualResponseTime && workOrder.sla.actualResponseTime <= workOrder.sla.expectedResponseTime ? 'text-green-600' : 'text-red-600'}>
                      {workOrder.sla.actualResponseTime 
                        ? formatMinutes(workOrder.sla.actualResponseTime)
                        : 'Pending'
                      }
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Target: {formatMinutes(workOrder.sla.expectedResponseTime)}
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Resolution Time</span>
                    <span className={workOrder.sla.actualResolutionTime && workOrder.sla.actualResolutionTime <= workOrder.sla.expectedResolutionTime ? 'text-green-600' : 'text-red-600'}>
                      {workOrder.sla.actualResolutionTime 
                        ? formatMinutes(workOrder.sla.actualResolutionTime)
                        : 'In Progress'
                      }
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Target: {formatMinutes(workOrder.sla.expectedResolutionTime)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Signature Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canSignCompletion() && !hasSignatureType('completion') && (
                <Button 
                  onClick={() => initiateSignature('completion')} 
                  className="w-full"
                >
                  <Icons.checkCircle className="h-4 w-4 mr-2" />
                  Sign Completion
                </Button>
              )}

              {canSignApproval() && hasSignatureType('completion') && !hasSignatureType('approval') && (
                <Button 
                  onClick={() => initiateSignature('approval')} 
                  className="w-full"
                  variant="outline"
                >
                  <Icons.shield className="h-4 w-4 mr-2" />
                  Approve Work
                </Button>
              )}

              {hasSignatureType('completion') && (
                <div className="text-center">
                  <Icons.checkCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Work has been signed and completed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Digital Signature Modal */}
      <DigitalSignature
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSign={handleSignature}
        title={`${signatureType.charAt(0).toUpperCase() + signatureType.slice(1)} Signature`}
        description={`Please provide your digital signature to ${signatureType === 'completion' ? 'complete' : signatureType === 'approval' ? 'approve' : 'handover'} this work order`}
        signerName={user?.name || ''}
        workOrderTitle={workOrder.title}
        requiresNotes={signatureType === 'completion'}
      />
    </div>
  )
}