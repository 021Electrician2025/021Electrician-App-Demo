import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const workOrders = await db.workOrder.findMany({
      where: {
        createdById: session.user.id,
        isActive: true
      },
      include: {
        location: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 5 // Limit to 5 most recent requests
    })

    return NextResponse.json({
      workOrders,
      message: "Recent work orders fetched successfully"
    })
  } catch (error) {
    console.error("Error fetching recent work orders:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}