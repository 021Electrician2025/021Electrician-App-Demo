// Mock data for working prototype - replaces database
import bcrypt from 'bcryptjs'

// Types and Enums matching Prisma schema
export type UserRole = 'STAFF' | 'TECHNICIAN' | 'MANAGER' | 'ADMIN'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type WorkOrderStatus = 'LOGGED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
export type PPMStatus = 'SCHEDULED' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED'
export type AssetStatus = 'OPERATIONAL' | 'NEEDS_MAINTENANCE' | 'UNDER_REPAIR' | 'RETIRED'

// Enum objects for Zod compatibility
export const UserRole = {
  STAFF: 'STAFF',
  TECHNICIAN: 'TECHNICIAN',
  MANAGER: 'MANAGER',
  ADMIN: 'ADMIN'
} as const

export const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
} as const

export const WorkOrderStatus = {
  LOGGED: 'LOGGED',
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const

export const PPMStatus = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED'
} as const

export const AssetStatus = {
  OPERATIONAL: 'OPERATIONAL',
  NEEDS_MAINTENANCE: 'NEEDS_MAINTENANCE',
  UNDER_REPAIR: 'UNDER_REPAIR',
  RETIRED: 'RETIRED'
} as const

export interface MockUser {
  id: string
  email: string
  name: string
  password: string
  role: UserRole
  phone?: string
  avatar?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  hotelId?: string
  hotel?: MockHotel
}

