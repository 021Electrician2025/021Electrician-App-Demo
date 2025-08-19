import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const incidents = await db.safetyIncident.findMany({
      include: {
        reportedBy: true,
        location: true
      },
      orderBy: {
        reportedAt: 'desc'
      }
    })

    const formattedIncidents = incidents.map(incident => ({
      id: incident.id,
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      status: incident.status,
      location: incident.location.name,
      reportedBy: incident.reportedBy.name,
      reportedAt: incident.reportedAt.toISOString(),
      resolvedAt: incident.resolvedAt?.toISOString(),
      actions: incident.actions
    }))

    return NextResponse.json(formattedIncidents)
  } catch (error) {
    console.error('Safety incidents fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}