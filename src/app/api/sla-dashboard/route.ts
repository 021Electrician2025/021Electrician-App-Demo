import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const priority = searchParams.get('priority')
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    // Get user's hotel
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { hotelId: true }
    })

    if (!user?.hotelId) {
      return NextResponse.json({ error: 'User not associated with hotel' }, { status: 400 })
    }

    // Build where clause for filtering
    const whereClause: any = {
      workOrder: {
        hotelId: user.hotelId,
        isActive: true
      }
    }

    if (priority) whereClause.priority = priority
    if (category) whereClause.category = category
    
    // Handle status filter
    if (status === 'overdue') {
      whereClause.isOverdue = true
    } else if (status === 'compliant') {
      whereClause.isOverdue = false
      whereClause.OR = [
        { actualResponseTime: { lte: prisma.workOrderSLA.fields.expectedResponseTime } },
        { actualResolutionTime: { lte: prisma.workOrderSLA.fields.expectedResolutionTime } }
      ]
    } else if (status === 'pending') {
      whereClause.firstResponseAt = null
      whereClause.resolvedAt = null
    }

    // Fetch SLA data
    const slaData = await prisma.workOrderSLA.findMany({
      where: whereClause,
      include: {
        workOrder: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: [
        { isOverdue: 'desc' }, // Overdue items first
        { createdAt: 'desc' }
      ]
    })

    // Calculate metrics
    const totalWorkOrders = slaData.length
    let onTimeResponse = 0
    let onTimeResolution = 0
    let totalResponseTime = 0
    let totalResolutionTime = 0
    let responseCount = 0
    let resolutionCount = 0
    let overdueCount = 0

    for (const sla of slaData) {
      // Response time metrics
      if (sla.actualResponseTime !== null) {
        responseCount++
        totalResponseTime += sla.actualResponseTime
        if (sla.actualResponseTime <= sla.expectedResponseTime) {
          onTimeResponse++
        }
      }

      // Resolution time metrics
      if (sla.actualResolutionTime !== null) {
        resolutionCount++
        totalResolutionTime += sla.actualResolutionTime
        if (sla.actualResolutionTime <= sla.expectedResolutionTime) {
          onTimeResolution++
        }
      }

      // Overdue count
      if (sla.isOverdue) {
        overdueCount++
      }
    }

    const metrics = {
      totalWorkOrders,
      onTimeResponse,
      onTimeResolution,
      averageResponseTime: responseCount > 0 ? totalResponseTime / responseCount : 0,
      averageResolutionTime: resolutionCount > 0 ? totalResolutionTime / resolutionCount : 0,
      overdueCount,
      responseComplianceRate: responseCount > 0 ? (onTimeResponse / responseCount) * 100 : 0,
      resolutionComplianceRate: resolutionCount > 0 ? (onTimeResolution / resolutionCount) * 100 : 0
    }

    return NextResponse.json({ 
      slaData,
      metrics 
    })
  } catch (error) {
    console.error('Failed to fetch SLA dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SLA dashboard data' },
      { status: 500 }
    )
  }
}