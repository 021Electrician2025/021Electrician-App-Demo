'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Shield, 
  Award, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus, 
  Filter, 
  Download,
  Calendar as CalendarIcon,
  Users,
  FileText,
  Upload
} from 'lucide-react'
import { format } from 'date-fns'
import { useSimpleAuth } from '@/hooks/use-simple-auth'
import { toast } from '@/hooks/use-toast'

interface Certificate {
  id: string
  title: string
  description: string
  category: string
  issuedBy: string
  issuedDate: string
  expiryDate: string
  status: 'VALID' | 'EXPIRING' | 'EXPIRED'
  employeeName: string
  employeeId: string
  documentUrl?: string
  reminderSent: boolean
}

interface TrainingRecord {
  id: string
  title: string
  description: string
  category: string
  completionDate: string
  score?: number
  status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED'
  employeeName: string
  employeeId: string
  certificateId?: string
}

interface SafetyIncident {
  id: string
  title: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED'
  location: string
  reportedBy: string
  reportedAt: string
  resolvedAt?: string
  actions: string[]
}

export default function SafetyPage() {
  const { user } = useSimpleAuth()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([])
  const [safetyIncidents, setSafetyIncidents] = useState<SafetyIncident[]>([])
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    employee: '',
    type: 'certificates'
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)
  const [newCertificate, setNewCertificate] = useState({
    title: '',
    description: '',
    category: '',
    issuedBy: '',
    issuedDate: '',
    expiryDate: '',
    employeeId: '',
    documentUrl: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [certRes, trainingRes, incidentsRes] = await Promise.all([
        fetch('/api/safety/certificates'),
        fetch('/api/safety/training'),
        fetch('/api/safety/incidents')
      ])

      if (certRes.ok) setCertificates(await certRes.json())
      if (trainingRes.ok) setTrainingRecords(await trainingRes.json())
      if (incidentsRes.ok) setSafetyIncidents(await incidentsRes.json())
    } catch (error) {
      console.error('Failed to fetch safety data:', error)
      toast({
        title: "Error",
        description: "Failed to load safety data",
        variant: "destructive"
      })
    }
  }

  const createCertificate = async () => {
    try {
      const response = await fetch('/api/safety/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCertificate)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Certificate created successfully"
        })
        fetchData()
        setIsCreateDialogOpen(false)
        setNewCertificate({
          title: '',
          description: '',
          category: '',
          issuedBy: '',
          issuedDate: '',
          expiryDate: '',
          employeeId: '',
          documentUrl: ''
        })
      }
    } catch (error) {
      console.error('Failed to create certificate:', error)
      toast({
        title: "Error",
        description: "Failed to create certificate",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VALID': return 'bg-green-100 text-green-800'
      case 'EXPIRING': return 'bg-yellow-100 text-yellow-800'
      case 'EXPIRED': return 'bg-red-100 text-red-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'NOT_STARTED': return 'bg-gray-100 text-gray-800'
      case 'RESOLVED': return 'bg-green-100 text-green-800'
      case 'CLOSED': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'bg-blue-100 text-blue-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Safety & Training</h1>
          <p className="text-muted-foreground">Manage certificates, training records, and safety incidents</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Certificate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Certificate</DialogTitle>
                <DialogDescription>
                  Create a new safety or training certificate
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Certificate Title</Label>
                    <Input
                      id="title"
                      value={newCertificate.title}
                      onChange={(e) => setNewCertificate(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., First Aid Certification"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newCertificate.category} onValueChange={(value) => setNewCertificate(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Safety">Safety</SelectItem>
                        <SelectItem value="Compliance">Compliance</SelectItem>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Health">Health</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCertificate.description}
                    onChange={(e) => setNewCertificate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Certificate description..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="issuedBy">Issued By</Label>
                    <Input
                      id="issuedBy"
                      value={newCertificate.issuedBy}
                      onChange={(e) => setNewCertificate(prev => ({ ...prev, issuedBy: e.target.value }))}
                      placeholder="Organization name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      value={newCertificate.employeeId}
                      onChange={(e) => setNewCertificate(prev => ({ ...prev, employeeId: e.target.value }))}
                      placeholder="Employee ID"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Issued Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newCertificate.issuedDate ? format(new Date(newCertificate.issuedDate), 'MMM dd, yyyy') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newCertificate.issuedDate ? new Date(newCertificate.issuedDate) : undefined}
                          onSelect={(date) => setNewCertificate(prev => ({ ...prev, issuedDate: date?.toISOString() || '' }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Expiry Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newCertificate.expiryDate ? format(new Date(newCertificate.expiryDate), 'MMM dd, yyyy') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newCertificate.expiryDate ? new Date(newCertificate.expiryDate) : undefined}
                          onSelect={(date) => setNewCertificate(prev => ({ ...prev, expiryDate: date?.toISOString() || '' }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={createCertificate}>Create Certificate</Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Certificates</CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {certificates.filter(c => c.status === 'VALID').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {certificates.filter(c => isExpiringSoon(c.expiryDate)).length} expiring soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {trainingRecords.filter(t => t.status === 'COMPLETED').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {trainingRecords.filter(t => t.status === 'IN_PROGRESS').length} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safety Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {safetyIncidents.filter(i => i.status === 'OPEN').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {safetyIncidents.filter(i => i.severity === 'CRITICAL').length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {certificates.length > 0 ? Math.round((certificates.filter(c => c.status === 'VALID').length / certificates.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Certificate compliance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <div className="flex gap-2 border-b">
        <Button
          variant={filters.type === 'certificates' ? 'default' : 'ghost'}
          onClick={() => setFilters(prev => ({ ...prev, type: 'certificates' }))}
        >
          Certificates
        </Button>
        <Button
          variant={filters.type === 'training' ? 'default' : 'ghost'}
          onClick={() => setFilters(prev => ({ ...prev, type: 'training' }))}
        >
          Training Records
        </Button>
        <Button
          variant={filters.type === 'incidents' ? 'default' : 'ghost'}
          onClick={() => setFilters(prev => ({ ...prev, type: 'incidents' }))}
        >
          Safety Incidents
        </Button>
      </div>

      {/* Certificates Table */}
      {filters.type === 'certificates' && (
        <Card>
          <CardHeader>
            <CardTitle>Certificates</CardTitle>
            <CardDescription>
              Manage employee certifications and their expiry dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Certificate</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Issued By</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{cert.employeeName}</div>
                          <div className="text-sm text-muted-foreground">{cert.employeeId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{cert.title}</div>
                          <div className="text-sm text-muted-foreground">{cert.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{cert.category}</TableCell>
                      <TableCell>{cert.issuedBy}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={isExpired(cert.expiryDate) ? 'text-red-600 font-medium' : ''}>
                            {format(new Date(cert.expiryDate), 'MMM dd, yyyy')}
                          </span>
                          {isExpiringSoon(cert.expiryDate) && (
                            <span className="text-xs text-yellow-600">Expiring soon</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(cert.status)}>
                          {cert.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {cert.documentUrl && (
                            <Button size="sm" variant="outline">
                              <FileText className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Upload className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Training Records Table */}
      {filters.type === 'training' && (
        <Card>
          <CardHeader>
            <CardTitle>Training Records</CardTitle>
            <CardDescription>
              Track employee training progress and completion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Training</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Completion Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainingRecords.map((training) => (
                    <TableRow key={training.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{training.employeeName}</div>
                          <div className="text-sm text-muted-foreground">{training.employeeId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{training.title}</div>
                          <div className="text-sm text-muted-foreground">{training.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{training.category}</TableCell>
                      <TableCell>
                        {training.completionDate 
                          ? format(new Date(training.completionDate), 'MMM dd, yyyy')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {training.score ? `${training.score}%` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(training.status)}>
                          {training.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safety Incidents Table */}
      {filters.type === 'incidents' && (
        <Card>
          <CardHeader>
            <CardTitle>Safety Incidents</CardTitle>
            <CardDescription>
              Track and manage safety incidents and investigations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Incident</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Reported By</TableHead>
                    <TableHead>Reported At</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safetyIncidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{incident.title}</div>
                          <div className="text-sm text-muted-foreground">{incident.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>{incident.location}</TableCell>
                      <TableCell>{incident.reportedBy}</TableCell>
                      <TableCell>
                        {format(new Date(incident.reportedAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}