export interface MockHotel {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  logo?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MockLocation {
  id: string
  name: string
  type: string
  parentId?: string
  hotelId: string
  qrCode?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MockAsset {
  id: string
  name: string
  type: string
  model?: string
  serialNumber?: string
  installDate?: Date
  warrantyExpiry?: Date
  status: AssetStatus
  locationId: string
  hotelId: string
  qrCode: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MockWorkOrder {
  id: string
  title: string
  description?: string
  category: string
  priority: Priority
  status: WorkOrderStatus
  locationId: string
  assetId?: string
  hotelId: string
  createdById: string
  assignedToId?: string
  dueDate?: Date
  estimatedCost?: number
  actualCost?: number
  timeSpent?: number
  completedAt?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MockWorkOrderStatusHistory {
  id: string
  workOrderId: string
  status: WorkOrderStatus
  notes?: string
  userId: string
  createdAt: Date
}

export interface MockPPMSchedule {
  id: string
  name: string
  description?: string
  frequency: string
  startDate: Date
  endDate?: Date
  hotelId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MockPPMTask {
  id: string
  title: string
  description?: string
  dueDate: Date
  completedDate?: Date
  status: PPMStatus
  scheduleId: string
  assetId?: string
  assignedToId?: string
  estimatedTime?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MockAssignmentRule {
  id: string
  name: string
  description?: string
  hotelId: string
  category: string
  priority?: Priority
  locationId?: string
  assigneeId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MockWorkOrderSLA {
  id: string
  workOrderId: string
  category: string
  priority: Priority
  expectedResponseTime: number
  expectedResolutionTime: number
  actualResponseTime?: number
  actualResolutionTime?: number
  assignedAt?: Date
  firstResponseAt?: Date
  resolvedAt?: Date
  isOverdue: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MockDigitalSignature {
  id: string
  workOrderId: string
  signatureType: string
  signatureData: string
  signerName: string
  signerTitle: string
  signerUserId: string
  notes?: string
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

export interface MockTrainingRecord {
  id: string
  title: string
  category: string
  description?: string
  completionDate: Date
  expiryDate?: Date
  score?: number
  userId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// In-memory data store
class MockDataStore {
  public hotels: MockHotel[] = []
  public users: MockUser[] = []
  public locations: MockLocation[] = []
  public assets: MockAsset[] = []
  public workOrders: MockWorkOrder[] = []
  public workOrderStatusHistory: MockWorkOrderStatusHistory[] = []
  public ppmSchedules: MockPPMSchedule[] = []
  public ppmTasks: MockPPMTask[] = []
  public assignmentRules: MockAssignmentRule[] = []
  public workOrderSLAs: MockWorkOrderSLA[] = []
  public digitalSignatures: MockDigitalSignature[] = []
  public trainingRecords: MockTrainingRecord[] = []

  constructor() {
    this.initializeData()
  }

  private async initializeData() {
    // Create hotels
    this.hotels = [
      {
        id: 'hotel-1',
        name: 'Grand Palace Hotel',
        address: '123 Luxury Avenue, Downtown City, NY 10001',
        phone: '+1-555-0123',
        email: 'info@grandpalace.com',
        isActive: true,
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: 'hotel-2',
        name: 'Ocean View Resort',
        address: '456 Beach Road, Coastal City, CA 90210',
        phone: '+1-555-0456',
        email: 'reservations@oceanview.com',
        isActive: true,
        createdAt: new Date('2023-03-20'),
        updatedAt: new Date('2024-03-20')
      }
    ]

    // Create users with hashed passwords
    const hashedPassword = await bcrypt.hash('demo123', 10)
    
    this.users = [
      {
        id: 'user-1',
        email: 'manager@grandpalace.com',
        name: 'Sarah Johnson',
        password: hashedPassword,
        role: 'MANAGER',
        phone: '+1-555-0101',
        isActive: true,
        createdAt: new Date('2023-01-20'),
        updatedAt: new Date('2024-01-20'),
        hotelId: 'hotel-1',
        hotel: this.hotels[0]
      },
      {
        id: 'user-2',
        email: 'tech@grandpalace.com',
        name: 'Mike Rodriguez',
        password: hashedPassword,
        role: 'TECHNICIAN',
        phone: '+1-555-0102',
        isActive: true,
        createdAt: new Date('2023-02-01'),
        updatedAt: new Date('2024-02-01'),
        hotelId: 'hotel-1',
        hotel: this.hotels[0]
      },
      {
        id: 'user-3',
        email: 'staff@grandpalace.com',
        name: 'Jane Smith',
        password: hashedPassword,
        role: 'STAFF',
        phone: '+1-555-0103',
        isActive: true,
        createdAt: new Date('2023-02-15'),
        updatedAt: new Date('2024-02-15'),
        hotelId: 'hotel-1',
        hotel: this.hotels[0]
      },
      {
        id: 'user-4',
        email: 'admin@grandpalace.com',
        name: 'Robert Wilson',
        password: hashedPassword,
        role: 'ADMIN',
        phone: '+1-555-0104',
        isActive: true,
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2024-01-15'),
        hotelId: 'hotel-1',
        hotel: this.hotels[0]
      },
      {
        id: 'user-5',
        email: 'tech2@grandpalace.com',
        name: 'Lisa Chen',
        password: hashedPassword,
        role: 'TECHNICIAN',
        phone: '+1-555-0105',
        isActive: true,
        createdAt: new Date('2023-03-01'),
        updatedAt: new Date('2024-03-01'),
        hotelId: 'hotel-1',
        hotel: this.hotels[0]
      }
    ]

    // Create locations
    this.locations = [
      {
        id: 'loc-1',
        name: 'Lobby',
        type: 'Area',
        hotelId: 'hotel-1',
        qrCode: 'LOCATION:LOB001',
        isActive: true,
        createdAt: new Date('2023-01-20'),
        updatedAt: new Date('2024-01-20')
      },
      {
        id: 'loc-2',
        name: 'Floor 1',
        type: 'Floor',
        hotelId: 'hotel-1',
        qrCode: 'LOCATION:FL001',
        isActive: true,
        createdAt: new Date('2023-01-20'),
        updatedAt: new Date('2024-01-20')
      },
      {
        id: 'loc-3',
        name: 'Room 101',
        type: 'Room',
        parentId: 'loc-2',
        hotelId: 'hotel-1',
        qrCode: 'LOCATION:R101',
        isActive: true,
        createdAt: new Date('2023-01-20'),
        updatedAt: new Date('2024-01-20')
      },
      {
        id: 'loc-4',
        name: 'Room 102',
        type: 'Room',
        parentId: 'loc-2',
        hotelId: 'hotel-1',
        qrCode: 'LOCATION:R102',
        isActive: true,
        createdAt: new Date('2023-01-20'),
        updatedAt: new Date('2024-01-20')
      },
      {
        id: 'loc-5',
        name: 'Kitchen',
        type: 'Area',
        hotelId: 'hotel-1',
        qrCode: 'LOCATION:KITCHEN',
        isActive: true,
        createdAt: new Date('2023-01-20'),
        updatedAt: new Date('2024-01-20')
      },
      {
        id: 'loc-6',
        name: 'Pool Area',
        type: 'Area',
        hotelId: 'hotel-1',
        qrCode: 'LOCATION:POOL',
        isActive: true,
        createdAt: new Date('2023-01-20'),
        updatedAt: new Date('2024-01-20')
      }
    ]

    // Create assets
    this.assets = [
      {
        id: 'asset-1',
        name: 'AC Unit 101',
        type: 'HVAC',
        model: 'CoolAir Pro 3000',
        serialNumber: 'CA-2023-001',
        installDate: new Date('2023-02-01'),
        warrantyExpiry: new Date('2026-02-01'),
        status: 'OPERATIONAL',
        locationId: 'loc-3',
        hotelId: 'hotel-1',
        qrCode: 'ASSET:AC101',
        isActive: true,
        createdAt: new Date('2023-02-01'),
        updatedAt: new Date('2024-02-01')
      },
      {
        id: 'asset-2',
        name: 'Elevator Main',
        type: 'Mechanical',
        model: 'ElevTech 5000',
        serialNumber: 'ET-2023-002',
        installDate: new Date('2023-01-15'),
        warrantyExpiry: new Date('2028-01-15'),
        status: 'NEEDS_MAINTENANCE',
        locationId: 'loc-1',
        hotelId: 'hotel-1',
        qrCode: 'ASSET:ELEV001',
        isActive: true,
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2024-08-15')
      },
      {
        id: 'asset-3',
        name: 'Pool Pump System',
        type: 'Plumbing',
        model: 'AquaFlow 2000',
        serialNumber: 'AF-2023-003',
        installDate: new Date('2023-03-01'),
        warrantyExpiry: new Date('2025-03-01'),
        status: 'OPERATIONAL',
        locationId: 'loc-6',
        hotelId: 'hotel-1',
        qrCode: 'ASSET:POOL001',
        isActive: true,
        createdAt: new Date('2023-03-01'),
        updatedAt: new Date('2024-03-01')
      },
      {
        id: 'asset-4',
        name: 'Kitchen Refrigerator',
        type: 'Electrical',
        model: 'ChillMax Commercial',
        serialNumber: 'CM-2023-004',
        installDate: new Date('2023-01-20'),
        warrantyExpiry: new Date('2025-01-20'),
        status: 'OPERATIONAL',
        locationId: 'loc-5',
        hotelId: 'hotel-1',
        qrCode: 'ASSET:FRIDGE001',
        isActive: true,
        createdAt: new Date('2023-01-20'),
        updatedAt: new Date('2024-01-20')
      }
    ]

    // Create work orders
    this.workOrders = [
      {
        id: 'wo-1',
        title: 'AC Unit Not Cooling Properly',
        description: 'Room 101 AC unit is blowing warm air. Guest complaints about temperature.',
        category: 'HVAC',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        locationId: 'loc-3',
        assetId: 'asset-1',
        hotelId: 'hotel-1',
        createdById: 'user-3',
        assignedToId: 'user-2',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        estimatedCost: 250,
        timeSpent: 45,
        isActive: true,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        id: 'wo-2',
        title: 'Elevator Maintenance Overdue',
        description: 'Quarterly maintenance check is overdue for main elevator.',
        category: 'Mechanical',
        priority: 'CRITICAL',
        status: 'LOGGED',
        locationId: 'loc-1',
        assetId: 'asset-2',
        hotelId: 'hotel-1',
        createdById: 'user-1',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        estimatedCost: 800,
        isActive: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'wo-3',
        title: 'Pool Filter Replacement',
        description: 'Regular filter replacement for pool system.',
        category: 'Plumbing',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        locationId: 'loc-6',
        assetId: 'asset-3',
        hotelId: 'hotel-1',
        createdById: 'user-1',
        assignedToId: 'user-5',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        estimatedCost: 150,
        actualCost: 140,
        timeSpent: 90,
        completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        isActive: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      },
      {
        id: 'wo-4',
        title: 'Light Bulb Replacement - Room 102',
        description: 'Bathroom light not working in Room 102.',
        category: 'Electrical',
        priority: 'LOW',
        status: 'COMPLETED',
        locationId: 'loc-4',
        hotelId: 'hotel-1',
        createdById: 'user-3',
        assignedToId: 'user-2',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        estimatedCost: 25,
        actualCost: 20,
        timeSpent: 15,
        completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        isActive: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      },
      {
        id: 'wo-5',
        title: 'Kitchen Refrigerator Temperature Alert',
        description: 'Kitchen refrigerator temperature monitoring system triggered alert.',
        category: 'Electrical',
        priority: 'HIGH',
        status: 'ON_HOLD',
        locationId: 'loc-5',
        assetId: 'asset-4',
        hotelId: 'hotel-1',
        createdById: 'user-1',
        assignedToId: 'user-5',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        estimatedCost: 300,
        timeSpent: 30,
        isActive: true,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    ]

    // Create work order status history
    this.workOrderStatusHistory = [
      {
        id: 'wosh-1',
        workOrderId: 'wo-1',
        status: 'LOGGED',
        notes: 'Work order created from guest complaint',
        userId: 'user-3',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },
      {
        id: 'wosh-2',
        workOrderId: 'wo-1',
        status: 'IN_PROGRESS',
        notes: 'Assigned to Mike Rodriguez, started diagnosis',
        userId: 'user-2',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        id: 'wosh-3',
        workOrderId: 'wo-3',
        status: 'LOGGED',
        notes: 'Scheduled maintenance task',
        userId: 'user-1',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'wosh-4',
        workOrderId: 'wo-3',
        status: 'IN_PROGRESS',
        notes: 'Started filter replacement',
        userId: 'user-5',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'wosh-5',
        workOrderId: 'wo-3',
        status: 'COMPLETED',
        notes: 'Filter replaced successfully, system tested',
        userId: 'user-5',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    ]

    // Create PPM schedules
    this.ppmSchedules = [
      {
        id: 'ppm-sched-1',
        name: 'HVAC Quarterly Maintenance',
        description: 'Quarterly maintenance for all HVAC systems',
        frequency: 'Quarterly',
        startDate: new Date('2023-01-01'),
        hotelId: 'hotel-1',
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'ppm-sched-2',
        name: 'Pool System Monthly Check',
        description: 'Monthly maintenance for pool filtration system',
        frequency: 'Monthly',
        startDate: new Date('2023-01-01'),
        hotelId: 'hotel-1',
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ]

    // Create PPM tasks
    this.ppmTasks = [
      {
        id: 'ppm-task-1',
        title: 'AC Unit 101 Quarterly Service',
        description: 'Filter replacement and system inspection',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'SCHEDULED',
        scheduleId: 'ppm-sched-1',
        assetId: 'asset-1',
        assignedToId: 'user-2',
        estimatedTime: 120,
        isActive: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'ppm-task-2',
        title: 'Pool System Filter Check',
        description: 'Monthly filter inspection and cleaning',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'OVERDUE',
        scheduleId: 'ppm-sched-2',
        assetId: 'asset-3',
        assignedToId: 'user-5',
        estimatedTime: 60,
        isActive: true,
        createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
      }
    ]

    // Create assignment rules
    this.assignmentRules = [
      {
        id: 'rule-1',
        name: 'HVAC Critical Issues',
        description: 'Auto-assign critical HVAC issues to senior technician',
        hotelId: 'hotel-1',
        category: 'HVAC',
        priority: 'CRITICAL',
        assigneeId: 'user-2',
        isActive: true,
        createdAt: new Date('2023-06-01'),
        updatedAt: new Date('2024-06-01')
      },
      {
        id: 'rule-2',
        name: 'Electrical Issues',
        description: 'Auto-assign electrical issues to Lisa Chen',
        hotelId: 'hotel-1',
        category: 'Electrical',
        assigneeId: 'user-5',
        isActive: true,
        createdAt: new Date('2023-06-01'),
        updatedAt: new Date('2024-06-01')
      },
      {
        id: 'rule-3',
        name: 'Pool Area Maintenance',
        description: 'Auto-assign pool area issues to pool specialist',
        hotelId: 'hotel-1',
        category: 'Plumbing',
        locationId: 'loc-6',
        assigneeId: 'user-5',
        isActive: true,
        createdAt: new Date('2023-06-01'),
        updatedAt: new Date('2024-06-01')
      }
    ]

    // Create work order SLAs
    this.workOrderSLAs = [
      {
        id: 'sla-1',
        workOrderId: 'wo-1',
        category: 'HVAC',
        priority: 'HIGH',
        expectedResponseTime: 60, // 1 hour
        expectedResolutionTime: 480, // 8 hours
        actualResponseTime: 45,
        assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        firstResponseAt: new Date(Date.now() - 1.25 * 60 * 60 * 1000),
        isOverdue: false,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        id: 'sla-2',
        workOrderId: 'wo-2',
        category: 'Mechanical',
        priority: 'CRITICAL',
        expectedResponseTime: 30, // 30 minutes
        expectedResolutionTime: 240, // 4 hours
        isOverdue: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'sla-3',
        workOrderId: 'wo-3',
        category: 'Plumbing',
        priority: 'MEDIUM',
        expectedResponseTime: 120, // 2 hours
        expectedResolutionTime: 960, // 16 hours
        actualResponseTime: 90,
        actualResolutionTime: 840,
        assignedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        firstResponseAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        resolvedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        isOverdue: false,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    ]

    // Create digital signatures
    this.digitalSignatures = [
      {
        id: 'sig-1',
        workOrderId: 'wo-3',
        signatureType: 'completion',
        signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEhAJ/wlseKgAAAABJRU5ErkJggg==',
        signerName: 'Lisa Chen',
        signerTitle: 'Senior Technician',
        signerUserId: 'user-5',
        notes: 'Pool filter replacement completed successfully',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      },
      {
        id: 'sig-2',
        workOrderId: 'wo-4',
        signatureType: 'completion',
        signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEhAJ/wlseKgAAAABJRU5ErkJggg==',
        signerName: 'Mike Rodriguez',
        signerTitle: 'Maintenance Technician',
        signerUserId: 'user-2',
        notes: 'Light bulb replaced and tested',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      }
    ]

    // Create training records
    this.trainingRecords = [
      {
        id: 'train-1',
        title: 'HVAC Safety Certification',
        category: 'HVAC',
        description: 'Comprehensive HVAC safety and maintenance certification',
        completionDate: new Date('2023-11-15'),
        expiryDate: new Date('2025-11-15'),
        score: 95,
        userId: 'user-2',
        isActive: true,
        createdAt: new Date('2023-11-15'),
        updatedAt: new Date('2023-11-15')
      },
      {
        id: 'train-2',
        title: 'Electrical Safety Training',
        category: 'Electrical',
        description: 'Electrical safety and troubleshooting certification',
        completionDate: new Date('2024-01-20'),
        expiryDate: new Date('2026-01-20'),
        score: 88,
        userId: 'user-5',
        isActive: true,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20')
      },
      {
        id: 'train-3',
        title: 'Pool Chemical Safety',
        category: 'Safety',
        description: 'Pool chemical handling and safety procedures',
        completionDate: new Date('2023-08-10'),
        expiryDate: new Date('2024-08-10'), // Soon to expire
        score: 92,
        userId: 'user-5',
        isActive: true,
        createdAt: new Date('2023-08-10'),
        updatedAt: new Date('2023-08-10')
      }
    ]
  }

  // Helper methods to generate IDs
  generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Get current timestamp
  now(): Date {
    return new Date()
  }
}

// Export singleton instance
export const mockDb = new MockDataStore()