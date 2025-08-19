"use client"

import { useState, useEffect } from "react"
import { UserRole } from "@prisma/client"

interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

interface UseAuthReturn {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  hasRole: (role: UserRole | UserRole[]) => boolean
  isStaff: boolean
  isTechnician: boolean
  isManager: boolean
  isAdmin: boolean
  login: (user: User) => void
  logout: () => void
}

export function useSimpleAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Failed to parse stored user:", error)
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = (userData: User) => {
    setUser(userData)
    localStorage.setItem("user", JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    window.location.href = "/auth/signin"
  }

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
    isAdmin,
    login,
    logout
  }
}