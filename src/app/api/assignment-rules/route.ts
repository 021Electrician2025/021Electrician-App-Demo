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
    const hotelId = searchParams.get('hotelId')

    const assignmentRules = await prisma.assignmentRule.findMany({
      where: hotelId ? { hotelId } : undefined,
      include: {
        hotel: true,
        location: true,
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(assignmentRules)
  } catch (error) {
    console.error('Failed to fetch assignment rules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignment rules' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      hotelId,
      category,
      priority,
      locationId,
      assigneeId
    } = body

    // Validate required fields
    if (!name || !hotelId || !category || !assigneeId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify assignee is a technician or manager
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
      select: { role: true }
    })

    if (!assignee || !['TECHNICIAN', 'MANAGER', 'ADMIN'].includes(assignee.role)) {
      return NextResponse.json(
        { error: 'Assignee must be a technician, manager, or admin' },
        { status: 400 }
      )
    }

    const assignmentRule = await prisma.assignmentRule.create({
      data: {
        name,
        description,
        hotelId,
        category,
        priority: priority || null,
        locationId: locationId || null,
        assigneeId
      },
      include: {
        hotel: true,
        location: true,
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(assignmentRule, { status: 201 })
  } catch (error) {
    console.error('Failed to create assignment rule:', error)
    return NextResponse.json(
      { error: 'Failed to create assignment rule' },
      { status: 500 }
    )
  }
}