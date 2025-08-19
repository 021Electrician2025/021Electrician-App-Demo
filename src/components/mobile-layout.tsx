"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useSimpleAuth } from "@/hooks/use-simple-auth"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface MobileLayoutProps {
  children: React.ReactNode
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState("home")
  const router = useRouter()
  const { data: session } = useSession()
  const { user: authUser } = useAuth()
  const { user, logout } = useSimpleAuth()
  
  const currentUser = user || authUser

  const tabs = [
    {
      id: "home",
      label: "Home",
      icon: Icons.home,
      href: "/mobile"
    },
    {
      id: "requests",
      label: "Requests",
      icon: Icons.fileText,
      href: "/mobile/requests"
    }
  ]

  const handleTabClick = (tabId: string, href: string) => {
    setActiveTab(tabId)
    router.push(href)
  }

  const handleNewRequest = () => {
    router.push("/mobile/new-request")
  }

  const handleSignOut = async () => {
    try {
      // Try NextAuth signOut first
      await signOut({ redirect: false })
    } catch (error) {
      console.log("NextAuth signOut not available, using simple logout")
    }
    // Use simple auth logout which handles redirect
    logout()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Hotel Facilities</h1>
            <p className="text-sm opacity-90">Welcome, {currentUser?.name || "Staff"}</p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground h-10 w-10"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser?.profileImage} />
                  <AvatarFallback className="text-xs bg-primary-foreground/20 text-primary-foreground">
                    {currentUser?.name?.charAt(0)?.toUpperCase() || currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{currentUser?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{currentUser?.role?.toLowerCase()}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-xs">
                <Icons.building className="mr-2 h-3 w-3" />
                {currentUser?.hotel?.name || 'No hotel assigned'}
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="text-xs">
                <Icons.calendar className="mr-2 h-3 w-3" />
                Last login: {new Date().toLocaleDateString()}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive"
              >
                <Icons.logOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <div className="flex justify-around items-center py-2 relative">
          <Button
            variant={activeTab === "home" ? "default" : "ghost"}
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => handleTabClick("home", "/mobile")}
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
            variant={activeTab === "requests" ? "default" : "ghost"}
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => handleTabClick("requests", "/mobile/requests")}
          >
            <Icons.fileText className="h-5 w-5" />
            <span className="text-xs">Requests</span>
          </Button>
        </div>
      </div>
    </div>
  )
}