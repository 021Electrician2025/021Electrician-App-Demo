"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Icons } from "@/components/icons"
import { useToast } from "@/hooks/use-toast"
import { useSimpleAuth } from "@/hooks/use-simple-auth"
import ImageUpload from "@/components/image-upload"
import QRScanner from "@/components/qr-scanner"

const requestSchema = z.object({
  location: z.string().min(1, "Location is required"),
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
})

type RequestForm = z.infer<typeof requestSchema>

const categories = [
  "Electrical",
  "Plumbing",
  "HVAC",
  "General",
  "Safety",
  "Cleaning"
]

const locations = [
  "Room 101",
  "Room 102",
  "Room 204",
  "Room 305",
  "Bar Area",
  "Restaurant",
  "Lobby",
  "Pool Area",
  "Gym",
  "Conference Room A",
  "Conference Room B"
]

export default function NewRequestPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isAuthenticated, isLoading } = useSimpleAuth()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCriticalConfirm, setShowCriticalConfirm] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [showQRScanner, setShowQRScanner] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger
  } = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      priority: "MEDIUM"
    }
  })

  const watchedPriority = watch("priority")

  const onNext = async () => {
    const fieldsToValidate = step === 1 ? ["location"] : step === 2 ? ["category", "title", "description", "priority"] : []
    
    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate as any)
      if (!isValid) return
    }

    if (step === 2 && watchedPriority === "CRITICAL") {
      setShowCriticalConfirm(true)
      return
    }

    if (step < 3) {
      setStep(step + 1)
    }
  }

  const onPrevious = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const onSubmit = async (data: RequestForm) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a request.",
        variant: "destructive"
      })
      router.push("/auth/signin")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/simple-work-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...data,
          photos: uploadedImages,
          user: user
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error("API Error:", response.status, errorData)
        throw new Error(`Failed to create request: ${response.status}`)
      }

      toast({
        title: "Request Created",
        description: "Your incident has been successfully logged."
      })

      router.push("/mobile")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create request. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "bg-red-500"
      case "HIGH": return "bg-orange-500"
      case "MEDIUM": return "bg-yellow-500"
      case "LOW": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  const handleQRScan = (result: string) => {
    // Parse QR code result
    let location = result
    
    // Handle formatted QR codes
    if (result.startsWith('LOCATION:')) {
      location = result.replace('LOCATION:', '')
    } else if (result.startsWith('ASSET:')) {
      // If it's an asset QR code, we can still use it to determine location
      location = result.replace('ASSET:', '')
    }
    
    // Set the location field
    setValue("location", location)
    
    toast({
      title: "QR Code Scanned",
      description: `Location set to: ${location}`
    })
  }

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push("/auth/signin")
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground"
            onClick={() => router.back()}
          >
            <Icons.chevronRight className="h-6 w-6 rotate-180" />
          </Button>
          <h1 className="text-xl font-bold">Log New Incident</h1>
          <div className="w-10" />
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Step {step} of 3</span>
            <span>{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-primary-foreground/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icons.mapPin className="h-5 w-5" />
                Identify Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Scan QR Code</Label>
                <Button
                  variant="outline"
                  className="w-full h-12 border-dashed"
                  onClick={() => setShowQRScanner(true)}
                >
                  <Icons.scan className="mr-2 h-5 w-5" />
                  Scan Room/Asset QR Code
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Or Select Location</Label>
                <Select 
                  value={watch("location")} 
                  onValueChange={(value) => setValue("location", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.location && (
                  <p className="text-sm text-destructive">{errors.location.message}</p>
                )}
              </div>

              <div className="pt-4">
                <Button onClick={onNext} className="w-full">
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icons.edit className="h-5 w-5" />
                Describe the Issue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Photos/Video</Label>
                <ImageUpload
                  images={uploadedImages}
                  onImagesChange={setUploadedImages}
                  maxImages={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={(value) => setValue("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Brief Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Flickering bathroom light"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide more details about the issue..."
                  rows={4}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Priority Level</Label>
                <RadioGroup
                  value={watchedPriority}
                  onValueChange={(value) => setValue("priority", value as any)}
                  className="grid grid-cols-2 gap-2"
                >
                  {[
                    { value: "LOW", label: "Low", desc: "Minor issues" },
                    { value: "MEDIUM", label: "Medium", desc: "Moderate issues" },
                    { value: "HIGH", label: "High", desc: "Urgent issues" },
                    { value: "CRITICAL", label: "Critical", desc: "Safety risk" }
                  ].map((priority) => (
                    <div key={priority.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={priority.value} id={priority.value} />
                      <Label htmlFor={priority.value} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={`${getPriorityColor(priority.value)} text-white text-xs`}
                          >
                            {priority.value}
                          </Badge>
                          <div>
                            <div className="font-medium text-sm">{priority.label}</div>
                            <div className="text-xs text-muted-foreground">{priority.desc}</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.priority && (
                  <p className="text-sm text-destructive">{errors.priority.message}</p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={onPrevious} className="flex-1">
                  Previous
                </Button>
                <Button onClick={onNext} className="flex-1">
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icons.checkCircle className="h-5 w-5" />
                Review & Submit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                  <p className="font-medium">{watch("location")}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                  <p className="font-medium">{watch("category")}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                  <p className="font-medium">{watch("title")}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="font-medium">{watch("description")}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                  <Badge
                    variant="secondary"
                    className={`${getPriorityColor(watchedPriority)} text-white`}
                  >
                    {watchedPriority}
                  </Badge>
                </div>

                {uploadedImages.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Photos</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {uploadedImages.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Uploaded ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={onPrevious} className="flex-1">
                  Previous
                </Button>
                <Button
                  onClick={handleSubmit(onSubmit)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Request
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Critical Priority Confirmation Modal */}
      {showCriticalConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Icons.alertTriangle className="h-5 w-5" />
                Critical Priority Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Icons.alertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This will send an immediate alert to all relevant personnel. Are you sure this is a critical safety risk?
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCriticalConfirm(false)}
                  className="flex-1"
                >
                  No, Change Priority
                </Button>
                <Button
                  onClick={() => {
                    setShowCriticalConfirm(false)
                    setStep(3)
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Yes, It's Critical
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
        title="Scan Location QR Code"
        description="Point your camera at a room or asset QR code"
      />
    </div>
  )
}