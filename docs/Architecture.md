# System Architecture

## 1. Overview
The Mufasa Express platform is built as a modular cloud-ready application with separate frontend and backend services, a PostgreSQL database, S3-compatible object storage, and a realtime socket layer for tracking updates.

### High-level components
- **Frontend**: React + Vite + Tailwind, mobile-first operations portal for staff and customers.
- **Backend**: Node.js + Express + TypeScript API with JWT, RBAC, audit logging, notifications, and document generation.
- **Database**: PostgreSQL for relational data and analytics.
- **Storage**: MinIO / S3-compatible object storage for photos, signatures, and documents.
- **Realtime**: Socket.IO for live parcel location and status updates.
- **Notifications**: WhatsApp API, SMS gateway, email SMTP.
- **Deployment**: Docker Compose for local dev, production-ready containers for cloud deployment.

## 2. Frontend Architecture
- Single-page application with React Router.
- Data fetching with TanStack React Query.
- Forms with React Hook Form + Zod validation.
- Tailwind for responsive mobile-first UI.
- Progressive module separation: auth, tracking, operations, dashboards, franchise, documents.

## 3. Backend Architecture
- Express router modules for auth, customers, parcels, route management, finances, notifications, documents, franchises.
- Middleware for JWT auth, RBAC, rate limiting, error handling.
- Service layer to separate business logic from controllers.
- Data access layer to isolate SQL/ORM patterns.
- Event models for parcel lifecycle and audit trails.

## 4. Database Architecture
- Relational schema optimized for parcel lifecycle and franchise separation.
- Role/permission RBAC tables for flexible access control.
- Geography-aware columns for GPS coordinates via PostGIS or Postgres geography.
- Event tables for immutable parcel audit history.
- Document and notification tables for compliance and automation.

## 5. Security Architecture
- JWT access and refresh tokens.
- Role-based access control with permissions.
- Rate limiting on API endpoints.
- Helmet for HTTP security headers.
- Encrypted storage for secrets and backups.
- Audit logs for all user and system actions.

## 6. Deployment Architecture
- Docker containers for frontend, backend, postgresql, and object storage.
- Netlify configuration for frontend hosting.
- Backend can deploy to any container platform or cloud VM.
- Database backups and migration workflows.
- Environment variables separated from source.

## 7. Scaling Architecture
- Horizontally scale backend using multiple container instances behind a load balancer.
- Scale PostgreSQL with read replicas and partitioning for parcel history.
- Use S3-compatible storage to offload binary assets.
- Use queue services for heavy document generation and notification dispatch.
- Adopt CDN for static frontend assets.

## 8. Franchise Architecture
- Franchise and branch data separated by foreign keys.
- Multi-tenant design using franchise_id and branch_id filters.
- Role restrictions to enforce data visibility.
- Dedicated reports and revenue calculations per franchise.

## 9. Future Mobile Architecture
- Design REST endpoints for React Native apps.
- Use token-based auth and offline-safe sync.
- Separate driver, customer, and agent app modal capabilities.
- Mobile-first endpoint design for low-bandwidth and rural coverage.
