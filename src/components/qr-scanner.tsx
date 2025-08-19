"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Icons } from '@/components/icons'
import { cn } from '@/lib/utils'

interface QRScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (result: string) => void
  title?: string
  description?: string
}

export default function QRScanner({ 
  isOpen, 
  onClose, 
  onScan, 
  title = "Scan QR Code",
  description = "Point your camera at a QR code to scan it"
}: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scannerRef = useRef<any>(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (scannerRef.current) {
      scannerRef.current.destroy?.()
      scannerRef.current = null
    }
    setIsScanning(false)
  }, [])

  const startCamera = useCallback(async () => {
    setError(null)
    setIsScanning(true)

    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera by default
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      streamRef.current = stream
      setHasPermission(true)

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        // Wait for video to load
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve(null)
          }
        })

        // Initialize QR scanner
        const QrScanner = (await import('qr-scanner')).default
        
        scannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            onScan(result.data)
            stopCamera()
            onClose()
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        )

        await scannerRef.current.start()
      }
    } catch (err: any) {
      setError(err.name === 'NotAllowedError' 
        ? 'Camera permission denied. Please allow camera access to scan QR codes.'
        : 'Failed to access camera. Please try again.'
      )
      setHasPermission(false)
      setIsScanning(false)
    }
  }, [onScan, onClose, stopCamera])

  useEffect(() => {
    if (isOpen && hasPermission !== false) {
      startCamera()
    } else if (!isOpen) {
      stopCamera()
    }

    return () => stopCamera()
  }, [isOpen, hasPermission, startCamera, stopCamera])

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icons.qrCode className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <Icons.alertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                className={cn(
                  "w-full h-64 bg-black rounded-lg object-cover",
                  !isScanning && "opacity-50"
                )}
                playsInline
                muted
                autoPlay
              />
              
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icons.spinner className="h-8 w-8 animate-spin text-white" />
                </div>
              )}

              {/* Scan frame overlay */}
              <div className="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none">
                <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-primary rounded-br-lg" />
              </div>
            </div>
          )}

          <div className="flex justify-between">
            {error && hasPermission === false ? (
              <Button onClick={startCamera} className="w-full">
                <Icons.camera className="mr-2 h-4 w-4" />
                Request Camera Access
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                {!isScanning && hasPermission !== false && (
                  <Button onClick={startCamera}>
                    <Icons.camera className="mr-2 h-4 w-4" />
                    Start Scanning
                  </Button>
                )}
              </>
            )}
          </div>

          <div className="text-sm text-muted-foreground text-center">
            <p>Position the QR code within the frame to scan</p>
            <p className="text-xs mt-1">Make sure the code is well-lit and in focus</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}