import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { db } from "@/lib/db"

const updateProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional()
})

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, email, phone } = updateProfileSchema.parse(body)

    // Check if email is already taken by another user
    const existingUser = await db.user.findFirst({
      where: {
        email,
        NOT: {
          id: session.user.id
        }
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already taken" },
        { status: 400 }
      )
    }

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email,
        phone
      },
      include: {
        hotel: true
      }
    })

    // Return user data without password
    const { password: _, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      user: userWithoutPassword,
      message: "Profile updated successfully"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}