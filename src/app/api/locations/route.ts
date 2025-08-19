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
    const search = searchParams.get("search")

    const whereClause: any = {
      isActive: true
    }

    if (session.user.hotelId) {
      whereClause.hotelId = session.user.hotelId
    }

    if (search) {
      whereClause.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive"
          }
        },
        {
          type: {
            contains: search,
            mode: "insensitive"
          }
        }
      ]
    }

    const locations = await db.location.findMany({
      where: whereClause,
      include: {
        children: {
          where: {
            isActive: true
          },
          include: {
            children: {
              where: {
                isActive: true
              }
            }
          }
        }
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      locations,
      message: "Locations fetched successfully"
    })
  } catch (error) {
    console.error("Error fetching locations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}