"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSimpleAuth } from "@/hooks/use-simple-auth"
import { signOut } from "next-auth/react"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface ManagerLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/manager",
    icon: Icons.home
  },
  {
    title: "Work Orders",
    href: "/manager/work-orders",
    icon: Icons.fileText
  },
  {
    title: "PPM Scheduler",
    href: "/manager/ppm-scheduler",
    icon: Icons.calendar
  },
  {
    title: "Assets",
    href: "/manager/assets",
    icon: Icons.building
  },
  {
    title: "Reports & Audits",
    href: "/manager/reports",
    icon: Icons.barChart3
  },
  {
    title: "Audit Pack Generator",
    href: "/manager/audit-pack",
    icon: Icons.download
  },
  {
    title: "Safety & Training",
    href: "/manager/safety",
    icon: Icons.shield
  },
  {
    title: "Assignment Rules",
    href: "/manager/assignment-rules",
    icon: Icons.wrench
  },
  {
    title: "SLA Dashboard",
    href: "/manager/sla-dashboard",
    icon: Icons.clock
  },
  {
    title: "Settings",
    href: "/manager/settings",
    icon: Icons.settings
  }
]

export function ManagerLayout({ children }: ManagerLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useSimpleAuth()

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
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-background border-r transition-all duration-300 z-10",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icons.building className="h-5 w-5 text-primary-foreground" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="font-semibold text-lg">Hotel Manager</h1>
                  <p className="text-xs text-muted-foreground">Facilities Management</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Button
                  key={item.href}
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    sidebarCollapsed && "justify-center px-2",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => router.push(item.href)}
                >
                  <Icon className={cn(
                    "h-5 w-5",
                    !sidebarCollapsed && "mr-3"
                  )} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.title}</span>
                      {item.badge && (
                        <Badge variant={item.badgeVariant || "secondary"}>
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              )
            })}
          </nav>

          
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-64"
      )}>
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <Icons.menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-lg font-semibold">
                  {navItems.find(item => item.href === pathname)?.title || "Dashboard"}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Icons.bell className="h-5 w-5" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImage} />
                      <AvatarFallback className="text-xs">
                        {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user?.role?.toLowerCase()}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled className="text-xs">
                    <Icons.building className="mr-2 h-3 w-3" />
                    {user?.hotel?.name || 'No hotel assigned'}
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
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}