"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSimpleAuth } from "@/hooks/use-simple-auth"
import { motion } from "framer-motion"

export function SplashScreen() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useSimpleAuth()
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
      if (!isLoading) {
        if (isAuthenticated) {
          router.push("/dashboard")
        } else {
          router.push("/auth/signin")
        }
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [isAuthenticated, isLoading, router])

  if (!showSplash) return null

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-48 h-48 mx-auto mb-8"
        >
          <img
            src="/Logo.jpeg"
            alt="Hotel Facilities Management"
            className="w-full h-full object-contain"
          />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-2xl font-bold text-foreground mb-2"
        >
          021 Electrician Application
        </motion.h1>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-8"
        >
          <div className="w-48 h-1 bg-primary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}