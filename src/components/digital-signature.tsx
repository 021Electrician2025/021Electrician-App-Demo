"use client"

import { useState, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/icons'
import { toast } from '@/hooks/use-toast'

interface DigitalSignatureProps {
  isOpen: boolean
  onClose: () => void
  onSign: (signatureData: SignatureData) => Promise<void>
  title?: string
  description?: string
  signerName?: string
  workOrderTitle?: string
  requiresNotes?: boolean
}

interface SignatureData {
  signature: string
  signerName: string
  signerTitle: string
  notes?: string
  timestamp: string
}

export default function DigitalSignature({
  isOpen,
  onClose,
  onSign,
  title = "Digital Signature Required",
  description = "Please provide your digital signature to complete this action",
  signerName = "",
  workOrderTitle = "",
  requiresNotes = false
}: DigitalSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [formData, setFormData] = useState({
    signerName: signerName || '',
    signerTitle: '',
    notes: ''
  })

  const startDrawing = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    setHasSignature(true)
    
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Handle both mouse and touch events
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

    const x = clientX - rect.left
    const y = clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }, [])

  const draw = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Prevent scrolling on touch devices
    event.preventDefault()

    // Handle both mouse and touch events
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

    const x = clientX - rect.left
    const y = clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }, [isDrawing])

  const stopDrawing = useCallback(() => {
    setIsDrawing(false)
  }, [])

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const initializeCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = 400
    canvas.height = 200

    // Set drawing properties
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Fill background with white
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const handleSubmit = async () => {
    if (!hasSignature) {
      toast({
        title: "Error",
        description: "Please provide your signature",
        variant: "destructive"
      })
      return
    }

    if (!formData.signerName || !formData.signerTitle) {
      toast({
        title: "Error",
        description: "Please fill in your name and title",
        variant: "destructive"
      })
      return
    }

    if (requiresNotes && !formData.notes) {
      toast({
        title: "Error",
        description: "Please provide completion notes",
        variant: "destructive"
      })
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    setIsSigning(true)
    try {
      const signatureDataUrl = canvas.toDataURL('image/png')
      
      const signatureData: SignatureData = {
        signature: signatureDataUrl,
        signerName: formData.signerName,
        signerTitle: formData.signerTitle,
        notes: formData.notes || undefined,
        timestamp: new Date().toISOString()
      }

      await onSign(signatureData)
      handleClose()
    } catch (error) {
      console.error('Failed to submit signature:', error)
      toast({
        title: "Error",
        description: "Failed to submit signature. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSigning(false)
    }
  }

  const handleClose = () => {
    clearSignature()
    setFormData({ signerName: signerName || '', signerTitle: '', notes: '' })
    onClose()
  }

  // Initialize canvas when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(initializeCanvas, 100)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icons.edit className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {workOrderTitle && (
            <Alert>
              <Icons.fileText className="h-4 w-4" />
              <AlertDescription>
                <strong>Work Order:</strong> {workOrderTitle}
              </AlertDescription>
            </Alert>
          )}

          {/* Signer Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="signerName">Full Name *</Label>
              <Input
                id="signerName"
                value={formData.signerName}
                onChange={(e) => setFormData(prev => ({ ...prev, signerName: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="signerTitle">Title/Position *</Label>
              <Input
                id="signerTitle"
                value={formData.signerTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, signerTitle: e.target.value }))}
                placeholder="e.g., Facilities Manager, Technician"
              />
            </div>
          </div>

          {requiresNotes && (
            <div>
              <Label htmlFor="notes">Completion Notes *</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Describe the work completed, any issues encountered, or recommendations..."
                rows={3}
              />
            </div>
          )}

          {/* Signature Canvas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Digital Signature *</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-4">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-48 border border-gray-200 rounded bg-white cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Sign above using your mouse or finger
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearSignature}
                    disabled={!hasSignature}
                  >
                    <Icons.refreshCw className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Notice */}
          <Alert>
            <Icons.shield className="h-4 w-4" />
            <AlertDescription className="text-xs">
              By signing this document, you certify that the work has been completed according to specifications 
              and standards. This signature is legally binding and creates an audit trail for compliance purposes.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} disabled={isSigning || !hasSignature} className="flex-1">
              {isSigning && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              {isSigning ? 'Submitting...' : 'Submit Signature'}
            </Button>
            <Button variant="outline" onClick={handleClose} disabled={isSigning}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}