import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const workOrder = await db.workOrder.findUnique({
      where: { id },
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
        },
        location: {
          select: {
            id: true,
            name: true
          }
        },
        asset: {
          select: {
            id: true,
            name: true
          }
        },
        media: {
          select: {
            id: true,
            type: true,
            url: true
          }
        },
        statusHistory: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        sla: {
          select: {
            expectedResponseTime: true,
            expectedResolutionTime: true,
            actualResponseTime: true,
            actualResolutionTime: true,
            isOverdue: true
          }
        }
      }
    })

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    return NextResponse.json({ workOrder })
  } catch (error) {
    console.error('Failed to fetch work order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work order' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status, technicianNotes } = await request.json()

    const updateData: any = {
      updatedAt: new Date()
    }

    if (status) {
      updateData.status = status
      
      // Set completion timestamp if completed
      if (status === 'COMPLETED') {
        updateData.actualCompletion = new Date()
      }
    }

    if (technicianNotes !== undefined) {
      updateData.technicianNotes = technicianNotes
    }

    const workOrder = await db.workOrder.update({
      where: { id: params.id },
      data: updateData,
      include: {
        reportedBy: true,
        assignedTo: true,
        location: true,
        asset: true
      }
    })

    return NextResponse.json(workOrder)
  } catch (error) {
    console.error('Work order update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.workOrder.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Work order delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}