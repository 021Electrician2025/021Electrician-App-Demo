import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { action, workOrderIds } = await request.json()

    if (!action || !workOrderIds || !Array.isArray(workOrderIds)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'assign':
        // Assign work orders to available technicians
        const technicians = await db.user.findMany({
          where: { role: 'TECHNICIAN' }
        })

        if (technicians.length === 0) {
          return NextResponse.json(
            { error: 'No technicians available' },
            { status: 400 }
          )
        }

        const assignments = workOrderIds.map((id: string, index: number) => 
          db.workOrder.update({
            where: { id },
            data: {
              assignedToId: technicians[index % technicians.length].id,
              status: 'IN_PROGRESS',
              updatedAt: new Date()
            }
          })
        )

        await Promise.all(assignments)
        break

      case 'cancel':
        await db.workOrder.updateMany({
          where: { id: { in: workOrderIds } },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date()
          }
        })
        break

      case 'delete':
        await db.workOrder.deleteMany({
          where: { id: { in: workOrderIds } }
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Bulk action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}