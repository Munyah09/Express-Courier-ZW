# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose
This document defines the scope, features, requirements, and architecture of the Mufasa Express Courier platform. The system is designed to meet the needs of Zimbabwean and African logistics operators, with mobile-first usability, landmark-based addresses, community pick-up points, WhatsApp integration, franchise scaling, and secure parcel auditing.

### 1.2 Scope
The platform will support:
- Parcel collection, delivery, home delivery, pickup point delivery, intercity courier services, same-day and next-day delivery, reverse logistics, cash-on-delivery, franchise operations, and future warehousing/e-commerce fulfillment.
- Customer, parcel, route, vehicle, driver, agent, franchise, collection point, and financial management.
- Notifications via WhatsApp, SMS, and email.
- Document generation, QR/barcode scanning, OTP verification, GPS tracking, and digital signatures.
- Role-based access control for enterprise-grade operations.

### 1.3 Definitions
- **Courier Operator**: A company or franchise that handles parcel logistics.
- **Collection Point**: Community pickup/release locations such as shops, fuel stations, and pharmacies.
- **Franchise**: An independent branch network with revenue and royalty reporting.
- **Audit Trail**: Immutable recording of parcel events, scans, and handoffs.

## 2. Stakeholders
- Super Administrator
- Operations Administrator
- Branch Manager
- Dispatch Supervisor
- Driver
- Rider
- Agent
- Collection Point Operator
- Franchise Owner
- Franchise Staff
- Customer
- Corporate Customer
- Auditor

## 3. User Roles and Permissions
A flexible RBAC system will allow permissions such as:
- Manage users
- Create shipments
- Scan parcels
- Verify OTPs
- Approve manifests
- View finance reports
- Manage franchise data
- Access customer portal

Initial bootstrap roles:
- Super Admin
- Administrator
- Shop Assistant
- Driver
- Clerk
- Accountant
- Logistics Manager
- Customer Portal User

## 4. Functional Requirements

### 4.1 Customer Management
- Create individual and corporate customers.
- Store personal details, national ID, phone, WhatsApp, email, landmark address, GPS coordinates, and notes.
- Support customers without formal addresses.

### 4.2 Parcel Management
- Generate unique tracking numbers, QR codes, and barcodes.
- Track sender, receiver, weight, dimensions, declared value, insurance, collection point, delivery point, branch, assigned driver, route, and status.
- Support status lifecycle from Accepted to Delivered/Returned/Lost/Damaged.

### 4.3 Chain of Custody
- Record parcel handoffs with user, timestamp, GPS, branch, device, and photo.
- Maintain immutable parcel event logs.

### 4.4 Scanning
- Support QR and barcode scanning across operations.
- Track activities: Accepted, Loaded, Dispatched, Received, Transferred, Delivered, Returned.

### 4.5 GPS Tracking
- Capture collection, dispatch, arrival, and delivery coordinates.
- Display parcel journey on a map.

### 4.6 OTP Delivery
- Generate OTP codes.
- Send via WhatsApp and SMS.
- Block delivery completion until verified.

### 4.7 Digital Signatures
- Capture receiver, driver, and agent signatures.
- Store signatures securely and associate them with parcel records.

### 4.8 Photo Verification
- Upload parcel condition, delivery proof, collection proof, and damage evidence.
- Attach photos to parcel records.

### 4.9 Collection Points
- Register community pickup locations with GPS, contact, and commission data.
- Track received parcels, collections, and revenue.

### 4.10 Agent Management
- Manage community agents and independent partners.
- Track performance, deliveries, and commissions.

### 4.11 Franchise Management
- Support unlimited franchises with owner, territory, branches, staff, revenue, and royalty rates.
- Generate reports and compliance statements.

### 4.12 Route Management
- Maintain routes and hubs across Zimbabwe and beyond.
- Generate transport manifests automatically.

### 4.13 Vehicle Management
- Manage vehicle fleet by type, mileage, fuel, maintenance, and driver assignments.

### 4.14 Finance
- Track revenue, expenses, fuel costs, commissions, driver pay, and franchise royalties.
- Generate daily, weekly, monthly, and annual reports.

### 4.15 Document Generation
- Produce printable PDFs for receipts, labels, manifests, delivery notes, return notes, damage reports, driver trip sheets, statements, invoices, and reports.
- Include QR codes, barcodes, tracking number, timestamp, and signature area.

### 4.16 Notifications
- Notify stakeholders of parcel events via WhatsApp, SMS, and email.

### 4.17 Customer Tracking Portal
- Public tracking portal for tracking number lookup.
- Display current status, timeline, expected arrival, collection point, and map.

### 4.18 Mobile Readiness
- Design APIs for future React Native apps: driver app, customer app, agent app, franchise app.

## 5. Nonfunctional Requirements
- Scalable architecture capable of handling 10 million parcels per year.
- Secure JWT-based authentication with refresh tokens.
- Audit logging, rate limiting, encryption at rest and in transit.
- Cloud-ready deployment with Docker and compose.
- Mobile-first UX and offline-friendly operation.

## 6. System Constraints
- Must operate in regions with limited street addressing.
- Must provide low-cost, high-availability workflows.
- Must integrate with WhatsApp, SMS, email, and S3-compatible storage.

## 7. Assumptions
- Drivers and shop assistants will have smartphones.
- Customers can receive WhatsApp/SMS notifications.
- Franchise owners need segmented access.

## 8. Future Enhancements
- Full e-commerce fulfillment and warehousing.
- Machine learning route optimization.
- Multi-language support.
- Offline-first mobile apps for rural operations.
