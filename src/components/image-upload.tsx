'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Camera, X, Image as ImageIcon, Upload } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
  className?: string
}

export default function ImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 5,
  className = "" 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (images.length + files.length > maxImages) {
      toast({
        title: "Limit Exceeded",
        description: `You can only upload up to ${maxImages} images`,
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    const newImages: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid File",
            description: "Please upload only image files",
            variant: "destructive"
          })
          continue
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File Too Large",
            description: "Please upload images smaller than 5MB",
            variant: "destructive"
          })
          continue
        }

        // Upload file
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          newImages.push(data.url)
        } else {
          throw new Error('Upload failed')
        }
      }

      onImagesChange([...images, ...newImages])
      
      if (newImages.length > 0) {
        toast({
          title: "Success",
          description: `${newImages.length} image(s) uploaded successfully`
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading || images.length >= maxImages}
      />

      {/* Upload Button */}
      {images.length < maxImages && (
        <Card 
          className="border-dashed cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={triggerFileInput}
        >
          <CardContent className="flex flex-col items-center justify-center p-6">
            {isUploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Upload Images</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {maxImages - images.length} remaining
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={image}
                  alt={`Uploaded ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Remove Button */}
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>

              {/* Image Badge */}
              <Badge 
                variant="secondary" 
                className="absolute bottom-1 left-1 text-xs"
              >
                {index + 1}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Mobile Camera Button */}
      {images.length < maxImages && (
        <Button
          variant="outline"
          className="w-full mt-3 md:hidden"
          onClick={triggerFileInput}
          disabled={isUploading}
        >
          <Camera className="h-4 w-4 mr-2" />
          {isUploading ? 'Uploading...' : 'Take Photo'}
        </Button>
      )}
    </div>
  )
}