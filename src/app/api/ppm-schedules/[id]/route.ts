import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isActive } = await request.json()

    const schedule = await db.pPMSchedule.update({
      where: { id: params.id },
      data: { isActive },
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
    console.error('PPM schedule update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}