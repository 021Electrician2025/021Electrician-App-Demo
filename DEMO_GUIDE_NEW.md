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

## Quick Start Guide

### 🚀 **Instant Access - No Login Required!**

The system now features a **Quick Login** system that lets you access any role instantly:

1. **Visit the Application**: Go to `http://localhost:3000`
2. **Wait for Splash Screen**: You'll see a 2-second animated splash screen
3. **Quick Login**: On the login page, scroll down to see **"Quick Login (Demo)"** section
4. **Click Any User**: Simply click on any of the 4 demo users to instantly access the system

### 🎯 **What Happens Next?**

- **Staff users** are redirected to the **Mobile App** (`/mobile`)
- **Manager/Technician/Admin users** are redirected to the **Manager Dashboard** (`/manager`)

## Demo Scenarios

### Scenario 1: Staff Member Logging an Incident (Mobile Experience)

1. **Quick Login as Staff**
   - On the login page, click "John Staff" under Quick Login
   - You'll be instantly redirected to the mobile staff app

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

1. **Quick Login as Manager**
   - On the login page, click "Sarah Manager" under Quick Login
   - You'll be instantly redirected to the manager dashboard

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

1. **Quick Login as Technician**
   - On the login page, click "Mike Technician" under Quick Login
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

### 🔐 **Simplified Authentication**
- **Quick Login**: One-click access to any role
- **No Password Required**: Demo users are pre-configured
- **Role-based Routing**: Automatic redirection based on user role
- **Session Management**: Simple localStorage-based authentication

### 📱 **Mobile Staff App Features**
- **Multi-step incident logging workflow**
- **QR code scanning** (mock functionality)
- **Photo upload** capability
- **Priority levels** with confirmation for critical issues
- **Offline mode banner** (visual indicator)
- **Bottom navigation** for mobile-first experience

### 🖥️ **Manager Dashboard Features**
- **Compliance overview** with traffic light system
- **KPI tracking** with trend indicators
- **Live work order feed** for real-time monitoring
- **Responsive sidebar navigation**
- **Role-based content display**

### 🗄️ **Database Schema**
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

## 🔄 **Authentication Flow**

```
1. Splash Screen (2 seconds)
   ↓
2. Simple Signin Page
   ↓
3. Quick Login (Click any user)
   ↓
4. Role-based Redirection:
   - Staff → Mobile App (/mobile)
   - Manager/Technician/Admin → Dashboard (/manager)
```

## 🛠 **Technical Implementation**

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Database**: SQLite with Prisma ORM
- **Authentication**: Simplified localStorage-based (for demo)
- **State Management**: Zustand, TanStack Query
- **Real-time**: Socket.io (integrated and ready)
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Animations**: Framer Motion

## 📁 **Project Structure**

```
src/
├── app/
│   ├── api/                 # API routes
│   ├── auth/
│   │   ├── simple-signin/   # Quick login page
│   │   └── signin/          # Traditional login
│   ├── dashboard/          # Routing logic
│   ├── mobile/             # Mobile staff app
│   ├── manager/            # Manager dashboard
│   └── profile/            # User profile
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── auth-provider.tsx   # NextAuth provider
│   ├── splash-screen.tsx   # Loading screen
│   └── icons.tsx          # Icon library
├── hooks/
│   ├── use-auth.ts         # NextAuth hook
│   ├── use-simple-auth.ts  # Simplified auth hook
│   └── use-toast.ts        # Toast notifications
├── lib/
│   ├── auth.ts            # NextAuth configuration
│   ├── db.ts              # Prisma client
│   └── utils.ts           # Utility functions
└── types/
    └── next-auth.d.ts     # Type extensions
```

## 🎮 **Interactive Demo Features**

### **Try These Interactions:**

1. **Critical Priority**: When logging an incident, select "CRITICAL" priority to see the confirmation modal
2. **Photo Upload**: Click "Take Photo/Video" to see mock photo upload functionality
3. **QR Code Scan**: Try the QR code scanning button (mock functionality)
4. **Status Badges**: Hover over status and priority badges to see color coding
5. **Mobile Navigation**: Use bottom navigation on mobile screens
6. **Sidebar Toggle**: On mobile, click the menu button to toggle sidebar
7. **Quick Login**: Try different user roles to see different interfaces

## 🚀 **Ready for Extension**

The foundation is solid and ready for:
- Work order management with filtering and bulk actions
- PPM scheduler with calendar views
- Asset management with QR code generation
- Reports and audits with export functionality
- Safety and training tracking
- Real-time updates with Socket.io
- Offline mode capabilities

## 📱 **Mobile Optimization**

The mobile app features:
- Touch-friendly interface (44px minimum touch targets)
- Bottom navigation for easy thumb access
- Responsive design that works on all screen sizes
- Optimized for quick incident reporting
- Offline mode indicators (ready for implementation)

## 🎯 **Demo Success Metrics**

This demo provides:
- ✅ **Instant Access**: No login barriers
- ✅ **Role-based Experience**: Different interfaces for different users
- ✅ **Complete Workflow**: From incident logging to management oversight
- ✅ **Modern UI/UX**: Clean, responsive design
- ✅ **Realistic Data**: Sample hotel with actual maintenance scenarios
- ✅ **Production Ready**: Solid foundation for real-world deployment

---

**🏨 Experience the full hotel facilities management workflow in minutes!**