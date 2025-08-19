// Mock database service to replace Prisma
import { 
  mockDb,
  MockUser, 
  MockHotel, 
  MockLocation, 
  MockAsset, 
  MockWorkOrder, 
  MockWorkOrderStatusHistory,
  MockPPMSchedule,
  MockPPMTask,
  MockAssignmentRule,
  MockWorkOrderSLA,
  MockDigitalSignature,
  MockTrainingRecord,
  UserRole,
  Priority,
  WorkOrderStatus,
  PPMStatus,
  AssetStatus
} from './mock-data'

// Mock database operations that mimic Prisma API
export class MockDatabase {
  
  // User operations
  user = {
    findUnique: async (params: { where: { id?: string; email?: string }; include?: any }) => {
      const user = mockDb.users.find(u => 
        (params.where.id && u.id === params.where.id) ||
        (params.where.email && u.email === params.where.email)
      )
      
      if (!user) return null
      
      const result = { ...user }
      
      if (params.include?.hotel && user.hotelId) {
        result.hotel = mockDb.hotels.find(h => h.id === user.hotelId)
      }
      
      return result
    },

    findMany: async (params?: { 
      where?: { 
        hotelId?: string; 
        role?: { in: UserRole[] }; 
        isActive?: boolean;
        email?: { not: null };
      }; 
      select?: any;
      orderBy?: any;
    }) => {
      let users = [...mockDb.users]
      
      if (params?.where) {
        if (params.where.hotelId) {
          users = users.filter(u => u.hotelId === params.where.hotelId)
        }
        if (params.where.role?.in) {
          users = users.filter(u => params.where.role.in.includes(u.role))
        }
        if (params.where.isActive !== undefined) {
          users = users.filter(u => u.isActive === params.where.isActive)
        }
        if (params.where.email?.not === null) {
          users = users.filter(u => u.email != null)
        }
      }
      
      if (params?.select) {
        return users.map(user => {
          const selected: any = {}
          Object.keys(params.select).forEach(key => {
            if (params.select[key] && user[key as keyof MockUser] !== undefined) {
              selected[key] = user[key as keyof MockUser]
            }
          })
          return selected
        })
      }
      
      return users
    },

    create: async (params: { data: Partial<MockUser> }) => {
      const newUser: MockUser = {
        id: mockDb.generateId('user'),
        email: params.data.email!,
        name: params.data.name || '',
        password: params.data.password!,
        role: params.data.role || 'STAFF',
        phone: params.data.phone,
        avatar: params.data.avatar,
        isActive: params.data.isActive ?? true,
        createdAt: mockDb.now(),
        updatedAt: mockDb.now(),
        hotelId: params.data.hotelId
      }
      
      mockDb.users.push(newUser)
      return newUser
    },

    update: async (params: { where: { id: string }; data: Partial<MockUser> }) => {
      const userIndex = mockDb.users.findIndex(u => u.id === params.where.id)
      if (userIndex === -1) throw new Error('User not found')
      
      mockDb.users[userIndex] = {
        ...mockDb.users[userIndex],
        ...params.data,
        updatedAt: mockDb.now()
      }
      
      return mockDb.users[userIndex]
    },

    delete: async (params: { where: { id: string } }) => {
      const userIndex = mockDb.users.findIndex(u => u.id === params.where.id)
      if (userIndex === -1) throw new Error('User not found')
      
      const deletedUser = mockDb.users[userIndex]
      mockDb.users.splice(userIndex, 1)
      return deletedUser
    }
  }

  // Hotel operations
  hotel = {
    findUnique: async (params: { where: { id: string }; include?: any }) => {
      return mockDb.hotels.find(h => h.id === params.where.id) || null
    },

    findMany: async (params?: { where?: any; orderBy?: any }) => {
      return [...mockDb.hotels]
    }
  }

  // Location operations
  location = {
    findMany: async (params?: { where?: { hotelId?: string }; orderBy?: any }) => {
      let locations = [...mockDb.locations]
      
      if (params?.where?.hotelId) {
        locations = locations.filter(l => l.hotelId === params.where.hotelId)
      }
      
      return locations
    },

    create: async (params: { data: Partial<MockLocation> }) => {
      const newLocation: MockLocation = {
        id: mockDb.generateId('loc'),
        name: params.data.name!,
        type: params.data.type!,
        parentId: params.data.parentId,
        hotelId: params.data.hotelId!,
        qrCode: params.data.qrCode,
        isActive: params.data.isActive ?? true,
        createdAt: mockDb.now(),
        updatedAt: mockDb.now()
      }
      
      mockDb.locations.push(newLocation)
      return newLocation
    }
  }

