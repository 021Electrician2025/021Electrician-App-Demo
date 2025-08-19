import nodemailer from 'nodemailer'
import { db as prisma } from '@/lib/db'

interface EmailOptions {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

interface WorkOrderEmailData {
  workOrder: any
  assignee?: any
  creator?: any
  hotel?: any
}

interface PPMReminderData {
  task: any
  assignee?: any
  hotel?: any
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null

  private static async getTransporter() {
    if (!this.transporter) {
      // For production, use environment variables for email configuration
      // For development, you might use a service like Mailtrap, Gmail, or similar
      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'localhost',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: process.env.EMAIL_USER && process.env.EMAIL_PASS ? {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        } : undefined,
        // For development without real SMTP, log emails to console
        ...(process.env.NODE_ENV === 'development' && !process.env.EMAIL_HOST && {
          streamTransport: true,
          newline: 'unix',
          buffer: true
        })
      })
    }
    return this.transporter
  }

  private static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const transporter = await this.getTransporter()
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@oneapp.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments
      }

      const info = await transporter.sendMail(mailOptions)
      
      // In development, log the email content
      if (process.env.NODE_ENV === 'development') {
        console.log('Email sent:', {
          to: options.to,
          subject: options.subject,
          messageId: info.messageId
        })
        
        // If using streamTransport, log the actual email content
        if (info.message) {
          console.log('Email content:', info.message.toString())
        }
      }

      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  // Work Order Assignment Notification
  static async sendWorkOrderAssignment(data: WorkOrderEmailData): Promise<boolean> {
    if (!data.assignee?.email) return false

    const html = this.generateWorkOrderAssignmentTemplate(data)
    
    return await this.sendEmail({
      to: data.assignee.email,
      subject: `New Work Order Assigned: ${data.workOrder.title}`,
      html
    })
  }

  // Work Order Status Update
  static async sendWorkOrderStatusUpdate(data: WorkOrderEmailData): Promise<boolean> {
    const recipients = []
    
    if (data.creator?.email) recipients.push(data.creator.email)
    if (data.assignee?.email && data.assignee.email !== data.creator?.email) {
      recipients.push(data.assignee.email)
    }

    if (recipients.length === 0) return false

    const html = this.generateWorkOrderStatusTemplate(data)
    
    for (const email of recipients) {
      await this.sendEmail({
        to: email,
        subject: `Work Order Update: ${data.workOrder.title}`,
        html
      })
    }

    return true
  }

  // Critical Work Order Alert
  static async sendCriticalWorkOrderAlert(data: WorkOrderEmailData): Promise<boolean> {
    // Get all managers and admins for the hotel
    const managers = await prisma.user.findMany({
      where: {
        hotelId: data.workOrder.hotelId,
        role: { in: ['MANAGER', 'ADMIN'] },
        isActive: true,
        email: { not: null }
      },
      select: { email: true, name: true }
    })

    if (managers.length === 0) return false

    const html = this.generateCriticalAlertTemplate(data)
    
    for (const manager of managers) {
      if (manager.email) {
        await this.sendEmail({
          to: manager.email,
          subject: `🚨 CRITICAL: ${data.workOrder.title}`,
          html
        })
      }
    }

    return true
  }

  // PPM Task Reminder
  static async sendPPMReminder(data: PPMReminderData): Promise<boolean> {
    if (!data.assignee?.email) return false

    const html = this.generatePPMReminderTemplate(data)
    
    return await this.sendEmail({
      to: data.assignee.email,
      subject: `PPM Task Due: ${data.task.title || 'Maintenance Task'}`,
      html
    })
  }

  // Overdue PPM Alert
  static async sendOverduePPMAlert(data: PPMReminderData): Promise<boolean> {
    // Get all managers for the hotel
    const managers = await prisma.user.findMany({
      where: {
        role: { in: ['MANAGER', 'ADMIN'] },
        isActive: true,
        email: { not: null }
      },
      select: { email: true, name: true }
    })

    if (managers.length === 0) return false

    const html = this.generateOverduePPMTemplate(data)
    
    for (const manager of managers) {
      if (manager.email) {
        await this.sendEmail({
          to: manager.email,
          subject: `⚠️ Overdue PPM Task: ${data.task.title || 'Maintenance Task'}`,
          html
        })
      }
    }

    return true
  }

  // Certificate Expiry Warning
  static async sendCertificateExpiryWarning(certificate: any, user: any): Promise<boolean> {
    if (!user.email) return false

    const html = this.generateCertificateExpiryTemplate(certificate, user)
    
    return await this.sendEmail({
      to: user.email,
      subject: `Certificate Expiring Soon: ${certificate.title}`,
      html
    })
  }

  // SLA Breach Alert
  static async sendSLABreachAlert(workOrder: any, sla: any): Promise<boolean> {
    // Get managers for escalation
    const managers = await prisma.user.findMany({
      where: {
        role: { in: ['MANAGER', 'ADMIN'] },
        isActive: true,
        email: { not: null }
      },
      select: { email: true, name: true }
    })

    if (managers.length === 0) return false

    const html = this.generateSLABreachTemplate(workOrder, sla)
    
    for (const manager of managers) {
      if (manager.email) {
        await this.sendEmail({
          to: manager.email,
          subject: `SLA BREACH: ${workOrder.title}`,
          html
        })
      }
    }

    return true
  }

  // Email Templates
  private static generateWorkOrderAssignmentTemplate(data: WorkOrderEmailData): string {
    const { workOrder, assignee, hotel } = data
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #2563eb; margin: 0;">New Work Order Assigned</h2>
          <p style="color: #64748b; margin: 5px 0 0;">OneApp Facilities Management</p>
        </div>
        
        <div style="background: white; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <p>Hi ${assignee?.name || 'there'},</p>
          
          <p>A new work order has been assigned to you:</p>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px; color: #1e293b;">${workOrder.title}</h3>
            <p style="margin: 0 0 10px;"><strong>Priority:</strong> <span style="color: ${workOrder.priority === 'CRITICAL' ? '#dc2626' : workOrder.priority === 'HIGH' ? '#ea580c' : '#16a34a'};">${workOrder.priority}</span></p>
            <p style="margin: 0 0 10px;"><strong>Category:</strong> ${workOrder.category}</p>
            <p style="margin: 0 0 10px;"><strong>Location:</strong> ${workOrder.location?.name || 'Not specified'}</p>
            <p style="margin: 0;"><strong>Description:</strong> ${workOrder.description}</p>
          </div>
          
          <p>Please review and begin work on this request as soon as possible.</p>
          
          <div style="margin: 20px 0;">
            <a href="${process.env.NEXTAUTH_URL}/mobile" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Work Order</a>
          </div>
          
          <p style="color: #64748b; font-size: 12px;">
            Best regards,<br>
            OneApp Facilities Management Team<br>
            ${hotel?.name || ''}
          </p>
        </div>
      </div>
    `
  }

  private static generateWorkOrderStatusTemplate(data: WorkOrderEmailData): string {
    const { workOrder } = data
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #2563eb; margin: 0;">Work Order Update</h2>
          <p style="color: #64748b; margin: 5px 0 0;">OneApp Facilities Management</p>
        </div>
        
        <div style="background: white; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <p>The status of work order "${workOrder.title}" has been updated.</p>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0 0 10px;"><strong>New Status:</strong> <span style="color: ${workOrder.status === 'COMPLETED' ? '#16a34a' : '#2563eb'};">${workOrder.status.replace('_', ' ')}</span></p>
            <p style="margin: 0;"><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <a href="${process.env.NEXTAUTH_URL}/manager/work-orders/${workOrder.id}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a>
          </div>
        </div>
      </div>
    `
  }

  private static generateCriticalAlertTemplate(data: WorkOrderEmailData): string {
    const { workOrder } = data
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; padding: 20px; border-radius: 8px; margin-bottom: 20px; color: white;">
          <h2 style="margin: 0;">🚨 CRITICAL WORK ORDER</h2>
          <p style="margin: 5px 0 0; opacity: 0.9;">Immediate attention required</p>
        </div>
        
        <div style="background: white; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <p><strong>A critical work order has been logged and requires immediate attention:</strong></p>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px; color: #dc2626;">${workOrder.title}</h3>
            <p style="margin: 0 0 10px;"><strong>Location:</strong> ${workOrder.location?.name || 'Not specified'}</p>
            <p style="margin: 0 0 10px;"><strong>Reported by:</strong> ${workOrder.createdBy?.name}</p>
            <p style="margin: 0;"><strong>Description:</strong> ${workOrder.description}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <a href="${process.env.NEXTAUTH_URL}/manager/work-orders/${workOrder.id}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View & Assign Immediately</a>
          </div>
        </div>
      </div>
    `
  }

  private static generatePPMReminderTemplate(data: PPMReminderData): string {
    const { task } = data
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #2563eb; margin: 0;">PPM Task Reminder</h2>
          <p style="color: #64748b; margin: 5px 0 0;">Preventive Maintenance Due</p>
        </div>
        
        <div style="background: white; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <p>You have a preventive maintenance task due:</p>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px; color: #92400e;">${task.title || 'Maintenance Task'}</h3>
            <p style="margin: 0 0 10px;"><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
            <p style="margin: 0;"><strong>Category:</strong> ${task.category || 'General'}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <a href="${process.env.NEXTAUTH_URL}/mobile" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Complete Task</a>
          </div>
        </div>
      </div>
    `
  }

  private static generateOverduePPMTemplate(data: PPMReminderData): string {
    const { task } = data
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ea580c; padding: 20px; border-radius: 8px; margin-bottom: 20px; color: white;">
          <h2 style="margin: 0;">⚠️ OVERDUE PPM TASK</h2>
          <p style="margin: 5px 0 0; opacity: 0.9;">Compliance at risk</p>
        </div>
        
        <div style="background: white; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <p><strong>A preventive maintenance task is overdue:</strong></p>
          
          <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px; color: #92400e;">${task.title || 'Maintenance Task'}</h3>
            <p style="margin: 0 0 10px;"><strong>Was Due:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
            <p style="margin: 0 0 10px;"><strong>Days Overdue:</strong> ${Math.ceil((Date.now() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24))}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <a href="${process.env.NEXTAUTH_URL}/manager/ppm-scheduler" style="background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Review & Assign</a>
          </div>
        </div>
      </div>
    `
  }

  private static generateCertificateExpiryTemplate(certificate: any, user: any): string {
    const daysUntilExpiry = Math.ceil((new Date(certificate.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #dc2626; margin: 0;">Certificate Expiring Soon</h2>
          <p style="color: #64748b; margin: 5px 0 0;">Renewal Required</p>
        </div>
        
        <div style="background: white; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <p>Hi ${user.name},</p>
          
          <p>Your certificate is expiring soon and needs to be renewed:</p>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px; color: #dc2626;">${certificate.title}</h3>
            <p style="margin: 0 0 10px;"><strong>Expires:</strong> ${new Date(certificate.expiryDate).toLocaleDateString()}</p>
            <p style="margin: 0;"><strong>Days Remaining:</strong> ${daysUntilExpiry}</p>
          </div>
          
          <p>Please arrange for renewal to maintain compliance.</p>
        </div>
      </div>
    `
  }

  private static generateSLABreachTemplate(workOrder: any, sla: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; padding: 20px; border-radius: 8px; margin-bottom: 20px; color: white;">
          <h2 style="margin: 0;">SLA BREACH ALERT</h2>
          <p style="margin: 5px 0 0; opacity: 0.9;">Service Level Agreement exceeded</p>
        </div>
        
        <div style="background: white; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <p><strong>A work order has breached its SLA targets:</strong></p>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px; color: #dc2626;">${workOrder.title}</h3>
            <p style="margin: 0 0 10px;"><strong>Expected Response:</strong> ${sla.expectedResponseTime} minutes</p>
            <p style="margin: 0 0 10px;"><strong>Actual Response:</strong> ${sla.actualResponseTime || 'Not responded'} minutes</p>
            <p style="margin: 0;"><strong>Status:</strong> ${workOrder.status}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <a href="${process.env.NEXTAUTH_URL}/manager/work-orders/${workOrder.id}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Escalate Now</a>
          </div>
        </div>
      </div>
    `
  }
}