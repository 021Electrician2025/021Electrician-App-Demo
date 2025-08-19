import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status, condition } = await request.json()

    const updateData: any = {}
    if (status) updateData.status = status
    if (condition) updateData.condition = condition

    const asset = await db.asset.update({
      where: { id: params.id },
      data: updateData,
      include: {
        location: true,
        workOrders: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    return NextResponse.json(asset)
  } catch (error) {
    console.error('Asset update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}