  // Asset operations
  asset = {
    findMany: async (params?: { 
      where?: { 
        hotelId?: string;
        qrCode?: string;
      }; 
      include?: any;
      orderBy?: any;
    }) => {
      let assets = [...mockDb.assets]
      
      if (params?.where) {
        if (params.where.hotelId) {
          assets = assets.filter(a => a.hotelId === params.where.hotelId)
        }
        if (params.where.qrCode) {
          assets = assets.filter(a => a.qrCode === params.where.qrCode)
        }
      }
      
      return assets.map(asset => {
        const result = { ...asset }
        if (params?.include?.location) {
          result.location = mockDb.locations.find(l => l.id === asset.locationId)
        }
        return result
      })
    },

    findUnique: async (params: { where: { id: string }; include?: any }) => {
      const asset = mockDb.assets.find(a => a.id === params.where.id)
      if (!asset) return null
      
      const result = { ...asset }
      if (params.include?.location) {
        result.location = mockDb.locations.find(l => l.id === asset.locationId)
      }
      
      return result
    },

    create: async (params: { data: Partial<MockAsset> }) => {
      const newAsset: MockAsset = {
        id: mockDb.generateId('asset'),
        name: params.data.name!,
        type: params.data.type!,
        model: params.data.model,
        serialNumber: params.data.serialNumber,
        installDate: params.data.installDate,
        warrantyExpiry: params.data.warrantyExpiry,
        status: params.data.status || 'OPERATIONAL',
        locationId: params.data.locationId!,
        hotelId: params.data.hotelId!,
        qrCode: params.data.qrCode!,
        isActive: params.data.isActive ?? true,
        createdAt: mockDb.now(),
        updatedAt: mockDb.now()
      }
      
      mockDb.assets.push(newAsset)
      return newAsset
    }
  }

