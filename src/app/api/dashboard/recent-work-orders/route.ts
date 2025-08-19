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

    // Get user's hotel ID
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { hotelId: true }
    })

    if (!user?.hotelId) {
      return NextResponse.json(
        { error: "User not associated with any hotel" },
        { status: 400 }
      )
    }

    const workOrders = await db.workOrder.findMany({
      where: {
        hotelId: user.hotelId,
        isActive: true
      },
      include: {
        location: {
          select: {
            name: true
          }
        },
        createdBy: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10 // Limit to 10 most recent
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