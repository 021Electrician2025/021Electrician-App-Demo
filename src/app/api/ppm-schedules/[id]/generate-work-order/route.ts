import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { taskId, locationId, assetId, assignedToId } = await request.json()
    
    const schedule = await db.pPMSchedule.findUnique({
      where: { id: params.id },
      include: {
        hotel: true,
        tasks: true
      }
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    // Create work order from PPM schedule
    const workOrder = await db.workOrder.create({
      data: {
        title: `PPM: ${schedule.name}`,
        description: schedule.description || `Preventive maintenance for ${schedule.name}`,
        status: 'LOGGED',
        priority: 'MEDIUM',
        category: 'Preventive Maintenance',
        locationId: locationId,
        assetId: assetId,
        hotelId: schedule.hotelId,
        createdById: assignedToId || 'system', // This should be the user creating the WO
        assignedToId: assignedToId
      },
      include: {
        createdBy: true,
        assignedTo: true,
        location: true,
        asset: true,
        hotel: true
      }
    })

    // If there's a specific task, create a PPM task record
    if (taskId) {
      const nextDueDate = new Date()
      switch (schedule.frequency.toUpperCase()) {
        case 'DAILY':
          nextDueDate.setDate(nextDueDate.getDate() + 1)
          break
        case 'WEEKLY':
          nextDueDate.setDate(nextDueDate.getDate() + 7)
          break
        case 'MONTHLY':
          nextDueDate.setMonth(nextDueDate.getMonth() + 1)
          break
        case 'QUARTERLY':
          nextDueDate.setMonth(nextDueDate.getMonth() + 3)
          break
        case 'YEARLY':
          nextDueDate.setFullYear(nextDueDate.getFullYear() + 1)
          break
        default:
          nextDueDate.setDate(nextDueDate.getDate() + 30) // Default to monthly
      }

      await db.pPMTask.create({
        data: {
          title: `PPM Task: ${schedule.name}`,
          description: schedule.description,
          dueDate: nextDueDate,
          status: 'SCHEDULED',
          scheduleId: schedule.id,
          assetId: assetId,
          assignedToId: assignedToId
        }
      })
    }

    return NextResponse.json(workOrder)
  } catch (error) {
    console.error('Work order generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}