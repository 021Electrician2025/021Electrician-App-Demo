import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await db.workOrderComment.findMany({
      where: { workOrderId: params.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Comments fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { content, author, type } = await request.json()

    const comment = await db.workOrderComment.create({
      data: {
        workOrderId: params.id,
        content,
        author,
        type
      }
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Comment creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}