  // Work Order operations
  workOrder = {
    findMany: async (params?: { 
      where?: { 
        hotelId?: string;
        createdById?: string;
        assignedToId?: string;
        status?: WorkOrderStatus;
        priority?: Priority;
        createdAt?: { gte?: Date; lte?: Date };
        category?: { in?: string[] };
        isActive?: boolean;
      }; 
      include?: any;
      orderBy?: any;
      take?: number;
    }) => {
      let workOrders = [...mockDb.workOrders]
      
      if (params?.where) {
        if (params.where.hotelId) {
          workOrders = workOrders.filter(wo => wo.hotelId === params.where.hotelId)
        }
        if (params.where.createdById) {
          workOrders = workOrders.filter(wo => wo.createdById === params.where.createdById)
        }
        if (params.where.assignedToId) {
          workOrders = workOrders.filter(wo => wo.assignedToId === params.where.assignedToId)
        }
        if (params.where.status) {
          workOrders = workOrders.filter(wo => wo.status === params.where.status)
        }
        if (params.where.priority) {
          workOrders = workOrders.filter(wo => wo.priority === params.where.priority)
        }
        if (params.where.category?.in) {
          workOrders = workOrders.filter(wo => params.where.category.in.includes(wo.category))
        }
        if (params.where.isActive !== undefined) {
          workOrders = workOrders.filter(wo => wo.isActive === params.where.isActive)
        }
        if (params.where.createdAt?.gte || params.where.createdAt?.lte) {
          workOrders = workOrders.filter(wo => {
            const createdAt = wo.createdAt
            if (params.where.createdAt?.gte && createdAt < params.where.createdAt.gte) return false
            if (params.where.createdAt?.lte && createdAt > params.where.createdAt.lte) return false
            return true
          })
        }
      }
      
      if (params?.orderBy?.createdAt === 'desc') {
        workOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      }
      
      if (params?.take) {
        workOrders = workOrders.slice(0, params.take)
      }
      
      return workOrders.map(wo => {
        const result = { ...wo }
        if (params?.include) {
          if (params.include.createdBy) {
            result.createdBy = mockDb.users.find(u => u.id === wo.createdById)
          }
          if (params.include.assignedTo) {
            result.assignedTo = mockDb.users.find(u => u.id === wo.assignedToId)
          }
          if (params.include.location) {
            result.location = mockDb.locations.find(l => l.id === wo.locationId)
          }
          if (params.include.asset) {
            result.asset = mockDb.assets.find(a => a.id === wo.assetId)
          }
          if (params.include.statusHistory) {
            result.statusHistory = mockDb.workOrderStatusHistory
              .filter(sh => sh.workOrderId === wo.id)
              .map(sh => ({
                ...sh,
                user: mockDb.users.find(u => u.id === sh.userId)
              }))
              .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          }
          if (params.include.signatures) {
            result.signatures = mockDb.digitalSignatures.filter(sig => sig.workOrderId === wo.id)
          }
          if (params.include.sla) {
            result.sla = mockDb.workOrderSLAs.find(sla => sla.workOrderId === wo.id)
          }
        }
        return result
      })
    },

    findUnique: async (params: { where: { id: string }; include?: any }) => {
      const workOrder = mockDb.workOrders.find(wo => wo.id === params.where.id)
      if (!workOrder) return null
      
      const result = { ...workOrder }
      if (params.include) {
        if (params.include.createdBy) {
          result.createdBy = mockDb.users.find(u => u.id === workOrder.createdById)
        }
        if (params.include.assignedTo) {
          result.assignedTo = mockDb.users.find(u => u.id === workOrder.assignedToId)
        }
        if (params.include.location) {
          result.location = mockDb.locations.find(l => l.id === workOrder.locationId)
        }
        if (params.include.asset) {
          result.asset = mockDb.assets.find(a => a.id === workOrder.assetId)
        }
        if (params.include.statusHistory) {
          result.statusHistory = mockDb.workOrderStatusHistory
            .filter(sh => sh.workOrderId === workOrder.id)
            .map(sh => ({
              ...sh,
              user: mockDb.users.find(u => u.id === sh.userId)
            }))
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        }
        if (params.include.signatures) {
          result.signatures = mockDb.digitalSignatures.filter(sig => sig.workOrderId === workOrder.id)
        }
        if (params.include.sla) {
          result.sla = mockDb.workOrderSLAs.find(sla => sla.workOrderId === workOrder.id)
        }
      }
      
      return result
    },

    create: async (params: { data: Partial<MockWorkOrder> }) => {
      const newWorkOrder: MockWorkOrder = {
        id: mockDb.generateId('wo'),
        title: params.data.title!,
        description: params.data.description,
        category: params.data.category!,
        priority: params.data.priority || 'MEDIUM',
        status: params.data.status || 'LOGGED',
        locationId: params.data.locationId!,
        assetId: params.data.assetId,
        hotelId: params.data.hotelId!,
        createdById: params.data.createdById!,
        assignedToId: params.data.assignedToId,
        dueDate: params.data.dueDate,
        estimatedCost: params.data.estimatedCost,
        actualCost: params.data.actualCost,
        timeSpent: params.data.timeSpent,
        completedAt: params.data.completedAt,
        isActive: params.data.isActive ?? true,
        createdAt: mockDb.now(),
        updatedAt: mockDb.now()
      }
      
      mockDb.workOrders.push(newWorkOrder)
      
      // Create initial status history
      mockDb.workOrderStatusHistory.push({
        id: mockDb.generateId('wosh'),
        workOrderId: newWorkOrder.id,
        status: newWorkOrder.status,
        notes: 'Work order created',
        userId: newWorkOrder.createdById,
        createdAt: mockDb.now()
      })
      
      return newWorkOrder
    },

    update: async (params: { where: { id: string }; data: Partial<MockWorkOrder> }) => {
      const workOrderIndex = mockDb.workOrders.findIndex(wo => wo.id === params.where.id)
      if (workOrderIndex === -1) throw new Error('Work order not found')
      
      const oldWorkOrder = mockDb.workOrders[workOrderIndex]
      
      mockDb.workOrders[workOrderIndex] = {
        ...oldWorkOrder,
        ...params.data,
        updatedAt: mockDb.now()
      }
      
      // If status changed, add to status history
      if (params.data.status && params.data.status !== oldWorkOrder.status) {
        mockDb.workOrderStatusHistory.push({
          id: mockDb.generateId('wosh'),
          workOrderId: oldWorkOrder.id,
          status: params.data.status,
          notes: `Status updated to ${params.data.status}`,
          userId: params.data.assignedToId || oldWorkOrder.createdById,
          createdAt: mockDb.now()
        })
      }
      
      return mockDb.workOrders[workOrderIndex]
    }
  }

