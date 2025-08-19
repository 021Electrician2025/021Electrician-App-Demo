"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSimpleAuth } from "@/hooks/use-simple-auth"
import { SplashScreen } from "@/components/splash-screen"

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useSimpleAuth()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.push("/auth/signin")
      return
    }

    // Route based on user role
    if (user?.role === "STAFF") {
      router.push("/mobile")
    } else {
      router.push("/manager")
    }
  }, [isAuthenticated, isLoading, router, user])

  if (isLoading) {
    return <SplashScreen />
  }

  return <SplashScreen />
}