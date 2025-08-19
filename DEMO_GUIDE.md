# Hotel Facilities Management System - Demo Guide

## Overview
This is a comprehensive hotel facilities management system with two main interfaces:
1. **Mobile Staff App** - For hotel staff to quickly log incidents and track requests
2. **Manager Dashboard** - For managers and technicians to oversee operations, manage work orders, and generate reports

## Getting Started

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Access the Application
Open your browser and navigate to `http://localhost:3000`

## Demo Users
The system comes with pre-configured users for different roles:

### Staff User (Mobile App)
- **Email**: `staff@hotel.com`
- **Password**: `password123`
- **Role**: Staff - Can create and view their own work orders

### Technician User
- **Email**: `tech@hotel.com`
- **Password**: `password123`
- **Role**: Technician - Can view and work on assigned tasks

### Manager User (Dashboard)
- **Email**: `manager@hotel.com`
- **Password**: `password123`
- **Role**: Manager - Full access to dashboard and management features

### Admin User
- **Email**: `admin@hotel.com`
- **Password**: `password123`
- **Role**: Admin - Full system access

## Demo Scenarios

### Scenario 1: Staff Member Logging an Incident (Mobile Experience)

1. **Login as Staff User**
   - Use `staff@hotel.com` / `password123`
   - You'll be redirected to the mobile staff app

2. **Explore the Mobile Interface**
   - **Home Tab**: Shows quick actions, open requests, and recent activity
   - **Requests Tab**: Lists all requests created by the staff member
   - **Profile Tab**: User profile and settings

3. **Log a New Incident**
   - Tap the large "(+) Log New Incident" button
   - **Step 1 - Location**: 
     - Try the "Scan QR Code" button (mock functionality)
     - Or select a location from the dropdown (e.g., "Room 204")
   - **Step 2 - Describe Issue**:
     - Upload photos (mock functionality - adds sample images)
     - Select category (e.g., "Electrical")
     - Enter title (e.g., "Flickering bathroom light")
     - Add description
     - Set priority (try "CRITICAL" to see the confirmation modal)
   - **Step 3 - Review & Submit**:
     - Review all entered information
     - Submit the request

4. **Track the Request**
   - Go to the "Requests" tab to see your new request
   - The status should be "LOGGED"

### Scenario 2: Manager Overseeing Operations (Dashboard Experience)

1. **Login as Manager**
   - Use `manager@hotel.com` / `password123`
   - You'll be redirected to the manager dashboard

2. **Explore the Dashboard**
   - **Compliance Traffic Lights**: Shows PPM task status
     - Red (Overdue): 5 tasks
     - Amber (Due Soon): 12 tasks
     - Green (Up to Date): 45 tasks
   - **KPI Scorecards**: Key performance indicators
     - Open High-Priority Incidents
     - Average Response Time
     - Monthly Spend
     - Asset Uptime
   - **Live Work Order Feed**: Recent work orders with real-time status

3. **Navigate the Sidebar**
   - **Dashboard**: Main overview page
   - **Work Orders**: Manage all work orders (under development)
   - **PPM Scheduler**: Planned maintenance schedules (under development)
   - **Assets**: Asset management (under development)
   - **Reports & Audits**: Generate reports (under development)
   - **Safety & Training**: Training records (under development)
   - **Settings**: System configuration (under development)

### Scenario 3: Technician Working on Tasks

1. **Login as Technician**
   - Use `tech@hotel.com` / `password123`
   - You'll be redirected to the manager dashboard (technicians use the same interface)

2. **View Assigned Work Orders**
   - Navigate to "Work Orders" section
   - Filter by "Assigned to Me"
   - View work orders assigned to you

3. **Update Work Order Status**
   - Click on a work order to view details
   - Update status, add notes, log time spent
   - Upload completion photos
   - Mark as completed

## Key Features Demonstrated

### Authentication & Authorization
- Role-based access control
- Secure login system
- User profile management

### Mobile Staff App Features
- **Multi-step incident logging workflow**
- **QR code scanning** (mock functionality)
- **Photo upload** capability
- **Priority levels** with confirmation for critical issues
- **Offline mode banner** (visual indicator)
- **Bottom navigation** for mobile-first experience

### Manager Dashboard Features
- **Compliance overview** with traffic light system
- **KPI tracking** with trend indicators
- **Live work order feed** for real-time monitoring
- **Responsive sidebar navigation**
- **Role-based content display**

### Database Schema
- **Comprehensive data model** with proper relationships
- **User roles** and permissions
- **Work order lifecycle** management
- **Asset tracking** with QR codes
- **PPM scheduling** system
- **Vendor management** with SLA policies
- **Training records** tracking

## Sample Data
The system includes realistic sample data:
- **Hotel**: Grand Hotel Plaza
- **Locations**: Multiple floors, rooms, and common areas
- **Assets**: Electrical, HVAC, and other equipment
- **Work Orders**: Various statuses and priorities
- **Users**: Different roles with appropriate permissions
- **PPM Tasks**: Scheduled maintenance tasks
- **Vendors**: External service providers
- **Training Records**: Staff certifications

## Next Steps for Development
The following features are ready for implementation:
1. **Work Order Management** - Full CRUD operations with filtering
2. **PPM Scheduler** - Calendar view and task management
3. **Asset Management** - QR code generation and lifecycle tracking
4. **Reports & Audits** - PDF/Excel export functionality
5. **Safety & Training** - Certificate management and expiry alerts
6. **Real-time Updates** - Socket.io integration
7. **Offline Mode** - Local storage and sync capabilities

## Technical Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js
- **State Management**: Zustand, TanStack Query
- **Real-time**: Socket.io
- **Icons**: Lucide React

This demo provides a solid foundation for a production-ready hotel facilities management system with modern UI/UX and comprehensive functionality.