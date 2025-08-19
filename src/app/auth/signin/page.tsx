"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Icons } from "@/components/icons"
import { useToast } from "@/hooks/use-toast"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
})

type LoginForm = z.infer<typeof loginSchema>

// Demo users
const demoUsers = [
  {
    email: "staff@hotel.com",
    password: "password123",
    name: "John Staff",
    role: "STAFF"
  },
  {
    email: "tech@hotel.com",
    password: "password123",
    name: "Mike Technician",
    role: "TECHNICIAN"
  },
  {
    email: "manager@hotel.com",
    password: "password123",
    name: "Sarah Manager",
    role: "MANAGER"
  },
  {
    email: "admin@hotel.com",
    password: "password123",
    name: "Admin User",
    role: "ADMIN"
  }
]

export default function SimpleSigninPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError("")

    try {
      // Find user in demo users
      const user = demoUsers.find(
        u => u.email === data.email && u.password === data.password
      )

      if (!user) {
        setError("Invalid credentials")
        return
      }

      // Store user in localStorage for demo purposes
      localStorage.setItem("user", JSON.stringify(user))

      toast({
        title: "Welcome back!",
        description: `You have been successfully signed in as ${user.name}.`
      })

      // Redirect based on role
      if (user.role === "STAFF") {
        router.push("/mobile")
      } else {
        router.push("/manager")
      }
    } catch (error) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const quickLogin = (user: typeof demoUsers[0]) => {
    localStorage.setItem("user", JSON.stringify(user))
    toast({
      title: "Welcome back!",
      description: `You have been successfully signed in as ${user.name}.`
    })

    if (user.role === "STAFF") {
      router.push("/mobile")
    } else {
      router.push("/manager")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
    
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Login (Demo)</CardTitle>
            <CardDescription>
              Click any user below to quickly access the system
            </CardDescription>
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