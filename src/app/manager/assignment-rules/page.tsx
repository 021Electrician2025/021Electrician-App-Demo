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
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Icons } from '@/components/icons'
import { useSimpleAuth } from '@/hooks/use-simple-auth'
import { toast } from '@/hooks/use-toast'

interface AssignmentRule {
  id: string
  name: string
  description?: string
  category: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  locationId?: string
  assigneeId: string
  isActive: boolean
  createdAt: string
  hotel: {
    id: string
    name: string
  }
  location?: {
    id: string
    name: string
  }
  assignee: {
    id: string
    name: string
    email: string
    role: string
  }
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Location {
  id: string
  name: string
}

export default function AssignmentRulesPage() {
  const { user } = useSimpleAuth()
  const [rules, setRules] = useState<AssignmentRule[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    category: '',
    priority: '',
    locationId: '',
    assigneeId: ''
  })

  const categories = [
    'Electrical',
    'Plumbing', 
    'HVAC',
    'Maintenance',
    'Cleaning',
    'Security',
    'IT',
    'General'
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [rulesRes, usersRes, locationsRes] = await Promise.all([
        fetch('/api/assignment-rules'),
        fetch('/api/users?role=TECHNICIAN,MANAGER,ADMIN'),
        fetch('/api/locations')
      ])

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json()
        setRules(rulesData)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }

      if (locationsRes.ok) {
        const locationsData = await locationsRes.json()
        setLocations(locationsData.locations || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast({
        title: "Error",
        description: "Failed to load assignment rules",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createRule = async () => {
    if (!newRule.name || !newRule.category || !newRule.assigneeId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/assignment-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRule,
          priority: newRule.priority || null,
          locationId: newRule.locationId || null
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Assignment rule created successfully"
        })
        fetchData()
        setIsCreateDialogOpen(false)
        setNewRule({
          name: '',
          description: '',
          category: '',
          priority: '',
          locationId: '',
          assigneeId: ''
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create rule')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create assignment rule",
        variant: "destructive"
      })
    }
  }

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/assignment-rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Rule ${isActive ? 'enabled' : 'disabled'} successfully`
        })
        fetchData()
      } else {
        throw new Error('Failed to update rule')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update assignment rule",
        variant: "destructive"
      })
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800'
      case 'MANAGER': return 'bg-blue-100 text-blue-800'
      case 'TECHNICIAN': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Assignment Rules</h1>
          <p className="text-muted-foreground">
            Configure automatic work order assignment based on category, priority, and location
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Icons.plus className="h-4 w-4 mr-2" />
              New Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Assignment Rule</DialogTitle>
              <DialogDescription>
                Create a rule to automatically assign work orders based on category, priority, and location
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Rule Name *</Label>
                  <Input
                    id="name"
                    value={newRule.name}
                    onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Electrical - High Priority"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={newRule.category} onValueChange={(value) => setNewRule(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newRule.description}
                  onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description of when this rule applies..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority (Optional)</Label>
                  <Select value={newRule.priority} onValueChange={(value) => setNewRule(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Priority</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Select value={newRule.locationId} onValueChange={(value) => setNewRule(prev => ({ ...prev, locationId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Location</SelectItem>
                      {locations.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="assignee">Assignee *</Label>
                <Select value={newRule.assigneeId} onValueChange={(value) => setNewRule(prev => ({ ...prev, assigneeId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <span>{user.name}</span>
                          <Badge variant="outline" className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <Icons.helpCircle className="h-4 w-4" />
                <AlertDescription>
                  Rules are matched in order of specificity: exact match (category + priority + location) → 
                  category + priority → category + location → category only
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={createRule}>Create Rule</Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
            <Icons.settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.length}</div>
            <p className="text-xs text-muted-foreground">
              {rules.filter(r => r.isActive).length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Icons.filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(rules.map(r => r.category)).size}
            </div>
            <p className="text-xs text-muted-foreground">Covered categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Assigned</CardTitle>
            <Icons.checkCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">85%</div>
            <p className="text-xs text-muted-foreground">Work orders this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Technicians</CardTitle>
            <Icons.user className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {new Set(rules.map(r => r.assigneeId)).size}
            </div>
            <p className="text-xs text-muted-foreground">With assignments</p>
          </CardContent>
        </Card>
      </div>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Rules</CardTitle>
          <CardDescription>
            {rules.length} rules configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        {rule.description && (
                          <div className="text-sm text-muted-foreground">
                            {rule.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {rule.priority ? (
                        <Badge className={getPriorityColor(rule.priority)}>
                          {rule.priority}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Any</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {rule.location ? (
                        rule.location.name
                      ) : (
                        <span className="text-muted-foreground">Any</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{rule.assignee.name}</div>
                        <Badge variant="outline" className={getRoleColor(rule.assignee.role)}>
                          {rule.assignee.role}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={(checked) => toggleRuleStatus(rule.id, checked)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Icons.settings className="h-12 w-12 text-muted-foreground" />
                        <div className="text-lg font-medium">No assignment rules</div>
                        <div className="text-sm text-muted-foreground">
                          Create your first assignment rule to start automatic work order assignment
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}