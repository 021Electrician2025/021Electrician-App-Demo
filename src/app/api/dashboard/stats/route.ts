import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { PPMStatus, Priority, WorkOrderStatus } from "@/lib/mock-data"

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
      where: { id: session.user.id }
    })

    if (!user?.hotelId) {
      return NextResponse.json(
        { error: "User not associated with any hotel" },
        { status: 400 }
      )
    }

    // Get PPM statistics from mock data
    const ppmTasks = await db.pPMTask.findMany({
      where: {
        schedule: {
          hotelId: user.hotelId
        }
      }
    })

    const overduePPM = ppmTasks.filter(task => task.status === 'OVERDUE').length
    const dueSoonPPM = ppmTasks.filter(task => {
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      return task.status === 'SCHEDULED' && task.dueDate <= sevenDaysFromNow
    }).length
    const compliantPPM = ppmTasks.filter(task => task.status === 'COMPLETED').length

    // Get work order statistics from mock data
    const workOrders = await db.workOrder.findMany({
      where: {
        hotelId: user.hotelId,
        isActive: true
      }
    })

    const openHighPriority = workOrders.filter(wo => 
      wo.priority === 'HIGH' && ['LOGGED', 'IN_PROGRESS', 'ON_HOLD'].includes(wo.status)
    ).length

    // Calculate average response time (mock data for now)
    const averageResponseTime = 45 // minutes

    // Calculate monthly spend (mock data for now)
    const monthlySpend = 12500 // dollars

    // Calculate asset uptime (mock data for now)
    const assetUptime = 98.5 // percentage

    const stats = {
      overduePPM,
      dueSoonPPM,
      compliantPPM,
      openHighPriority,
      averageResponseTime,
      monthlySpend,
      assetUptime
    }

    return NextResponse.json({
      stats,
      message: "Dashboard stats fetched successfully"
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}