import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      startDate,
      endDate,
      categories = [],
      format = 'pdf', // 'pdf' or 'excel'
      includeWorkOrders = true,
      includePPM = true,
      includeCertificates = true,
      includeIncidents = true,
      includeSLA = true
    } = body

    // Get user's hotel
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    })

    if (!user?.hotel) {
      return NextResponse.json({ error: 'User not associated with hotel' }, { status: 400 })
    }

    const hotel = user.hotel

    // Build date filters
    const dateFilter = {
      gte: startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Default 90 days
      lte: endDate ? new Date(endDate) : new Date()
    }

    // Build category filter
    const categoryFilter = categories.length > 0 ? { in: categories } : undefined

    // Collect all data
    const auditData: any = {
      hotel,
      period: { start: dateFilter.gte, end: dateFilter.lte },
      workOrders: [],
      ppmTasks: [],
      certificates: [],
      incidents: [],
      slaMetrics: null
    }

    // Fetch Work Orders
    if (includeWorkOrders) {
      auditData.workOrders = await prisma.workOrder.findMany({
        where: {
          hotelId: hotel.id,
          createdAt: dateFilter,
          ...(categoryFilter && { category: categoryFilter }),
          isActive: true
        },
        include: {
          createdBy: { select: { name: true, role: true } },
          assignedTo: { select: { name: true, role: true } },
          location: { select: { name: true } },
          asset: { select: { name: true } },
          statusHistory: {
            include: {
              user: { select: { name: true } }
            },
            orderBy: { createdAt: 'asc' }
          },
          signatures: {
            select: {
              signatureType: true,
              signerName: true,
              signerTitle: true,
              createdAt: true
            }
          },
          sla: true
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    // Fetch PPM Tasks
    if (includePPM) {
      auditData.ppmTasks = await prisma.pPMTask.findMany({
        where: {
          schedule: {
            hotelId: hotel.id
          },
          dueDate: dateFilter,
          ...(categoryFilter && { 
            schedule: { 
              category: categoryFilter 
            } 
          })
        },
        include: {
          schedule: {
            select: {
              title: true,
              description: true,
              category: true,
              frequency: true
            }
          },
          assignedTo: { select: { name: true, role: true } },
          completedBy: { select: { name: true, role: true } }
        },
        orderBy: { dueDate: 'desc' }
      })
    }

    // Fetch Safety Certificates
    if (includeCertificates) {
      auditData.certificates = await prisma.trainingRecord.findMany({
        where: {
          user: {
            hotelId: hotel.id
          },
          completionDate: dateFilter,
          ...(categoryFilter && { category: categoryFilter })
        },
        include: {
          user: { select: { name: true, role: true } }
        },
        orderBy: { completionDate: 'desc' }
      })
    }

    // Fetch Safety Incidents (using TrainingRecord as proxy - in real system would be separate incident model)
    if (includeIncidents) {
      auditData.incidents = await prisma.workOrder.findMany({
        where: {
          hotelId: hotel.id,
          createdAt: dateFilter,
          priority: 'CRITICAL', // Critical work orders as safety incidents
          isActive: true
        },
        include: {
          createdBy: { select: { name: true, role: true } },
          assignedTo: { select: { name: true, role: true } },
          location: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    // Calculate SLA Metrics
    if (includeSLA) {
      const slaData = await prisma.workOrderSLA.findMany({
        where: {
          workOrder: {
            hotelId: hotel.id,
            createdAt: dateFilter
          }
        }
      })

      const totalSLA = slaData.length
      const onTimeResponse = slaData.filter(sla => 
        sla.actualResponseTime && sla.actualResponseTime <= sla.expectedResponseTime
      ).length
      const onTimeResolution = slaData.filter(sla => 
        sla.actualResolutionTime && sla.actualResolutionTime <= sla.expectedResolutionTime
      ).length
      const overdueCount = slaData.filter(sla => sla.isOverdue).length

      auditData.slaMetrics = {
        total: totalSLA,
        onTimeResponse,
        onTimeResolution,
        overdueCount,
        responseCompliance: totalSLA > 0 ? Math.round((onTimeResponse / totalSLA) * 100) : 0,
        resolutionCompliance: totalSLA > 0 ? Math.round((onTimeResolution / totalSLA) * 100) : 0
      }
    }

    // Generate the requested format
    if (format === 'pdf') {
      const pdfBuffer = await generatePDFAuditPack(auditData)
      
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="audit-pack-${hotel.name}-${new Date().toISOString().split('T')[0]}.pdf"`
        }
      })
    } else if (format === 'excel') {
      const excelBuffer = await generateExcelAuditPack(auditData)
      
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="audit-pack-${hotel.name}-${new Date().toISOString().split('T')[0]}.xlsx"`
        }
      })
    }

    return NextResponse.json({ error: 'Invalid format specified' }, { status: 400 })
  } catch (error) {
    console.error('Failed to generate audit pack:', error)
    return NextResponse.json(
      { error: 'Failed to generate audit pack' },
      { status: 500 }
    )
  }
}

async function generatePDFAuditPack(auditData: any): Promise<Buffer> {
  const doc = new jsPDF()
  const { hotel, period, workOrders, ppmTasks, certificates, incidents, slaMetrics } = auditData

  // Title Page
  doc.setFontSize(20)
  doc.text(`Compliance Audit Pack`, 20, 30)
  doc.setFontSize(16)
  doc.text(`${hotel.name}`, 20, 45)
  doc.setFontSize(12)
  doc.text(`Period: ${period.start.toLocaleDateString()} - ${period.end.toLocaleDateString()}`, 20, 60)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 70)
  doc.text(`Address: ${hotel.address || 'N/A'}`, 20, 80)

  let yPosition = 100

  // Executive Summary
  doc.setFontSize(14)
  doc.text('Executive Summary', 20, yPosition)
  yPosition += 15

  const summaryData = [
    ['Work Orders Completed', workOrders.filter((wo: any) => wo.status === 'COMPLETED').length.toString()],
    ['PPM Tasks Completed', ppmTasks.filter((task: any) => task.status === 'COMPLETED').length.toString()],
    ['Safety Certificates', certificates.length.toString()],
    ['Critical Incidents', incidents.length.toString()],
    ['SLA Compliance Rate', slaMetrics ? `${slaMetrics.responseCompliance}%` : 'N/A']
  ]

  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid'
  })

  // Work Orders Section
  if (workOrders.length > 0) {
    doc.addPage()
    doc.setFontSize(14)
    doc.text('Work Orders', 20, 30)

    const workOrderData = workOrders.map((wo: any) => [
      wo.title,
      wo.category,
      wo.priority,
      wo.status,
      wo.createdBy?.name || 'Unknown',
      wo.assignedTo?.name || 'Unassigned',
      new Date(wo.createdAt).toLocaleDateString(),
      wo.signatures.length > 0 ? 'Signed' : 'Unsigned'
    ])

    autoTable(doc, {
      startY: 45,
      head: [['Title', 'Category', 'Priority', 'Status', 'Created By', 'Assigned To', 'Date', 'Signatures']],
      body: workOrderData,
      theme: 'grid',
      styles: { fontSize: 8 }
    })
  }

  // PPM Tasks Section
  if (ppmTasks.length > 0) {
    doc.addPage()
    doc.setFontSize(14)
    doc.text('Preventive Maintenance (PPM)', 20, 30)

    const ppmData = ppmTasks.map((task: any) => [
      task.schedule?.title || 'N/A',
      task.schedule?.category || 'N/A',
      task.schedule?.frequency || 'N/A',
      task.status,
      task.assignedTo?.name || 'Unassigned',
      new Date(task.dueDate).toLocaleDateString(),
      task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Pending'
    ])

    autoTable(doc, {
      startY: 45,
      head: [['Task', 'Category', 'Frequency', 'Status', 'Assigned To', 'Due Date', 'Completed']],
      body: ppmData,
      theme: 'grid',
      styles: { fontSize: 8 }
    })
  }

  // Certificates Section
  if (certificates.length > 0) {
    doc.addPage()
    doc.setFontSize(14)
    doc.text('Safety & Training Certificates', 20, 30)

    const certData = certificates.map((cert: any) => [
      cert.title,
      cert.category,
      cert.user?.name || 'Unknown',
      cert.user?.role || 'Unknown',
      cert.completionDate ? new Date(cert.completionDate).toLocaleDateString() : 'N/A',
      cert.score ? `${cert.score}%` : 'N/A'
    ])

    autoTable(doc, {
      startY: 45,
      head: [['Certificate', 'Category', 'Employee', 'Role', 'Completion Date', 'Score']],
      body: certData,
      theme: 'grid',
      styles: { fontSize: 8 }
    })
  }

  // SLA Compliance Section
  if (slaMetrics) {
    doc.addPage()
    doc.setFontSize(14)
    doc.text('SLA Compliance Report', 20, 30)

    const slaData = [
      ['Total Work Orders', slaMetrics.total.toString()],
      ['On-Time Response', `${slaMetrics.onTimeResponse} (${slaMetrics.responseCompliance}%)`],
      ['On-Time Resolution', `${slaMetrics.onTimeResolution} (${slaMetrics.resolutionCompliance}%)`],
      ['Overdue Items', slaMetrics.overdueCount.toString()]
    ]

    autoTable(doc, {
      startY: 45,
      head: [['Metric', 'Value']],
      body: slaData,
      theme: 'grid'
    })
  }

  // Add footer to all pages
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(`Page ${i} of ${pageCount}`, 20, doc.internal.pageSize.height - 10)
    doc.text(`Generated by OneApp Facilities Management`, doc.internal.pageSize.width - 100, doc.internal.pageSize.height - 10)
  }

  return Buffer.from(doc.output('arraybuffer'))
}

