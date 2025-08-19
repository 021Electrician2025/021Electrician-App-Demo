import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Note: This is a simplified export implementation
// In a real application, you would use libraries like:
// - PDF: pdfkit, puppeteer, or jsPDF
// - Excel: exceljs or xlsx

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'pdf'
    const dateRange = searchParams.get('dateRange') || 'last30days'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const status = searchParams.get('status')

    // Calculate date range
    let start = new Date()
    let end = new Date()

    switch (dateRange) {
      case 'last7days':
        start.setDate(start.getDate() - 7)
        break
      case 'last30days':
        start.setDate(start.getDate() - 30)
        break
      case 'last90days':
        start.setDate(start.getDate() - 90)
        break
      case 'thisyear':
        start = new Date(start.getFullYear(), 0, 1)
        break
      case 'custom':
        if (startDate) start = new Date(startDate)
        if (endDate) end = new Date(endDate)
        break
    }

    // Build where clause
    const where: any = {
      createdAt: {
        gte: start,
        lte: end
      }
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' }
    }

    if (location) {
      where.location = {
        name: { contains: location, mode: 'insensitive' }
      }
    }

    if (status) {
      where.status = status
    }

    // Fetch work orders with filters
    const workOrders = await db.workOrder.findMany({
      where,
      include: {
        location: true,
        reportedBy: true,
        assignedTo: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Generate report content based on format
    if (format === 'pdf') {
      // For PDF export, we'll create a simple HTML representation
      // In a real app, you would use a PDF generation library
      const htmlContent = generateHTMLReport(workOrders, start, end)
      
      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="facilities-report-${new Date().toISOString().split('T')[0]}.html"`
        }
      })
    } else if (format === 'excel') {
      // For Excel export, we'll create a CSV representation
      // In a real app, you would use an Excel generation library
      const csvContent = generateCSVReport(workOrders)
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="facilities-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid format' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateHTMLReport(workOrders: any[], startDate: Date, endDate: Date): string {
  const totalWorkOrders = workOrders.length
  const completedWorkOrders = workOrders.filter(wo => wo.status === 'COMPLETED').length
  const pendingWorkOrders = workOrders.filter(wo => wo.status === 'OPEN' || wo.status === 'IN_PROGRESS').length

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Facilities Management Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: flex; justify-content: space-around; margin: 20px 0; }
        .summary-card { text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .summary-card h3 { margin: 0 0 10px 0; }
        .summary-card .number { font-size: 24px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .status-completed { color: green; }
        .status-pending { color: orange; }
        .status-open { color: red; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Facilities Management Report</h1>
        <p>Report Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>Total Work Orders</h3>
            <div class="number">${totalWorkOrders}</div>
        </div>
        <div class="summary-card">
            <h3>Completed</h3>
            <div class="number status-completed">${completedWorkOrders}</div>
        </div>
        <div class="summary-card">
            <h3>Pending</h3>
            <div class="number status-pending">${pendingWorkOrders}</div>
        </div>
    </div>

    <h2>Work Orders Details</h2>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Category</th>
                <th>Location</th>
                <th>Created Date</th>
                <th>Assigned To</th>
            </tr>
        </thead>
        <tbody>
            ${workOrders.map(wo => `
                <tr>
                    <td>${wo.id}</td>
                    <td>${wo.title}</td>
                    <td class="status-${wo.status.toLowerCase()}">${wo.status}</td>
                    <td>${wo.priority}</td>
                    <td>${wo.category}</td>
                    <td>${wo.location?.name || 'N/A'}</td>
                    <td>${new Date(wo.createdAt).toLocaleDateString()}</td>
                    <td>${wo.assignedTo?.name || 'Unassigned'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>
  `
}

function generateCSVReport(workOrders: any[]): string {
  const headers = [
    'ID',
    'Title',
    'Status',
    'Priority',
    'Category',
    'Location',
    'Created Date',
    'Assigned To',
    'Reported By',
    'Description'
  ]

  const rows = workOrders.map(wo => [
    wo.id,
    `"${wo.title}"`,
    wo.status,
    wo.priority,
    wo.category,
    wo.location?.name || 'N/A',
    new Date(wo.createdAt).toLocaleDateString(),
    wo.assignedTo?.name || 'Unassigned',
    wo.reportedBy?.name || 'N/A',
    `"${wo.description.replace(/"/g, '""')}"`
  ])

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
}