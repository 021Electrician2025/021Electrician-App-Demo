import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { Priority, WorkOrderStatus } from "@/lib/mock-data"

const createWorkOrderSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  priority: z.nativeEnum(Priority),
  location: z.string().min(1),
  photos: z.array(z.string()).optional(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    role: z.string()
  })
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, category, priority, location, photos, user } = createWorkOrderSchema.parse(body)

    // For demo purposes, just return a successful response
    // In a real app, you'd save to database using the user info
    const mockWorkOrder = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      category,
      priority,
      status: WorkOrderStatus.LOGGED,
      location,
      createdBy: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      createdAt: new Date().toISOString(),
      photos: photos || []
    }

    return NextResponse.json({
      workOrder: mockWorkOrder,
      message: "Work order created successfully"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Simple work order creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}