import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') || 'last30days'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const status = searchParams.get('status')

    // Calculate date range
    let start = new Date()
    let end = new Date()

    switch (dateRange) {
      case 'last7days':
        start.setDate(start.getDate() - 7)
        break
      case 'last30days':
        start.setDate(start.getDate() - 30)
        break
      case 'last90days':
        start.setDate(start.getDate() - 90)
        break
      case 'thisyear':
        start = new Date(start.getFullYear(), 0, 1)
        break
      case 'custom':
        if (startDate) start = new Date(startDate)
        if (endDate) end = new Date(endDate)
        break
    }

    // Build where clause
    const where: any = {
      createdAt: {
        gte: start,
        lte: end
      }
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' }
    }

    if (location) {
      where.location = {
        name: { contains: location, mode: 'insensitive' }
      }
    }

    if (status) {
      where.status = status
    }

    // Fetch work orders with filters
    const workOrders = await db.workOrder.findMany({
      where,
      include: {
        location: true,
        reportedBy: true,
        assignedTo: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate statistics
    const totalWorkOrders = workOrders.length
    const completedWorkOrders = workOrders.filter(wo => wo.status === 'COMPLETED').length
    const pendingWorkOrders = workOrders.filter(wo => wo.status === 'OPEN' || wo.status === 'IN_PROGRESS').length
    const overdueWorkOrders = workOrders.filter(wo => 
      wo.status !== 'COMPLETED' && wo.estimatedCompletion && new Date(wo.estimatedCompletion) < new Date()
    ).length

    // Calculate average resolution time
    const completedOrders = workOrders.filter(wo => wo.status === 'COMPLETED' && wo.actualCompletion)
    const averageResolutionTime = completedOrders.length > 0
      ? Math.round(completedOrders.reduce((sum, wo) => {
          const duration = new Date(wo.actualCompletion!).getTime() - new Date(wo.createdAt).getTime()
          return sum + (duration / (1000 * 60 * 60)) // Convert to hours
        }, 0) / completedOrders.length)
      : 0

    // Top categories
    const categoryCounts = workOrders.reduce((acc, wo) => {
      acc[wo.category] = (acc[wo.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / totalWorkOrders) * 100)
      }))

    // Top locations
    const locationCounts = workOrders.reduce((acc, wo) => {
      const locationName = wo.location?.name || 'Unknown'
      acc[locationName] = (acc[locationName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topLocations = Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([location, count]) => ({
        location,
        count,
        percentage: Math.round((count / totalWorkOrders) * 100)
      }))

    // Monthly trends (last 6 months)
    const monthlyTrends = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - i)
      monthStart.setDate(1)
      
      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)
      monthEnd.setDate(0)

      const monthOrders = workOrders.filter(wo => 
        wo.createdAt >= monthStart && wo.createdAt <= monthEnd
      )

      monthlyTrends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        total: monthOrders.length,
        completed: monthOrders.filter(wo => wo.status === 'COMPLETED').length
      })
    }

    // Recent work orders
    const recentWorkOrders = workOrders.slice(0, 10).map(wo => ({
      id: wo.id,
      title: wo.title,
      status: wo.status,
      priority: wo.priority,
      location: wo.location?.name || 'Unknown',
      createdAt: wo.createdAt.toISOString(),
      completedAt: wo.actualCompletion?.toISOString()
    }))

    const reportData = {
      totalWorkOrders,
      completedWorkOrders,
      pendingWorkOrders,
      overdueWorkOrders,
      averageResolutionTime,
      topCategories,
      topLocations,
      monthlyTrends,
      recentWorkOrders
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}