async function generateExcelAuditPack(auditData: any): Promise<Buffer> {
  const { hotel, period, workOrders, ppmTasks, certificates, incidents, slaMetrics } = auditData

  // Create workbook
  const wb = XLSX.utils.book_new()

  // Summary Sheet
  const summaryData = [
    ['Compliance Audit Pack'],
    [`${hotel.name}`],
    [`Period: ${period.start.toLocaleDateString()} - ${period.end.toLocaleDateString()}`],
    [`Generated: ${new Date().toLocaleDateString()}`],
    [''],
    ['Metric', 'Value'],
    ['Work Orders Completed', workOrders.filter((wo: any) => wo.status === 'COMPLETED').length],
    ['PPM Tasks Completed', ppmTasks.filter((task: any) => task.status === 'COMPLETED').length],
    ['Safety Certificates', certificates.length],
    ['Critical Incidents', incidents.length],
    ['SLA Response Compliance', slaMetrics ? `${slaMetrics.responseCompliance}%` : 'N/A'],
    ['SLA Resolution Compliance', slaMetrics ? `${slaMetrics.resolutionCompliance}%` : 'N/A']
  ]

  const summaryWS = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary')

  // Work Orders Sheet
  if (workOrders.length > 0) {
    const woHeaders = ['ID', 'Title', 'Category', 'Priority', 'Status', 'Created By', 'Assigned To', 'Created Date', 'Completed Date', 'Signatures']
    const woData = workOrders.map((wo: any) => [
      wo.id,
      wo.title,
      wo.category,
      wo.priority,
      wo.status,
      wo.createdBy?.name || 'Unknown',
      wo.assignedTo?.name || 'Unassigned',
      new Date(wo.createdAt).toLocaleDateString(),
      wo.actualCompletion ? new Date(wo.actualCompletion).toLocaleDateString() : '',
      wo.signatures.length
    ])

    const woWS = XLSX.utils.aoa_to_sheet([woHeaders, ...woData])
    XLSX.utils.book_append_sheet(wb, woWS, 'Work Orders')
  }

  // PPM Tasks Sheet
  if (ppmTasks.length > 0) {
    const ppmHeaders = ['Task ID', 'Title', 'Category', 'Frequency', 'Status', 'Assigned To', 'Due Date', 'Completed Date']
    const ppmData = ppmTasks.map((task: any) => [
      task.id,
      task.schedule?.title || 'N/A',
      task.schedule?.category || 'N/A',
      task.schedule?.frequency || 'N/A',
      task.status,
      task.assignedTo?.name || 'Unassigned',
      new Date(task.dueDate).toLocaleDateString(),
      task.completedAt ? new Date(task.completedAt).toLocaleDateString() : ''
    ])

    const ppmWS = XLSX.utils.aoa_to_sheet([ppmHeaders, ...ppmData])
    XLSX.utils.book_append_sheet(wb, ppmWS, 'PPM Tasks')
  }

  // Certificates Sheet
  if (certificates.length > 0) {
    const certHeaders = ['Certificate ID', 'Title', 'Category', 'Employee', 'Role', 'Completion Date', 'Score']
    const certData = certificates.map((cert: any) => [
      cert.id,
      cert.title,
      cert.category,
      cert.user?.name || 'Unknown',
      cert.user?.role || 'Unknown',
      cert.completionDate ? new Date(cert.completionDate).toLocaleDateString() : '',
      cert.score || ''
    ])

    const certWS = XLSX.utils.aoa_to_sheet([certHeaders, ...certData])
    XLSX.utils.book_append_sheet(wb, certWS, 'Certificates')
  }

  // SLA Metrics Sheet
  if (slaMetrics) {
    const slaData = [
      ['SLA Compliance Report'],
      [''],
      ['Metric', 'Value'],
      ['Total Work Orders', slaMetrics.total],
      ['On-Time Response Count', slaMetrics.onTimeResponse],
      ['On-Time Response Rate', `${slaMetrics.responseCompliance}%`],
      ['On-Time Resolution Count', slaMetrics.onTimeResolution],
      ['On-Time Resolution Rate', `${slaMetrics.resolutionCompliance}%`],
      ['Overdue Items', slaMetrics.overdueCount]
    ]

    const slaWS = XLSX.utils.aoa_to_sheet(slaData)
    XLSX.utils.book_append_sheet(wb, slaWS, 'SLA Metrics')
  }

  // Generate buffer
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
}