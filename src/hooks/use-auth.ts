"use client"

import { useSession } from "next-auth/react"
import { UserRole } from "@/lib/mock-data"

interface UseAuthReturn {
  user: {
    id: string
    email: string
    name?: string
    role: UserRole
    hotelId?: string
    hotelName?: string
  } | null
  isLoading: boolean
  isAuthenticated: boolean
  hasRole: (role: UserRole | UserRole[]) => boolean
  isStaff: boolean
  isTechnician: boolean
  isManager: boolean
  isAdmin: boolean
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession()

  const user = session?.user || null
  const isLoading = status === "loading"
  const isAuthenticated = !!user

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false
    if (Array.isArray(role)) {
      return role.includes(user.role)
    }
    return user.role === role
  }

  const isStaff = hasRole(UserRole.STAFF)
  const isTechnician = hasRole(UserRole.TECHNICIAN)
  const isManager = hasRole(UserRole.MANAGER)
  const isAdmin = hasRole(UserRole.ADMIN)

  return {
    user,
    isLoading,
    isAuthenticated,
    hasRole,
    isStaff,
    isTechnician,
    isManager,
    isAdmin
  }
}