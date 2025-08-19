import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const assets = await db.asset.findMany({
      include: {
        location: true,
        workOrders: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const formattedAssets = assets.map(asset => {
      const currentAge = Math.floor((Date.now() - asset.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
      const lastMaintenance = asset.workOrders[0]?.createdAt
      const nextMaintenance = asset.workOrders[0]?.estimatedCompletion

      return {
        id: asset.id,
        name: asset.name,
        description: asset.description,
        category: asset.category,
        location: asset.location.name,
        qrCode: asset.qrCode,
        status: asset.status,
        purchaseDate: asset.purchaseDate.toISOString(),
        warrantyExpiry: asset.warrantyExpiry?.toISOString(),
        expectedLifespan: asset.expectedLifespan,
        currentAge,
        lastMaintenance: lastMaintenance?.toISOString(),
        nextMaintenance: nextMaintenance?.toISOString(),
        manufacturer: asset.manufacturer,
        model: asset.model,
        serialNumber: asset.serialNumber,
        cost: asset.cost,
        condition: asset.condition
      }
    })

    return NextResponse.json(formattedAssets)
  } catch (error) {
    console.error('Assets fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, category, locationId, manufacturer, model, serialNumber, cost, expectedLifespan, warrantyExpiry } = body

    // Generate QR code
    const qrCode = `ASSET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const asset = await db.asset.create({
      data: {
        name,
        description,
        category,
        locationId,
        qrCode,
        status: 'ACTIVE',
        purchaseDate: new Date(),
        expectedLifespan,
        manufacturer,
        model,
        serialNumber,
        cost,
        condition: 'EXCELLENT',
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null
      },
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
    console.error('Asset creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}