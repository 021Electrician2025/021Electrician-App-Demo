import { db } from '@/lib/db'
import { Priority } from '@/lib/mock-data'

interface WorkOrderData {
  category: string
  priority: Priority
  locationId?: string
  hotelId: string
}

interface AssignmentResult {
  assigneeId: string | null
  ruleName?: string
  reason: string
}

export class AssignmentEngine {
  /**
   * Find the best assignee for a work order based on assignment rules
   */
  static async findAssignee(workOrderData: WorkOrderData): Promise<AssignmentResult> {
    try {
      // Get all active assignment rules for the hotel, ordered by specificity
      const rules = await db.assignmentRule.findMany({
        where: {
          hotelId: workOrderData.hotelId,
          isActive: true
        },
      })

      if (rules.length === 0) {
        return {
          assigneeId: null,
          reason: 'No assignment rules configured for this hotel'
        }
      }

      // Try to find a matching rule in order of specificity
      const matchingRule = this.findBestMatchingRule(rules, workOrderData)

      if (!matchingRule) {
        return {
          assigneeId: null,
          reason: 'No matching assignment rule found'
        }
      }

      // Verify assignee is still active
      if (!matchingRule.assignee?.isActive) {
        return {
          assigneeId: null,
          reason: `Assigned user is inactive`
        }
      }

      return {
        assigneeId: matchingRule.assigneeId,
        ruleName: matchingRule.name,
        reason: `Assigned via rule: ${matchingRule.name}`
      }
    } catch (error) {
      console.error('Assignment engine error:', error)
      return {
        assigneeId: null,
        reason: 'Assignment engine error'
      }
    }
  }

  /**
   * Find the best matching rule based on specificity
   * Priority order:
   * 1. Exact match (category, priority, location)
   * 2. Category + priority match (any location)
   * 3. Category + location match (any priority)
   * 4. Category only match
   */
  private static findBestMatchingRule(rules: any[], workOrderData: WorkOrderData): any | null {
    const { category, priority, locationId } = workOrderData

    // 1. Try exact match (category + priority + location)
    let matchingRule = rules.find(rule =>
      rule.category.toLowerCase() === category.toLowerCase() &&
      rule.priority === priority &&
      rule.locationId === locationId
    )

    if (matchingRule) return matchingRule

    // 2. Try category + priority match (any location)
    matchingRule = rules.find(rule =>
      rule.category.toLowerCase() === category.toLowerCase() &&
      rule.priority === priority &&
      !rule.locationId
    )

    if (matchingRule) return matchingRule

    // 3. Try category + location match (any priority)
    if (locationId) {
      matchingRule = rules.find(rule =>
        rule.category.toLowerCase() === category.toLowerCase() &&
        !rule.priority &&
        rule.locationId === locationId
      )

      if (matchingRule) return matchingRule
    }

    // 4. Try category only match
    matchingRule = rules.find(rule =>
      rule.category.toLowerCase() === category.toLowerCase() &&
      !rule.priority &&
      !rule.locationId
    )

    return matchingRule || null
  }

  /**
   * Create SLA record for a work order based on category and priority
   */
  static async createSLA(workOrderId: string, category: string, priority: Priority): Promise<void> {
    try {
      // Note: SLA policies are simplified in mock database - using defaults

      let expectedResponseTime = 240 // 4 hours default
      let expectedResolutionTime = 1440 // 24 hours default

      // Default SLA times based on priority
      switch (priority) {
        case 'CRITICAL':
          expectedResponseTime = 60 // 1 hour
          expectedResolutionTime = 480 // 8 hours
          break
        case 'HIGH':
          expectedResponseTime = 120 // 2 hours
          expectedResolutionTime = 720 // 12 hours
          break
        case 'MEDIUM':
          expectedResponseTime = 240 // 4 hours
          expectedResolutionTime = 1440 // 24 hours
          break
        case 'LOW':
          expectedResponseTime = 480 // 8 hours
          expectedResolutionTime = 2880 // 48 hours
          break
      }

      await db.workOrderSLA.create({
        data: {
          workOrderId,
          category,
          priority,
          expectedResponseTime,
          expectedResolutionTime
        }
      })
    } catch (error) {
      console.error('Failed to create SLA record:', error)
    }
  }

  /**
   * Update SLA when work order is assigned
   */
  static async updateSLAOnAssignment(workOrderId: string): Promise<void> {
    try {
      // Note: SLA updates are simplified for demo - would normally update the SLA record
      console.log(`SLA updated for work order ${workOrderId} - assigned at ${new Date()}`)
    } catch (error) {
      console.error('Failed to update SLA on assignment:', error)
    }
  }

  /**
   * Update SLA when work order gets first response
   */
  static async updateSLAOnFirstResponse(workOrderId: string): Promise<void> {
    try {
      // Note: SLA updates are simplified for demo
      console.log(`SLA first response updated for work order ${workOrderId}`)
    } catch (error) {
      console.error('Failed to update SLA on first response:', error)
    }
  }

  /**
   * Update SLA when work order is resolved
   */
  static async updateSLAOnResolution(workOrderId: string): Promise<void> {
    try {
      // Note: SLA updates are simplified for demo
      console.log(`SLA resolution updated for work order ${workOrderId}`)
    } catch (error) {
      console.error('Failed to update SLA on resolution:', error)
    }
  }
}