import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const certificates = await db.certificate.findMany({
      include: {
        employee: true
      },
      orderBy: {
        expiryDate: 'asc'
      }
    })

    const formattedCertificates = certificates.map(cert => {
      const now = new Date()
      const expiryDate = new Date(cert.expiryDate)
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      let status: 'VALID' | 'EXPIRING' | 'EXPIRED' = 'VALID'
      if (daysUntilExpiry <= 0) {
        status = 'EXPIRED'
      } else if (daysUntilExpiry <= 30) {
        status = 'EXPIRING'
      }

      return {
        id: cert.id,
        title: cert.title,
        description: cert.description,
        category: cert.category,
        issuedBy: cert.issuedBy,
        issuedDate: cert.issuedDate.toISOString(),
        expiryDate: cert.expiryDate.toISOString(),
        status,
        employeeName: cert.employee.name,
        employeeId: cert.employee.employeeId,
        documentUrl: cert.documentUrl,
        reminderSent: cert.reminderSent
      }
    })

    return NextResponse.json(formattedCertificates)
  } catch (error) {
    console.error('Certificates fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, category, issuedBy, issuedDate, expiryDate, employeeId, documentUrl } = body

    // Find employee
    const employee = await db.user.findFirst({
      where: { employeeId }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    const certificate = await db.certificate.create({
      data: {
        title,
        description,
        category,
        issuedBy,
        issuedDate: new Date(issuedDate),
        expiryDate: new Date(expiryDate),
        employeeId: employee.id,
        documentUrl,
        reminderSent: false
      },
      include: {
        employee: true
      }
    })

    return NextResponse.json(certificate)
  } catch (error) {
    console.error('Certificate creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}