  // PPM Schedule operations
  pPMSchedule = {
    findMany: async (params?: { where?: { hotelId?: string }; orderBy?: any }) => {
      let schedules = [...mockDb.ppmSchedules]
      
      if (params?.where?.hotelId) {
        schedules = schedules.filter(s => s.hotelId === params.where.hotelId)
      }
      
      return schedules
    }
  }

  // PPM Task operations
  pPMTask = {
    findMany: async (params?: { 
      where?: { 
        schedule?: { hotelId?: string; category?: { in?: string[] } };
        dueDate?: { gte?: Date; lte?: Date };
      }; 
      include?: any;
      orderBy?: any;
    }) => {
      let tasks = [...mockDb.ppmTasks]
      
      if (params?.where) {
        if (params.where.schedule?.hotelId) {
          const hotelSchedules = mockDb.ppmSchedules
            .filter(s => s.hotelId === params.where.schedule.hotelId)
            .map(s => s.id)
          tasks = tasks.filter(t => hotelSchedules.includes(t.scheduleId))
        }
        if (params.where.dueDate?.gte || params.where.dueDate?.lte) {
          tasks = tasks.filter(t => {
            const dueDate = t.dueDate
            if (params.where.dueDate?.gte && dueDate < params.where.dueDate.gte) return false
            if (params.where.dueDate?.lte && dueDate > params.where.dueDate.lte) return false
            return true
          })
        }
      }
      
      return tasks.map(task => {
        const result = { ...task }
        if (params?.include) {
          if (params.include.schedule) {
            result.schedule = mockDb.ppmSchedules.find(s => s.id === task.scheduleId)
          }
          if (params.include.assignedTo) {
            result.assignedTo = mockDb.users.find(u => u.id === task.assignedToId)
          }
          if (params.include.completedBy && task.status === 'COMPLETED') {
            result.completedBy = mockDb.users.find(u => u.id === task.assignedToId)
          }
        }
        return result
      })
    }
  }

  // Assignment Rule operations
  assignmentRule = {
    findMany: async (params?: { where?: { hotelId?: string; isActive?: boolean } }) => {
      let rules = [...mockDb.assignmentRules]
      
      if (params?.where) {
        if (params.where.hotelId) {
          rules = rules.filter(r => r.hotelId === params.where.hotelId)
        }
        if (params.where.isActive !== undefined) {
          rules = rules.filter(r => r.isActive === params.where.isActive)
        }
      }
      
      return rules.map(rule => ({
        ...rule,
        assignee: mockDb.users.find(u => u.id === rule.assigneeId),
        location: rule.locationId ? mockDb.locations.find(l => l.id === rule.locationId) : null
      }))
    },

    create: async (params: { data: Partial<MockAssignmentRule> }) => {
      const newRule: MockAssignmentRule = {
        id: mockDb.generateId('rule'),
        name: params.data.name!,
        description: params.data.description,
        hotelId: params.data.hotelId!,
        category: params.data.category!,
        priority: params.data.priority,
        locationId: params.data.locationId,
        assigneeId: params.data.assigneeId!,
        isActive: params.data.isActive ?? true,
        createdAt: mockDb.now(),
        updatedAt: mockDb.now()
      }
      
      mockDb.assignmentRules.push(newRule)
      return newRule
    },

    update: async (params: { where: { id: string }; data: Partial<MockAssignmentRule> }) => {
      const ruleIndex = mockDb.assignmentRules.findIndex(r => r.id === params.where.id)
      if (ruleIndex === -1) throw new Error('Assignment rule not found')
      
      mockDb.assignmentRules[ruleIndex] = {
        ...mockDb.assignmentRules[ruleIndex],
        ...params.data,
        updatedAt: mockDb.now()
      }
      
      return mockDb.assignmentRules[ruleIndex]
    },

    delete: async (params: { where: { id: string } }) => {
      const ruleIndex = mockDb.assignmentRules.findIndex(r => r.id === params.where.id)
      if (ruleIndex === -1) throw new Error('Assignment rule not found')
      
      const deletedRule = mockDb.assignmentRules[ruleIndex]
      mockDb.assignmentRules.splice(ruleIndex, 1)
      return deletedRule
    }
  }

