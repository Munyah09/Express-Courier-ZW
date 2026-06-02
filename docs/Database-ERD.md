# Database ERD

## Entity Relationship Overview

Mermaid ERD:

```mermaid
erDiagram
    USERS ||--o{ ROLES : belongs_to
    USERS ||--o{ FRANCHISES : manages
    USERS ||--o{ BRANCHES : assigned_to
    USERS ||--o{ AGENTS : represents
    USERS ||--o{ VEHICLES : drives
    CUSTOMERS ||--o{ PARCELS : sends
    CUSTOMERS ||--o{ PARCELS : receives
    PARCELS ||--o{ PARCEL_EVENTS : has
    PARCELS ||--o{ PARCEL_PHOTOS : has
    PARCELS ||--o{ PARCEL_SIGNATURES : has
    PARCELS ||--o{ PARCEL_SCANS : has
    PARCELS ||--o{ PARCEL_OTPS : has
    PARCELS ||--o{ DELIVERIES : has
    PARCELS ||--o{ PAYMENTS : has
    PARCELS ||--o{ DOCUMENTS : has
    PARCELS ||--o{ COMMISSIONS : has
    BRANCHES ||--o{ COLLECTION_POINTS : owns
    BRANCHES ||--o{ VEHICLES : owns
    BRANCHES ||--o{ PARCELS : processes
    FRANCHISES ||--o{ BRANCHES : owns
    FRANCHISES ||--o{ USERS : has
    ROUTES ||--o{ MANIFESTS : generates
    MANIFESTS ||--o{ PARCELS : contains
    AGENTS ||--o{ COMMISSIONS : earns
    ROLES ||--o{ ROLE_PERMISSIONS : uses
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : linked
```

## Core tables
- `users`
- `roles`
- `permissions`
- `franchises`
- `branches`
- `customers`
- `collection_points`
- `agents`
- `vehicles`
- `routes`
- `manifests`
- `parcels`
- `parcel_events`
- `parcel_photos`
- `parcel_signatures`
- `parcel_scans`
- `parcel_otps`
- `deliveries`
- `payments`
- `expenses`
- `commissions`
- `documents`
- `notifications`
- `audit_logs`

## Relationship summary
- Customers are linked to parcels as senders and receivers.
- Parcels are assigned to routes, branches, manifests, drivers, collection points, and agents.
- Every parcel action is recorded in `parcel_events` to preserve audit history.
- Franchise revenue and royalties are computed from branch, parcel, and commission data.
- Notifications and documents are connected to parcels and customers for operational history.
