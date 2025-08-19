# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development Server
```bash
npm run dev
```
Custom development server that includes Socket.IO integration using nodemon, TSX, and logging to dev.log.

### Build and Deployment
```bash
npm run build     # Build for production
npm start         # Start production server with TSX and logging to server.log
npm run lint      # Run ESLint checks
```

### Database Operations
```bash
npm run db:push      # Push schema changes to database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:reset     # Reset database
npm run db:seed      # Seed database with initial data
```

## Architecture Overview

### Application Type
Hotel Facilities Management System - A full-stack Next.js application with real-time capabilities for managing work orders, preventive maintenance schedules, assets, and safety incidents.

### Tech Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript 5
- **UI Framework**: shadcn/ui components with Radix UI primitives, Tailwind CSS 4
- **Backend**: Next.js API routes with custom server integration
- **Database**: Prisma ORM with SQLite (configurable via DATABASE_URL)
- **Real-time**: Socket.IO integration for live updates
- **Authentication**: NextAuth.js with credential-based auth and bcrypt
- **State Management**: Zustand with TanStack Query for server state

### Key Architecture Patterns

#### Multi-Interface Design
The application serves three distinct user interfaces:
- **Splash Screen** (`/`) - Entry point for route selection
- **Manager Dashboard** (`/manager/*`) - Desktop interface for facility managers
- **Mobile Interface** (`/mobile/*`) - Touch-optimized interface for staff/technicians

#### Custom Server Pattern
Uses a custom Node.js server (`server.ts`) that combines Next.js with Socket.IO:
- Handles HTTP requests through Next.js
- Provides WebSocket functionality via Socket.IO on `/api/socketio` path
- Enables real-time work order updates, PPM notifications, and safety alerts

#### Database Schema Structure
Core entities organized around hotel operations:
- **User Management**: Users with roles (STAFF, TECHNICIAN, MANAGER, ADMIN) tied to hotels
- **Location Hierarchy**: Hotels → Locations (floors, rooms, areas) with QR codes
- **Asset Management**: Assets with status tracking and maintenance records
- **Work Order System**: Full lifecycle from creation to completion with status history
- **PPM Scheduling**: Preventive maintenance with recurring tasks
- **Safety & Training**: Incident reporting and certification tracking

#### Authentication Flow
- Custom NextAuth.js setup with credential provider
- Database-backed user authentication with bcrypt password hashing
- JWT session strategy with role-based access control
- Simple auth hooks for easy session management

### Component Structure

#### UI Components (`src/components/ui/`)
Complete shadcn/ui component library implementation with:
- Layout components (Card, Separator, Sheet, Dialog)
- Form controls (Input, Select, Checkbox, etc.)
- Data display (Table, Badge, Avatar, etc.)
- Navigation (Breadcrumb, Menubar, Tabs)

#### Business Components (`src/components/`)
- `auth-provider.tsx` - NextAuth session provider wrapper
- `manager-layout.tsx` - Desktop layout with sidebar navigation
- `mobile-layout.tsx` - Mobile-first layout with bottom navigation
- `real-time-notifications.tsx` - Socket.IO integration for live updates
- `offline-status.tsx` - PWA-style offline capabilities

#### Custom Hooks (`src/hooks/`)
- `use-auth.ts` - NextAuth session management
- `use-simple-auth.ts` - Simplified auth state management
- `use-socket.ts` - Socket.IO connection and event handling
- `use-mobile.ts` - Mobile device detection
- `use-offline-mode.ts` - Offline state management

### API Architecture

#### RESTful Endpoints
All API routes follow `/api/[resource]` pattern:
- Work orders, assets, locations, PPM schedules
- User authentication and profile management
- File uploads and QR code generation
- Dashboard statistics and reporting

#### Real-time Events
Socket.IO events for live collaboration:
- `work-order-update` - Status changes and assignments
- `new-work-order` - New incident notifications
- `ppm-schedule-update` - Maintenance task updates
- `safety-incident` - Emergency notifications

### Development Notes

#### Database Connection
SQLite database with Prisma ORM. Database file located at `db/custom.db`. Use database commands for schema changes and seeding.

#### Environment Setup
Custom server requires both Next.js and Socket.IO configuration. Development mode uses nodemon for hot reloading with TSX compilation.

#### Mobile-First Design
UI components are responsive by default. Mobile interface (`/mobile/*`) provides touch-optimized experience for field staff.

#### Real-time Features
Socket.IO integration provides live updates across different user roles. Managers receive notifications about new work orders, while technicians get PPM task updates.

#### QR Code Integration
Assets and locations include QR codes for quick mobile scanning and access. QR code generation available through dedicated API endpoints.