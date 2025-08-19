"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useSimpleAuth } from "@/hooks/use-simple-auth"
import { MobileLayout } from "@/components/mobile-layout"

export default function MobilePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const { user, logout, login, isAuthenticated, isLoading } = useSimpleAuth()

  // Mock data for demonstration
  const mockRequests = [
    {
      id: "1",
      title: "Flickering bathroom light",
      location: "Room 204",
      status: "COMPLETED",
      priority: "MEDIUM",
      createdAt: "2024-01-18T08:30:00Z"
    },
    {
      id: "2",
      title: "Socket sparking in bar",
      location: "Bar Area",
      status: "IN_PROGRESS",
      priority: "CRITICAL",
      createdAt: "2024-01-18T09:15:00Z"
    },
    {
      id: "3",
      title: "AC not cooling properly",
      location: "Room 305",
      status: "LOGGED",
      priority: "HIGH",
      createdAt: "2024-01-18T10:00:00Z"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-500"
      case "IN_PROGRESS": return "bg-blue-500"
      case "LOGGED": return "bg-yellow-500"
      case "ON_HOLD": return "bg-orange-500"
      default: return "bg-gray-500"
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


  const openRequests = mockRequests.filter(req => req.status !== "COMPLETED")

  // Demo users for quick login
  const demoUsers = [
    {
      id: "1",
      email: "staff@hotel.com",
      name: "John Staff",
      role: "STAFF" as const
    },
    {
      id: "2", 
      email: "tech@hotel.com",
      name: "Mike Technician",
      role: "TECHNICIAN" as const
    }
  ]

  const quickLogin = (selectedUser: typeof demoUsers[0]) => {
    login(selectedUser)
    toast({
      title: "Welcome back!",
      description: `You have been successfully signed in as ${selectedUser.name}.`
    })
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icons.user className="h-8 w-8 animate-pulse" />
      </div>
    )
  }

  // Show quick login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Hotel Facilities</h1>
              <p className="text-sm opacity-90">Please sign in to continue</p>
            </div>
          </div>
        </div>

        {/* Quick Login */}
        <div className="flex-1 p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Login (Demo)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {demoUsers.map((user) => (
                <Button
                  key={user.email}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => quickLogin(user)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Icons.user className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.role} • {user.email}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        {/* My Open Requests Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              My Open Requests
              <Badge variant="secondary">{openRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {openRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No open requests
              </p>
            ) : (
              <div className="space-y-3">
                {openRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{request.title}</h4>
                      <p className="text-xs text-muted-foreground">{request.location}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant="secondary"
                        className={`${getPriorityColor(request.priority)} text-white text-xs`}
                      >
                        {request.priority}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(request.status)} text-white text-xs`}
                      >
                        {request.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockRequests.slice(0, 3).map((request) => (
                <div key={request.id} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(request.status)}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{request.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {request.location} • {request.status.replace("_", " ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  )
}