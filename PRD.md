Product Requirements Document: "OneApp" Facilities Management Platform
1. Vision & Opportunity
To create the single, indispensable platform for commercial facilities management, starting with a specialized electrical compliance and maintenance solution for the hotel industry. Our system will replace fragmented spreadsheets, manual paperwork, and delayed communication with a streamlined, real-time, and auditable digital workflow.

The long-term vision is to expand this platform to encompass all maintenance trades (plumbing, building works, HVAC, gas) becoming the sole application a business needs to manage its property maintenance, compliance, and vendor relationships.

2. User Personas
We are building for several key users, each with distinct needs:

Hotel Staff (e.g., Housekeeping, Front Desk): Needs an incredibly simple and fast way to report a problem. Their goal is to log an issue in under 30 seconds and get back to their primary job.

Maintenance Technician (The "021" Engineer): Needs a mobile-first tool to receive, manage, and document their work on the go. They require clear instructions, job history, and the ability to work in areas with poor connectivity.

Hotel General Manager (GM) / Facilities Manager: Needs a high-level dashboard view of compliance, budgets, and team performance. They are not involved in day-to-day fixes but are ultimately responsible for safety, compliance, and costs.

Compliance Officer / Auditor (Internal or External): Needs frictionless access to comprehensive, verifiable records for insurance, safety (HSA), and regulatory inspections. Their goal is to find proof of compliance quickly.

Multi-Site Director (For Hotel Groups): Needs a centralized view to compare and manage compliance and maintenance performance across all properties in a portfolio.

3. System Architecture Overview
The system will consist of three primary components:

Staff & Technician Mobile App (iOS & Android): A lightweight application with two distinct user interfaces based on login credentials.

Staff Mode: A single-purpose interface for logging incidents, primarily via QR code scanning.

Technician Mode: A feature-rich interface for job management, documentation, and communication. Must feature a robust offline mode that syncs data when connectivity is restored.

Web-Based Management Portal: The command center for Managers and Administrators. This is a powerful web application for dashboard reporting, PPM scheduling, user management, and system configuration.

Backend API & Database: The secure and scalable core of the system, handling all data processing, business logic, user authentication, and push notifications. The database schema must be designed for extensibility to accommodate future services like plumbing and building works.

4. Core Epics & Features
Epic 1: Incident & Work Order Management
This epic covers the entire lifecycle of a maintenance job, from reporting to resolution.

User Story (Staff): As a hotel staff member, I want to scan a QR code in a room or on an asset (e.g., fuse board), select a fault type from a simple list (e.g., "Light Not Working," "Socket Sparking"), add an optional photo, and submit it, so the issue is logged instantly without needing to find a supervisor.

Job History & Tracking: Every job request must be logged with a unique ID, timestamp, location, reporter, photos, notes, assigned technician, and a clear status (e.g., Logged, Assigned, In Progress, Awaiting Parts, Completed, Signed Off).

Automated Assignment & SLAs: New jobs are automatically assigned to the relevant team based on pre-defined rules. The system must track and display response times against Service Level Agreements (SLAs).

Digital Signature & Handover: Upon job completion, a manager can review the work (notes, photos) and provide a digital signature in-app to officially close the work order, creating an unbreakable audit trail.

Epic 2: Planned Preventative Maintenance (PPM) & Compliance
This is the core of the compliance engine, designed to prevent issues before they occur.

PPM Scheduler: An admin tool to create and schedule recurring maintenance tasks. Must be highly flexible to accommodate various schedules:

Weekly (Fire alarm tests)

Quarterly (Emergency lighting checks)

Annually (Periodic Inspection Reports, Fire alarm servicing)

Custom schedules (PAT testing, Generator/UPS maintenance)

Compliance Dashboard: A high-level, visual dashboard for managers. It will use a traffic-light system:

Green: All scheduled compliance tasks are up-to-date.

Amber: Tasks are due within the next 30 days.

Red: Tasks are overdue.

This dashboard should be the default landing page for all management users.

Audit & Insurance Pack Builder: A "one-click" feature that allows a manager to select a date range and a category (e.g., "Fire Safety," "Electrical Compliance") and export a single, consolidated PDF or Excel file containing all relevant job histories, certificates, and PPM logs.

Epic 3: Asset & Location Management
This provides the foundational structure for tracking and logging.

Hierarchical Asset Register: The system must support a hierarchy: Site -> Building -> Floor -> Room/Area (e.g., "Bedroom 101," "Kitchen," "Lift Motor Room") -> Asset (e.g., "Light Fitting 1," "Socket Outlet 3," "Fire Detector").

QR Code Generation & Management: The system will allow administrators to generate and print unique QR codes for rooms and major assets. Scanning a code should immediately bring the user to the "Log Fault" screen for that specific location/asset.

Epic 4: Value-Add & Retention Features
These features make the platform indispensable and central to all hotel operations.

Automated Reminders & Alerts: The system must send automated push notifications and emails for:

Upcoming PPM tasks.

Overdue compliance items.

Newly logged incidents (especially safety-critical ones).

Multi-Site Capability: A user with appropriate permissions can toggle between different hotel sites or view an aggregated compliance dashboard for the entire group.

Vendor Coordination: If a job is outside the scope (e.g., HVAC), a manager can re-assign the ticket to a pre-defined external vendor. The system will send a formatted email to the vendor and allow the manager to manually track the status, keeping all maintenance logs in one place.

Budget & Cost Tracking: Allow costs to be assigned to completed work orders. Provide simple monthly and annual reports on maintenance spending by category.

Safety & Training Logs: A dedicated module to log staff training completions (e.g., electrical safety inductions) and upload/store qualification certificates.

5. Non-Functional Requirements
Usability: The staff-facing interface must be extremely simple and intuitive. The management portal can be data-rich but must be easy to navigate.

Offline Mode: The technician's mobile app must function without an internet connection. Technicians must be able to view assigned jobs and log notes/photos offline. Data will sync automatically once a connection is re-established.

Performance: The application must be fast and responsive, especially the fault-logging process. Report generation should be efficient.

Security: All data must be encrypted in transit and at rest. Role-based access control (RBAC) is critical to ensure users only see the information relevant to their role.

White-Labeling: Provide the option for hotel clients to have the app branded with their own logo and color scheme to enhance adoption and make it feel like an internal tool.

