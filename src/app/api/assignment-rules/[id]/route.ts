import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    const assignmentRule = await prisma.assignmentRule.update({
      where: { id },
      data: body,
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

    return NextResponse.json(assignmentRule)
  } catch (error) {
    console.error('Failed to update assignment rule:', error)
    return NextResponse.json(
      { error: 'Failed to update assignment rule' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    await prisma.assignmentRule.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Assignment rule deleted successfully' })
  } catch (error) {
    console.error('Failed to delete assignment rule:', error)
    return NextResponse.json(
      { error: 'Failed to delete assignment rule' },
      { status: 500 }
    )
  }
}