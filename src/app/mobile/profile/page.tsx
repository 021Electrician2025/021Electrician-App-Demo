"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSimpleAuth } from "@/hooks/use-simple-auth"
import { MobileLayout } from "@/components/mobile-layout"

export default function MobileProfilePage() {
  const router = useRouter()
  const { user, logout } = useSimpleAuth()
  const [activeTab, setActiveTab] = useState("profile")

  const handleSignOut = () => {
    logout()
    router.push("/mobile")
  }

  const handleNewRequest = () => {
    router.push("/mobile/new-request")
  }

  const profileItems = [
    {
      icon: Icons.settings,
      label: "Settings",
      description: "App preferences and configuration",
      onClick: () => {
        // Navigate to settings when available
        console.log("Navigate to settings")
      }
    },
    {
      icon: Icons.bell,
      label: "Notifications",
      description: "Manage notification preferences",
      onClick: () => {
        // Navigate to notifications when available
        console.log("Navigate to notifications")
      }
    },
    {
      icon: Icons.shield,
      label: "Privacy & Security",
      description: "Account security settings",
      onClick: () => {
        // Navigate to privacy settings when available
        console.log("Navigate to privacy settings")
      }
    },
    {
      icon: Icons.helpCircle,
      label: "Help & Support",
      description: "Get help and contact support",
      onClick: () => {
        // Navigate to help when available
        console.log("Navigate to help")
      }
    }
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4 space-y-6">
        {/* User Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                <Icons.user className="h-10 w-10 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{user?.name || "Staff Member"}</h3>
                <p className="text-muted-foreground">{user?.email}</p>
                <Badge variant="outline" className="mt-2">
                  {user?.role || "STAFF"}
                </Badge>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">12</div>
                <div className="text-sm text-muted-foreground">Requests Created</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">8</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Options */}
        <Card>
          <CardHeader>
            <CardTitle>Account Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {profileItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start h-auto p-3"
                onClick={item.onClick}
              >
                <div className="flex items-center gap-3 w-full">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                  </div>
                  <Icons.chevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card>
          <CardContent className="p-4">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleSignOut}
            >
              <Icons.logOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <div className="flex justify-around items-center py-2 relative">
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => router.push("/mobile")}
          >
            <Icons.home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </Button>
          
          {/* Center Plus Button */}
          <Button
            onClick={handleNewRequest}
            className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
            size="icon"
          >
            <Icons.plus className="h-6 w-6 text-primary-foreground" />
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => router.push("/mobile/requests")}
          >
            <Icons.fileText className="h-5 w-5" />
            <span className="text-xs">Requests</span>
          </Button>
          
        </div>
      </div>
    </div>
  )
}