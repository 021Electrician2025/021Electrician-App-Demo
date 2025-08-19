"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function SplashScreen() {
  const router = useRouter()
  const [showSplash, setShowSplash] = useState(true)
  const [showRouteSelection, setShowRouteSelection] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
      setShowRouteSelection(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (showSplash) {
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

  if (showRouteSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-4xl"
        >
          <div className="text-center mb-12">
            <img
              src="/Logo.jpeg"
              alt="021 Electrician Application"
              className="w-24 h-24 mx-auto mb-6 rounded-lg shadow-lg"
            />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              021 Electrician Application
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
              Choose your interface to get started
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Demo credentials are pre-configured for quick testing
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Manager Dashboard */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <CardTitle className="text-2xl text-blue-700 dark:text-blue-400">
                    Manager Dashboard
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Desktop interface for facility managers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Perfect for:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Work order management</li>
                        <li>Asset tracking & maintenance</li>
                        <li>PPM scheduling</li>
                        <li>Reports & analytics</li>
                        <li>Team oversight</li>
                      </ul>
                    </div>
                    <Button 
                      onClick={() => router.push("/manager")}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                    >
                      Access Manager Dashboard →
                    </Button>
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Demo: manager@grandpalace.com / demo123
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Mobile Interface */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <CardTitle className="text-2xl text-green-700 dark:text-green-400">
                    Mobile Interface
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Touch-optimized for field staff
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Perfect for:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Quick work requests</li>
                        <li>QR code scanning</li>
                        <li>Photo attachments</li>
                        <li>Digital signatures</li>
                        <li>Field updates</li>
                      </ul>
                    </div>
                    <Button 
                      onClick={() => router.push("/mobile")}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      size="lg"
                    >
                      Access Mobile Interface →
                    </Button>
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Demo: staff@grandpalace.com / demo123
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-center"
          >
            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  🚀 Quick Demo Ready
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  All demo accounts are pre-configured with sample data. No registration required!
                  <br />
                  <strong>Additional accounts:</strong> tech@grandpalace.com, admin@grandpalace.com (password: demo123)
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return null
}