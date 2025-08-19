"use client"

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/icons'
import { toast } from '@/hooks/use-toast'

interface QRGeneratorProps {
  isOpen: boolean
  onClose: () => void
  defaultData?: string
  defaultType?: 'location' | 'asset' | 'custom'
  onGenerate?: (qrCodeUrl: string, data: string) => void
}

export default function QRGenerator({ 
  isOpen, 
  onClose, 
  defaultData = '',
  defaultType = 'custom',
  onGenerate 
}: QRGeneratorProps) {
  const [qrData, setQrData] = useState(defaultData)
  const [qrType, setQrType] = useState<'location' | 'asset' | 'custom'>(defaultType)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const generateQRCode = async () => {
    if (!qrData.trim()) {
      toast({
        title: "Error",
        description: "Please enter data to generate QR code",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    
    try {
      const QRCode = (await import('qrcode')).default
      
      // Format the data based on type
      let formattedData = qrData
      if (qrType === 'location') {
        formattedData = `LOCATION:${qrData}`
      } else if (qrType === 'asset') {
        formattedData = `ASSET:${qrData}`
      }

      // Generate QR code as data URL
      const url = await QRCode.toDataURL(formattedData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      setQrCodeUrl(url)
      
      // Also draw to canvas for download
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, formattedData, {
          width: 300,
          margin: 2,
        })
      }

      onGenerate?.(url, formattedData)
      
      toast({
        title: "Success",
        description: "QR code generated successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadQRCode = () => {
    if (!canvasRef.current || !qrCodeUrl) return

    const link = document.createElement('a')
    link.download = `qr-code-${qrType}-${Date.now()}.png`
    link.href = qrCodeUrl
    link.click()
  }

  const printQRCode = () => {
    if (!qrCodeUrl) return
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${qrType}</title>
            <style>
              body { 
                display: flex; 
                flex-direction: column;
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0; 
                font-family: Arial, sans-serif;
              }
              .qr-container {
                text-align: center;
                padding: 20px;
                border: 2px solid #000;
                margin: 20px;
              }
              .qr-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
                text-transform: uppercase;
              }
              .qr-data {
                font-size: 14px;
                margin-top: 10px;
                word-break: break-all;
              }
              @media print {
                body { height: auto; }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="qr-title">${qrType} QR Code</div>
              <img src="${qrCodeUrl}" alt="QR Code" />
              <div class="qr-data">${qrData}</div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  useEffect(() => {
    if (defaultData && isOpen) {
      setQrData(defaultData)
      generateQRCode()
    }
  }, [defaultData, isOpen])

  const handleClose = () => {
    setQrCodeUrl('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icons.qrCode className="h-5 w-5" />
            QR Code Generator
          </DialogTitle>
          <DialogDescription>
            Generate QR codes for locations, assets, or custom data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qr-type">Type</Label>
            <Select value={qrType} onValueChange={(value: any) => setQrType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="location">
                  <div className="flex items-center gap-2">
                    <Icons.mapPin className="h-4 w-4" />
                    Location
                  </div>
                </SelectItem>
                <SelectItem value="asset">
                  <div className="flex items-center gap-2">
                    <Icons.package className="h-4 w-4" />
                    Asset
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <Icons.edit className="h-4 w-4" />
                    Custom
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qr-data">
              {qrType === 'location' ? 'Location Name/ID' : 
               qrType === 'asset' ? 'Asset Name/ID' : 'Custom Data'}
            </Label>
            <Input
              id="qr-data"
              value={qrData}
              onChange={(e) => setQrData(e.target.value)}
              placeholder={
                qrType === 'location' ? 'e.g., Room 204, Lobby' :
                qrType === 'asset' ? 'e.g., HVAC-01, Fire-Ext-12' :
                'Enter any text or URL'
              }
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={generateQRCode} 
              disabled={isGenerating || !qrData.trim()}
              className="flex-1"
            >
              {isGenerating && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              Generate QR Code
            </Button>
          </div>

          {qrCodeUrl && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Generated QR Code</CardTitle>
                <CardDescription className="text-xs">
                  {qrType.toUpperCase()}: {qrData}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <img 
                    src={qrCodeUrl} 
                    alt="Generated QR Code" 
                    className="border rounded-lg"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={downloadQRCode}
                    className="flex-1"
                  >
                    <Icons.download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={printQRCode}
                    className="flex-1"
                  >
                    <Icons.printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hidden canvas for download */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </DialogContent>
    </Dialog>
  )
}