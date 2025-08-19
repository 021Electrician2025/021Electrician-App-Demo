'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Icons } from '@/components/icons'
import { useSimpleAuth } from '@/hooks/use-simple-auth'
import { toast } from '@/hooks/use-toast'
import { format, subDays, subMonths, subYears } from 'date-fns'

export default function AuditPackPage() {
  const { user } = useSimpleAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState({
    startDate: format(subMonths(new Date(), 3), 'yyyy-MM-dd'), // Default 3 months back
    endDate: format(new Date(), 'yyyy-MM-dd'),
    categories: [] as string[],
    format: 'pdf' as 'pdf' | 'excel',
    includeWorkOrders: true,
    includePPM: true,
    includeCertificates: true,
    includeIncidents: true,
    includeSLA: true
  })

  const categories = [
    'Electrical',
    'Plumbing',
    'HVAC',
    'Fire Safety',
    'Security',
    'Maintenance',
    'Cleaning',
    'IT'
  ]

  const presetRanges = [
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'Last 6 Months', months: 6 },
    { label: 'Last Year', years: 1 },
    { label: 'Current Year', range: 'year' }
  ]

  const handlePresetRange = (preset: any) => {
    const endDate = new Date()
    let startDate: Date

    if (preset.days) {
      startDate = subDays(endDate, preset.days)
    } else if (preset.months) {
      startDate = subMonths(endDate, preset.months)
    } else if (preset.years) {
      startDate = subYears(endDate, preset.years)
    } else if (preset.range === 'year') {
      startDate = new Date(endDate.getFullYear(), 0, 1)
    } else {
      startDate = subMonths(endDate, 3)
    }

    setFormData(prev => ({
      ...prev,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    }))
  }

  const handleCategoryToggle = (category: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      categories: checked 
        ? [...prev.categories, category]
        : prev.categories.filter(c => c !== category)
    }))
  }

  const handleSelectAllCategories = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      categories: checked ? [...categories] : []
    }))
  }

  const validateForm = () => {
    if (!formData.startDate || !formData.endDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive"
      })
      return false
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast({
        title: "Error",
        description: "Start date must be before end date",
        variant: "destructive"
      })
      return false
    }

    if (!formData.includeWorkOrders && !formData.includePPM && !formData.includeCertificates && !formData.includeIncidents && !formData.includeSLA) {
      toast({
        title: "Error",
        description: "Please select at least one data type to include",
        variant: "destructive"
      })
      return false
    }

    return true
  }

  const generateAuditPack = async () => {
    if (!validateForm()) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/audit-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        // Get the filename from the response headers
        const contentDisposition = response.headers.get('content-disposition')
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `audit-pack-${formData.format}-${new Date().toISOString().split('T')[0]}.${formData.format === 'pdf' ? 'pdf' : 'xlsx'}`

        // Download the file
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: `Audit pack generated and downloaded successfully`
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate audit pack')
      }
    } catch (error: any) {
      console.error('Failed to generate audit pack:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate audit pack",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const getSelectedSummary = () => {
    const items = []
    if (formData.includeWorkOrders) items.push('Work Orders')
    if (formData.includePPM) items.push('PPM Tasks')
    if (formData.includeCertificates) items.push('Certificates')
    if (formData.includeIncidents) items.push('Incidents')
    if (formData.includeSLA) items.push('SLA Metrics')
    return items
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Pack Generator</h1>
          <p className="text-muted-foreground">
            Generate comprehensive compliance reports for auditors and insurance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Icons.shield className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium">Compliance Ready</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Date Range */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icons.calendar className="h-4 w-4" />
                Date Range
              </CardTitle>
              <CardDescription>
                Select the period for which you want to generate the audit pack
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label>Quick Presets</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {presetRanges.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetRange(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icons.filter className="h-4 w-4" />
                Categories (Optional)
              </CardTitle>
              <CardDescription>
                Filter by specific categories, or leave empty to include all
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="selectAll"
                  checked={formData.categories.length === categories.length}
                  onCheckedChange={handleSelectAllCategories}
                />
                <Label htmlFor="selectAll" className="font-medium">
                  Select All Categories
                </Label>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={category}
                      checked={formData.categories.includes(category)}
                      onCheckedChange={(checked) => handleCategoryToggle(category, checked as boolean)}
                    />
                    <Label htmlFor={category} className="text-sm">
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icons.fileText className="h-4 w-4" />
                Include Data Types
              </CardTitle>
              <CardDescription>
                Select which types of data to include in the audit pack
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeWorkOrders"
                  checked={formData.includeWorkOrders}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeWorkOrders: checked as boolean }))}
                />
                <Label htmlFor="includeWorkOrders">Work Orders</Label>
                <span className="text-xs text-muted-foreground">(Maintenance requests and repairs)</span>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePPM"
                  checked={formData.includePPM}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includePPM: checked as boolean }))}
                />
                <Label htmlFor="includePPM">Preventive Maintenance (PPM)</Label>
                <span className="text-xs text-muted-foreground">(Scheduled maintenance tasks)</span>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCertificates"
                  checked={formData.includeCertificates}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeCertificates: checked as boolean }))}
                />
                <Label htmlFor="includeCertificates">Safety & Training Certificates</Label>
                <span className="text-xs text-muted-foreground">(Staff qualifications and training)</span>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeIncidents"
                  checked={formData.includeIncidents}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeIncidents: checked as boolean }))}
                />
                <Label htmlFor="includeIncidents">Safety Incidents</Label>
                <span className="text-xs text-muted-foreground">(Critical issues and emergencies)</span>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSLA"
                  checked={formData.includeSLA}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeSLA: checked as boolean }))}
                />
                <Label htmlFor="includeSLA">SLA Compliance Metrics</Label>
                <span className="text-xs text-muted-foreground">(Response times and performance)</span>
              </div>
            </CardContent>
          </Card>

          {/* Export Format */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icons.download className="h-4 w-4" />
                Export Format
              </CardTitle>
              <CardDescription>
                Choose the format for your audit pack
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.format === 'pdf' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, format: 'pdf' }))}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Icons.fileText className="h-4 w-4 text-red-500" />
                    <span className="font-medium">PDF Report</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Professional formatted report with charts and tables
                  </p>
                </div>

                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.format === 'excel' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, format: 'excel' }))}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Icons.fileText className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Excel Spreadsheet</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Raw data in spreadsheet format for further analysis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          {/* Generation Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Generation Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Period</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.startDate && formData.endDate 
                    ? `${new Date(formData.startDate).toLocaleDateString()} - ${new Date(formData.endDate).toLocaleDateString()}`
                    : 'No dates selected'
                  }
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Categories</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.categories.length === 0 
                    ? 'All categories' 
                    : formData.categories.length === categories.length 
                      ? 'All categories'
                      : `${formData.categories.length} selected`
                  }
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Data Types</Label>
                <div className="text-sm text-muted-foreground">
                  {getSelectedSummary().map((item, index) => (
                    <div key={item} className="flex items-center gap-1">
                      <Icons.checkCircle className="h-3 w-3 text-green-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Format</Label>
                <p className="text-sm text-muted-foreground capitalize">
                  {formData.format} {formData.format === 'pdf' ? 'Report' : 'Spreadsheet'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={generateAuditPack} 
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Icons.download className="mr-2 h-4 w-4" />
                    Generate Audit Pack
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center mt-2">
                This may take a few moments depending on data volume
              </p>
            </CardContent>
          </Card>

          {/* Compliance Notice */}
          <Alert>
            <Icons.shield className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Compliance Ready:</strong> These audit packs are designed to meet insurance and HSA regulatory requirements. All data includes timestamps, digital signatures, and audit trails where applicable.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}