  // Work Order SLA operations
  workOrderSLA = {
    findMany: async (params?: { 
      where?: { 
        workOrder?: { 
          hotelId?: string; 
          createdAt?: { gte?: Date; lte?: Date } 
        } 
      } 
    }) => {
      let slas = [...mockDb.workOrderSLAs]
      
      if (params?.where?.workOrder) {
        const workOrderIds = mockDb.workOrders
          .filter(wo => {
            if (params.where.workOrder.hotelId && wo.hotelId !== params.where.workOrder.hotelId) return false
            if (params.where.workOrder.createdAt?.gte && wo.createdAt < params.where.workOrder.createdAt.gte) return false
            if (params.where.workOrder.createdAt?.lte && wo.createdAt > params.where.workOrder.createdAt.lte) return false
            return true
          })
          .map(wo => wo.id)
          
        slas = slas.filter(sla => workOrderIds.includes(sla.workOrderId))
      }
      
      return slas
    },

    create: async (params: { data: Partial<MockWorkOrderSLA> }) => {
      const newSLA: MockWorkOrderSLA = {
        id: mockDb.generateId('sla'),
        workOrderId: params.data.workOrderId!,
        category: params.data.category!,
        priority: params.data.priority!,
        expectedResponseTime: params.data.expectedResponseTime!,
        expectedResolutionTime: params.data.expectedResolutionTime!,
        actualResponseTime: params.data.actualResponseTime,
        actualResolutionTime: params.data.actualResolutionTime,
        assignedAt: params.data.assignedAt,
        firstResponseAt: params.data.firstResponseAt,
        resolvedAt: params.data.resolvedAt,
        isOverdue: params.data.isOverdue ?? false,
        createdAt: mockDb.now(),
        updatedAt: mockDb.now()
      }
      
      mockDb.workOrderSLAs.push(newSLA)
      return newSLA
    }
  }

  // Digital Signature operations
  digitalSignature = {
    create: async (params: { data: Partial<MockDigitalSignature> }) => {
      const newSignature: MockDigitalSignature = {
        id: mockDb.generateId('sig'),
        workOrderId: params.data.workOrderId!,
        signatureType: params.data.signatureType!,
        signatureData: params.data.signatureData!,
        signerName: params.data.signerName!,
        signerTitle: params.data.signerTitle!,
        signerUserId: params.data.signerUserId!,
        notes: params.data.notes,
        ipAddress: params.data.ipAddress,
        userAgent: params.data.userAgent,
        createdAt: mockDb.now()
      }
      
      mockDb.digitalSignatures.push(newSignature)
      return newSignature
    }
  }

  // Training Record operations
  trainingRecord = {
    findMany: async (params?: { 
      where?: { 
        user?: { hotelId?: string };
        completionDate?: { gte?: Date; lte?: Date };
        category?: { in?: string[] };
      }; 
      include?: any;
      orderBy?: any;
    }) => {
      let records = [...mockDb.trainingRecords]
      
      if (params?.where) {
        if (params.where.user?.hotelId) {
          const hotelUserIds = mockDb.users
            .filter(u => u.hotelId === params.where.user.hotelId)
            .map(u => u.id)
          records = records.filter(r => hotelUserIds.includes(r.userId))
        }
        if (params.where.completionDate?.gte || params.where.completionDate?.lte) {
          records = records.filter(r => {
            const completionDate = r.completionDate
            if (params.where.completionDate?.gte && completionDate < params.where.completionDate.gte) return false
            if (params.where.completionDate?.lte && completionDate > params.where.completionDate.lte) return false
            return true
          })
        }
        if (params.where.category?.in) {
          records = records.filter(r => params.where.category.in.includes(r.category))
        }
      }
      
      return records.map(record => {
        const result = { ...record }
        if (params?.include?.user) {
          result.user = mockDb.users.find(u => u.id === record.userId)
        }
        return result
      })
    }
  }
}

// Export singleton instance
export const db = new MockDatabase()