import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const schedules = await db.pPMSchedule.findMany({
      include: {
        hotel: true,
        tasks: {
          include: {
            asset: {
              include: {
                location: true
              }
            },
            assignedTo: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    })

    const formattedSchedules = schedules.map(schedule => ({
      id: schedule.id,
      name: schedule.name,
      description: schedule.description,
      frequency: schedule.frequency,
      startDate: schedule.startDate.toISOString(),
      endDate: schedule.endDate?.toISOString(),
      isActive: schedule.isActive,
      hotel: schedule.hotel.name,
      taskCount: schedule.tasks.length,
      activeTasks: schedule.tasks.filter(task => task.status === 'SCHEDULED').length,
      overdueTasks: schedule.tasks.filter(task => task.status === 'OVERDUE').length
    }))

    return NextResponse.json(formattedSchedules)
  } catch (error) {
    console.error('PPM schedules fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, frequency, startDate, endDate, hotelId } = body

    const schedule = await db.pPMSchedule.create({
      data: {
        name,
        description,
        frequency,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        hotelId,
        isActive: true
      },
      include: {
        hotel: true,
        tasks: {
          include: {
            asset: {
              include: {
                location: true
              }
            },
            assignedTo: true
          }
        }
      }
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('PPM schedule creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}