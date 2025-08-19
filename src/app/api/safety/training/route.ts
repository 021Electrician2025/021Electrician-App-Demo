import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const trainingRecords = await db.trainingRecord.findMany({
      include: {
        employee: true,
        certificate: true
      },
      orderBy: {
        completionDate: 'desc'
      }
    })

    const formattedRecords = trainingRecords.map(record => ({
      id: record.id,
      title: record.title,
      description: record.description,
      category: record.category,
      completionDate: record.completionDate?.toISOString(),
      score: record.score,
      status: record.status,
      employeeName: record.employee.name,
      employeeId: record.employee.employeeId,
      certificateId: record.certificateId
    }))

    return NextResponse.json(formattedRecords)
  } catch (error) {
    console.error('Training records fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}