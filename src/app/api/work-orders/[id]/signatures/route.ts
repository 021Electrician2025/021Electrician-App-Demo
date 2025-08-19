import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AssignmentEngine } from '@/lib/assignment-engine'

export async function POST(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workOrderId } = params
    const body = await request.json()
    const {
      signatureType,
      signatureData,
      signerName,
      signerTitle,
      notes
    } = body

    // Validate required fields
    if (!signatureType || !signatureData || !signerName || !signerTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify work order exists and user has permission
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        createdBy: true,
        assignedTo: true,
        hotel: true
      }
    })

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    // Get user's information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { hotelId: true, role: true }
    })

    // Check permissions based on signature type
    const canSign = checkSignaturePermission(signatureType, user, workOrder, session.user.id)
    if (!canSign.allowed) {
      return NextResponse.json({ error: canSign.reason }, { status: 403 })
    }

    // Get client info for audit trail
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create digital signature record
    const signature = await prisma.digitalSignature.create({
      data: {
        workOrderId,
        signatureType,
        signatureData,
        signerName,
        signerTitle,
        signerUserId: session.user.id,
        notes,
        ipAddress,
        userAgent
      }
    })

    // Update work order status based on signature type
    let newStatus = workOrder.status
    let statusNotes = `${signatureType} signature added by ${signerName}`
    
    if (signatureType === 'completion') {
      newStatus = 'COMPLETED'
      statusNotes = `Work completed and signed by ${signerName}${notes ? `. Notes: ${notes}` : ''}`
      
      // Update SLA for completion
      await AssignmentEngine.updateSLAOnResolution(workOrderId)
    } else if (signatureType === 'approval') {
      newStatus = 'COMPLETED'
      statusNotes = `Work approved and signed by ${signerName}${notes ? `. Notes: ${notes}` : ''}`
    }

    // Update work order status if changed
    if (newStatus !== workOrder.status) {
      await prisma.workOrder.update({
        where: { id: workOrderId },
        data: { status: newStatus as any }
      })

      // Create status history entry
      await prisma.workOrderStatusHistory.create({
        data: {
          workOrderId,
          status: newStatus as any,
          userId: session.user.id,
          notes: statusNotes
        }
      })
    }

    return NextResponse.json({
      signature,
      message: `${signatureType} signature recorded successfully`
    })
  } catch (error) {
    console.error('Failed to create signature:', error)
    return NextResponse.json(
      { error: 'Failed to create signature' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workOrderId } = params

    const signatures = await prisma.digitalSignature.findMany({
      where: { workOrderId },
      include: {
        signer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ signatures })
  } catch (error) {
    console.error('Failed to fetch signatures:', error)
    return NextResponse.json(
      { error: 'Failed to fetch signatures' },
      { status: 500 }
    )
  }
}

function checkSignaturePermission(
  signatureType: string,
  user: any,
  workOrder: any,
  userId: string
) {
  switch (signatureType) {
    case 'completion':
      // Only assigned technician can sign completion
      if (workOrder.assignedToId !== userId) {
        return {
          allowed: false,
          reason: 'Only the assigned technician can sign work completion'
        }
      }
      if (workOrder.status !== 'IN_PROGRESS') {
        return {
          allowed: false,
          reason: 'Work order must be in progress to sign completion'
        }
      }
      break

    case 'approval':
      // Only managers can approve completed work
      if (!['MANAGER', 'ADMIN'].includes(user?.role)) {
        return {
          allowed: false,
          reason: 'Only managers can approve completed work'
        }
      }
      if (workOrder.status !== 'COMPLETED') {
        return {
          allowed: false,
          reason: 'Work order must be completed before approval'
        }
      }
      break

    case 'handover':
      // Staff or managers can sign handover
      if (!['STAFF', 'MANAGER', 'ADMIN'].includes(user?.role)) {
        return {
          allowed: false,
          reason: 'Only staff or managers can sign handover'
        }
      }
      break

    default:
      return {
        allowed: false,
        reason: 'Invalid signature type'
      }
  }

  return { allowed: true }
}