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
import { Calendar, Clock, MapPin, Package, Wrench, AlertTriangle, Plus, Filter, Download, QrCode, Camera, FileText } from 'lucide-react'
import { useSimpleAuth } from '@/hooks/use-simple-auth'
import { toast } from '@/hooks/use-toast'
import QRGenerator from '@/components/qr-generator'

interface Asset {
  id: string
  name: string
  description: string
  category: string
  location: string
  qrCode: string
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'RETIRED'
  purchaseDate: string
  warrantyExpiry?: string
  expectedLifespan: number
  currentAge: number
  lastMaintenance?: string
  nextMaintenance?: string
  manufacturer: string
  model: string
  serialNumber: string
  cost: number
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
}

export default function AssetsPage() {
  const { user } = useSimpleAuth()
  const [assets, setAssets] = useState<Asset[]>([])
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    location: '',
    condition: '',
    search: ''
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [showQRGenerator, setShowQRGenerator] = useState(false)
  const [qrAsset, setQrAsset] = useState<Asset | null>(null)
  const [newAsset, setNewAsset] = useState({
    name: '',
    description: '',
    category: '',
    locationId: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    cost: 0,
    expectedLifespan: 60,
    warrantyExpiry: ''
  })

  useEffect(() => {
    fetchAssets()
  }, [])

  useEffect(() => {
    filterAndSortAssets()
  }, [assets, filters])

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets')
      if (response.ok) {
        const data = await response.json()
        setAssets(data)
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error)
      toast({
        title: "Error",
        description: "Failed to load assets",
        variant: "destructive"
      })
    }
  }

  const filterAndSortAssets = () => {
    let filtered = [...assets]

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(a => a.status === filters.status)
    }
    if (filters.category) {
      filtered = filtered.filter(a => a.category.toLowerCase().includes(filters.category.toLowerCase()))
    }
    if (filters.location) {
      filtered = filtered.filter(a => a.location.toLowerCase().includes(filters.location.toLowerCase()))
    }
    if (filters.condition) {
      filtered = filtered.filter(a => a.condition === filters.condition)
    }
    if (filters.search) {
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        a.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        a.serialNumber.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name))

    setFilteredAssets(filtered)
  }

  const createAsset = async () => {
    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Asset created successfully"
        })
        fetchAssets()
        setIsCreateDialogOpen(false)
        setNewAsset({
          name: '',
          description: '',
          category: '',
          locationId: '',
          manufacturer: '',
          model: '',
          serialNumber: '',
          cost: 0,
          expectedLifespan: 60,
          warrantyExpiry: ''
        })
      }
    } catch (error) {
      console.error('Failed to create asset:', error)
      toast({
        title: "Error",
        description: "Failed to create asset",
        variant: "destructive"
      })
    }
  }

  const generateQRCode = (asset: Asset) => {
    setQrAsset(asset)
    setShowQRGenerator(true)
  }

  const handleQRGenerated = async (qrCodeUrl: string, data: string) => {
    if (!qrAsset) return
    
    try {
      const response = await fetch(`/api/assets/${qrAsset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: data, qrCodeUrl })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "QR code generated and saved successfully"
        })
        fetchAssets()
      }
    } catch (error) {
      console.error('Failed to save QR code:', error)
      toast({
        title: "Error",
        description: "Failed to save QR code",
        variant: "destructive"
      })
    }
  }

  const updateAssetStatus = async (assetId: string, status: string) => {
    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Asset status updated successfully"
        })
        fetchAssets()
      }
    } catch (error) {
      console.error('Failed to update asset status:', error)
      toast({
        title: "Error",
        description: "Failed to update asset status",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800'
      case 'RETIRED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'EXCELLENT': return 'bg-green-100 text-green-800'
      case 'GOOD': return 'bg-blue-100 text-blue-800'
      case 'FAIR': return 'bg-yellow-100 text-yellow-800'
      case 'POOR': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getHealthPercentage = (asset: Asset) => {
    const ageRatio = asset.currentAge / asset.expectedLifespan
    const conditionMultiplier = {
      'EXCELLENT': 1.0,
      'GOOD': 0.8,
      'FAIR': 0.6,
      'POOR': 0.3
    }[asset.condition]

    return Math.max(0, Math.min(100, (1 - ageRatio) * conditionMultiplier * 100))
  }

  const getHealthColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    if (percentage >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Asset Management</h1>
          <p className="text-muted-foreground">Manage hotel assets and equipment</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Asset</DialogTitle>
                <DialogDescription>
                  Add a new asset to the inventory
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Asset Name</Label>
                    <Input
                      id="name"
                      value={newAsset.name}
                      onChange={(e) => setNewAsset(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., HVAC Unit 101"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={newAsset.category}
                      onChange={(e) => setNewAsset(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., HVAC, Electrical"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newAsset.description}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the asset..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      value={newAsset.manufacturer}
                      onChange={(e) => setNewAsset(prev => ({ ...prev, manufacturer: e.target.value }))}
                      placeholder="Manufacturer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={newAsset.model}
                      onChange={(e) => setNewAsset(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="Model number"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <Input
                      id="serialNumber"
                      value={newAsset.serialNumber}
                      onChange={(e) => setNewAsset(prev => ({ ...prev, serialNumber: e.target.value }))}
                      placeholder="Serial number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost">Cost ($)</Label>
                    <Input
                      id="cost"
                      type="number"
                      value={newAsset.cost}
                      onChange={(e) => setNewAsset(prev => ({ ...prev, cost: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expectedLifespan">Expected Lifespan (months)</Label>
                    <Input
                      id="expectedLifespan"
                      type="number"
                      value={newAsset.expectedLifespan}
                      onChange={(e) => setNewAsset(prev => ({ ...prev, expectedLifespan: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                    <Input
                      id="warrantyExpiry"
                      type="date"
                      value={newAsset.warrantyExpiry}
                      onChange={(e) => setNewAsset(prev => ({ ...prev, warrantyExpiry: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={createAsset}>Create Asset</Button>
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
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
            <p className="text-xs text-muted-foreground">
              {assets.filter(a => a.status === 'ACTIVE').length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {assets.filter(a => a.status === 'MAINTENANCE').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently being serviced</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warranty Expiring</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {assets.filter(a => a.warrantyExpiry && new Date(a.warrantyExpiry) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)).length}
            </div>
            <p className="text-xs text-muted-foreground">Within 90 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${assets.reduce((sum, asset) => sum + asset.cost, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Asset portfolio value</p>
          </CardContent>
        </Card>
      </div>

      

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assets Inventory</CardTitle>
          <CardDescription>
            {filteredAssets.length} assets found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => {
                  const healthPercentage = getHealthPercentage(asset)
                  return (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{asset.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {asset.manufacturer} {asset.model}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{asset.category}</TableCell>
                      <TableCell className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {asset.location}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(asset.status)}>
                          {asset.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getConditionColor(asset.condition)}>
                          {asset.condition}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                healthPercentage >= 80 ? 'bg-green-500' :
                                healthPercentage >= 60 ? 'bg-yellow-500' :
                                healthPercentage >= 40 ? 'bg-orange-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${healthPercentage}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${getHealthColor(healthPercentage)}`}>
                            {Math.round(healthPercentage)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>${asset.cost.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateQRCode(asset)}
                            title="Generate QR Code"
                          >
                            <QrCode className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAsset(asset)}
                          >
                            <Camera className="h-3 w-3" />
                          </Button>
                          <Select onValueChange={(value) => updateAssetStatus(asset.id, value)}>
                            <SelectTrigger className="w-24">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Active</SelectItem>
                              <SelectItem value="INACTIVE">Inactive</SelectItem>
                              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                              <SelectItem value="RETIRED">Retired</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Asset Details Dialog */}
      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAsset?.name}</DialogTitle>
            <DialogDescription>
              Asset details and information
            </DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <p className="text-sm">{selectedAsset.category}</p>
                </div>
                <div>
                  <Label>Location</Label>
                  <p className="text-sm flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedAsset.location}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Manufacturer</Label>
                  <p className="text-sm">{selectedAsset.manufacturer}</p>
                </div>
                <div>
                  <Label>Model</Label>
                  <p className="text-sm">{selectedAsset.model}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Serial Number</Label>
                  <p className="text-sm">{selectedAsset.serialNumber}</p>
                </div>
                <div>
                  <Label>Cost</Label>
                  <p className="text-sm">${selectedAsset.cost.toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Purchase Date</Label>
                  <p className="text-sm">{new Date(selectedAsset.purchaseDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Warranty Expiry</Label>
                  <p className="text-sm">
                    {selectedAsset.warrantyExpiry ? new Date(selectedAsset.warrantyExpiry).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm">{selectedAsset.description}</p>
              </div>
              <div>
                <Label>QR Code</Label>
                <div className="mt-2 p-4 border rounded bg-white">
                  <div className="text-center text-sm text-muted-foreground">
                    QR Code: {selectedAsset.qrCode}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Generator */}
      <QRGenerator
        isOpen={showQRGenerator}
        onClose={() => {
          setShowQRGenerator(false)
          setQrAsset(null)
        }}
        defaultData={qrAsset?.name || ''}
        defaultType="asset"
        onGenerate={handleQRGenerated}
      />
    </div>
  )
}