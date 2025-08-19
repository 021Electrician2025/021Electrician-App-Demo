import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { WorkOrderStatus } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const count = await db.workOrder.count({
      where: {
        createdById: session.user.id,
        status: {
          in: [WorkOrderStatus.LOGGED, WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.ON_HOLD]
        },
        isActive: true
      }
    })

    return NextResponse.json({
      count,
      message: "Open work orders count fetched successfully"
    })
  } catch (error) {
    console.error("Error counting open work orders:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}