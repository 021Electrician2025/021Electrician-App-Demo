import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Generate new QR code
    const qrCode = `ASSET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const asset = await db.asset.update({
      where: { id: params.id },
      data: { qrCode },
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
    console.error('QR code generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}