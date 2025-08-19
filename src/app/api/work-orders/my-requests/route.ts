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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const whereClause: any = {
      createdById: session.user.id,
      isActive: true
    }

    if (status && status !== "all") {
      whereClause.status = status
    }

    if (search) {
      whereClause.OR = [
        {
          title: {
            contains: search,
            mode: "insensitive"
          }
        },
        {
          description: {
            contains: search,
            mode: "insensitive"
          }
        },
        {
          location: {
            name: {
              contains: search,
              mode: "insensitive"
            }
          }
        }
      ]
    }

    const workOrders = await db.workOrder.findMany({
      where: whereClause,
      include: {
        location: {
          select: {
            name: true
          }
        },
        assignedTo: {
          select: {
            name: true
          }
        },
        media: {
          select: {
            id: true,
            type: true,
            url: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({
      workOrders,
      message: "Work orders fetched successfully"
    })
  } catch (error) {
    console.error("Error fetching work orders:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}