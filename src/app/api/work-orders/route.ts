import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { db } from "@/lib/db"
import { Priority, WorkOrderStatus } from "@/lib/mock-data"
import { AssignmentEngine } from "@/lib/assignment-engine"

const createWorkOrderSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  priority: z.nativeEnum(Priority),
  locationId: z.string().optional(),
  assetId: z.string().optional(),
  photos: z.array(z.string()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, category, priority, locationId, assetId, photos } = createWorkOrderSchema.parse(body)

    // Get user's hotel
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user?.hotelId) {
      return NextResponse.json(
        { error: "User not associated with any hotel" },
        { status: 400 }
      )
    }

    // Try to automatically assign work order
    const assignmentResult = await AssignmentEngine.findAssignee({
      category,
      priority,
      locationId,
      hotelId: user.hotelId
    })

    // Create work order with automatic assignment if found
    const workOrder = await db.workOrder.create({
      data: {
        title,
        description,
        category,
        priority,
        status: assignmentResult.assigneeId ? 'IN_PROGRESS' : 'LOGGED',
        hotelId: user.hotelId,
        createdById: session.user.id,
        assignedToId: assignmentResult.assigneeId,
        locationId: locationId || "default-location",
        assetId
      },
      include: {
        createdBy: true,
        assignedTo: true,
        location: true,
        asset: true
      }
    })

    // Create SLA record for the work order
    await AssignmentEngine.createSLA(workOrder.id, category, priority)

    // Update SLA if assigned
    if (assignmentResult.assigneeId) {
      await AssignmentEngine.updateSLAOnAssignment(workOrder.id)
    }

    // Note: Status history and media are handled automatically by our mock database
    // when creating work orders

    return NextResponse.json({
      workOrder,
      assignment: assignmentResult,
      message: assignmentResult.assigneeId 
        ? "Work order created and automatically assigned"
        : "Work order created but could not be automatically assigned"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Work order creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const assignedTo = searchParams.get("assignedTo")

    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user?.hotelId) {
      return NextResponse.json(
        { error: "User not associated with any hotel" },
        { status: 400 }
      )
    }

    const whereClause: any = {
      hotelId: user.hotelId,
      isActive: true
    }

    if (status) whereClause.status = status
    if (priority) whereClause.priority = priority
    if (assignedTo) whereClause.assignedToId = assignedTo

    // Staff can only see their own work orders
    if (user.role === "STAFF") {
      whereClause.createdById = session.user.id
    }

    const workOrders = await db.workOrder.findMany({
      where: whereClause,
      include: {
        createdBy: true,
        assignedTo: true,
        location: true,
        asset: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({
      workOrders
    })
  } catch (error) {
    console.error("Work orders fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}