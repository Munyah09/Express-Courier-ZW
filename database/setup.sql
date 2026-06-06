-- ================================================================
-- Starverse Express Courier — Full Database Setup
-- Run this ONCE in: Supabase → SQL Editor → New Query
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT)
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ── 1. roles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL UNIQUE,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 2. permissions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permissions (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL UNIQUE,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 3. role_permissions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ── 4. franchises (must come before users & branches) ────────
CREATE TABLE IF NOT EXISTS franchises (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         text NOT NULL,
  owner_name   text,
  territory    text,
  royalty_rate numeric(5,2) NOT NULL DEFAULT 0,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ── 5. branches (depends on franchises) ──────────────────────
CREATE TABLE IF NOT EXISTS branches (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_id uuid REFERENCES franchises(id) ON DELETE SET NULL,
  name         text NOT NULL,
  code         text NOT NULL UNIQUE,
  address      text,
  gps_point    geography(Point,4326),
  city         text,
  phone        text,
  email        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ── 6. users (depends on roles, franchises, branches) ────────
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id       uuid REFERENCES roles(id) ON DELETE SET NULL,
  franchise_id  uuid REFERENCES franchises(id) ON DELETE SET NULL,
  branch_id     uuid REFERENCES branches(id) ON DELETE SET NULL,
  first_name    text NOT NULL,
  last_name     text NOT NULL,
  email         text UNIQUE,
  phone         text NOT NULL,
  whatsapp      text,
  password_hash text,
  national_id   text,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── 7. customers ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_code    text NOT NULL UNIQUE,
  first_name       text,
  last_name        text,
  company_name     text,
  national_id      text,
  phone            text NOT NULL,
  whatsapp         text,
  email            text,
  landmark_address text,
  physical_address text,
  gps_point        geography(Point,4326),
  notes            text,
  customer_type    text NOT NULL DEFAULT 'individual'
                        CHECK (customer_type IN ('individual','corporate')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ── 8. collection_points ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS collection_points (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            text NOT NULL,
  contact_name    text,
  phone           text,
  whatsapp        text,
  email           text,
  address         text,
  gps_point       geography(Point,4326),
  commission_rate numeric(5,2) NOT NULL DEFAULT 0,
  branch_id       uuid REFERENCES branches(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── 9. agents ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid REFERENCES users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  phone      text,
  whatsapp   text,
  email      text,
  territory  text,
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 10. vehicles ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration      text NOT NULL UNIQUE,
  type              text NOT NULL CHECK (type IN ('Motorcycle','Pickup Truck','Van','Mini Truck','Truck','Bus Partner')),
  make_model        text,
  current_driver_id uuid REFERENCES users(id) ON DELETE SET NULL,
  mileage           bigint NOT NULL DEFAULT 0,
  fuel_status       text,
  last_service_at   timestamptz,
  branch_id         uuid REFERENCES branches(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ── 11. routes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routes (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL,
  origin      text,
  destination text,
  status      text NOT NULL DEFAULT 'active',
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 12. manifests ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS manifests (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id      uuid REFERENCES routes(id) ON DELETE SET NULL,
  vehicle_id    uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  manifest_date date NOT NULL,
  status        text NOT NULL DEFAULT 'pending',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── 13. parcels ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parcels (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_number         text NOT NULL UNIQUE,
  sender_id               uuid REFERENCES customers(id) ON DELETE SET NULL,
  receiver_id             uuid REFERENCES customers(id) ON DELETE SET NULL,
  branch_id               uuid REFERENCES branches(id) ON DELETE SET NULL,
  collection_point_id     uuid REFERENCES collection_points(id) ON DELETE SET NULL,
  assigned_driver_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  route_id                uuid REFERENCES routes(id) ON DELETE SET NULL,
  manifest_id             uuid REFERENCES manifests(id) ON DELETE SET NULL,
  weight                  numeric(8,2),
  dimensions              text,
  declared_value          numeric(12,2),
  insurance_amount        numeric(12,2),
  status                  text NOT NULL DEFAULT 'Accepted',
  delivery_type           text CHECK (delivery_type IN ('home','collection_point','intercity')),
  payment_method          text CHECK (payment_method IN ('cash','ecocash','swipe','zipit','account')),
  fragile                 boolean NOT NULL DEFAULT false,
  requires_signature      boolean NOT NULL DEFAULT false,
  delivery_charge         numeric(10,2),
  delivery_zone           text,
  pickup_landmark         text,
  delivery_landmark       text,
  qr_code                 text,
  barcode                 text,
  pickup_gps              geography(Point,4326),
  delivery_gps            geography(Point,4326),
  estimated_delivery_date date,
  delivered_at            timestamptz,
  return_reason           text,
  damage_notes            text,
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- ── 14. parcel_events ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parcel_events (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id         uuid REFERENCES parcels(id) ON DELETE CASCADE,
  event_type        text NOT NULL,
  event_description text,
  user_id           uuid REFERENCES users(id) ON DELETE SET NULL,
  branch_id         uuid REFERENCES branches(id) ON DELETE SET NULL,
  device            text,
  gps_point         geography(Point,4326),
  photo_url         text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ── 15. parcel_photos ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parcel_photos (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id  uuid REFERENCES parcels(id) ON DELETE CASCADE,
  photo_type text,
  url        text NOT NULL,
  metadata   jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 16. parcel_signatures ────────────────────────────────────
CREATE TABLE IF NOT EXISTS parcel_signatures (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id     uuid REFERENCES parcels(id) ON DELETE CASCADE,
  signer_role   text,
  signer_name   text,
  signature_url text NOT NULL,
  signed_at     timestamptz NOT NULL DEFAULT now()
);

-- ── 17. parcel_scans ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parcel_scans (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id   uuid REFERENCES parcels(id) ON DELETE CASCADE,
  scan_type   text NOT NULL,
  scanned_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  location    text,
  gps_point   geography(Point,4326),
  scan_at     timestamptz NOT NULL DEFAULT now()
);

-- ── 18. parcel_otps ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parcel_otps (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id   uuid REFERENCES parcels(id) ON DELETE CASCADE,
  otp_code    text NOT NULL,
  expires_at  timestamptz NOT NULL,
  verified    boolean NOT NULL DEFAULT false,
  verified_at timestamptz
);

-- ── 19. deliveries ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deliveries (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id           uuid REFERENCES parcels(id) ON DELETE CASCADE,
  delivery_type       text NOT NULL,
  delivered_by        uuid REFERENCES users(id) ON DELETE SET NULL,
  collection_point_id uuid REFERENCES collection_points(id) ON DELETE SET NULL,
  status              text NOT NULL,
  note                text,
  delivered_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ── 20. payments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id      uuid REFERENCES parcels(id) ON DELETE SET NULL,
  amount         numeric(12,2) NOT NULL,
  payment_method text NOT NULL,
  paid_by        uuid REFERENCES customers(id) ON DELETE SET NULL,
  paid_at        timestamptz NOT NULL DEFAULT now(),
  notes          text
);

-- ── 21. expenses ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id   uuid REFERENCES branches(id) ON DELETE SET NULL,
  category    text NOT NULL,
  amount      numeric(12,2) NOT NULL,
  incurred_at timestamptz NOT NULL DEFAULT now(),
  notes       text
);

-- ── 22. commissions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commissions (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id   uuid REFERENCES agents(id) ON DELETE SET NULL,
  parcel_id  uuid REFERENCES parcels(id) ON DELETE SET NULL,
  amount     numeric(12,2) NOT NULL,
  paid       boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 23. documents ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id     uuid REFERENCES parcels(id) ON DELETE SET NULL,
  document_type text NOT NULL,
  file_url      text NOT NULL,
  metadata      jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── 24. notifications ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  channel     text NOT NULL,
  event       text NOT NULL,
  status      text NOT NULL DEFAULT 'pending',
  payload     jsonb,
  sent_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 25. custody_transfers ────────────────────────────────────
CREATE TABLE IF NOT EXISTS custody_transfers (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id         uuid NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
  from_user_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  from_location     text NOT NULL,
  from_vehicle_id   uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  from_signature    text,
  to_user_id        uuid REFERENCES users(id) ON DELETE SET NULL,
  to_location       text,
  to_vehicle_id     uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  to_signature      text,
  transfer_type     text NOT NULL DEFAULT 'driver_to_driver'
                    CHECK (transfer_type IN ('intake','branch_to_driver','driver_to_driver','driver_to_branch','branch_to_branch','last_mile','failed_return','customer_pickup')),
  parcel_condition  text DEFAULT 'good'
                    CHECK (parcel_condition IN ('good','damaged','suspected_damaged','missing_contents')),
  notes             text,
  transferred_at    timestamptz NOT NULL DEFAULT now(),
  acknowledged_at   timestamptz
);

-- ── 26. audit_logs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  action     text NOT NULL,
  ip_address text,
  device     text,
  metadata   jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_parcels_tracking    ON parcels(tracking_number);
CREATE INDEX IF NOT EXISTS idx_parcel_events_pid   ON parcel_events(parcel_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone     ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp  ON customers(whatsapp);
CREATE INDEX IF NOT EXISTS idx_parcel_otps_expires ON parcel_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_branches_gps        ON branches USING GIST (gps_point);

-- ================================================================
-- SEED DATA
-- ================================================================

-- ── Roles ────────────────────────────────────────────────────
INSERT INTO roles (name, description) VALUES
  ('super_admin',       'Master account — full system access'),
  ('admin',             'Operations manager'),
  ('franchise_owner',   'Franchise territory owner'),
  ('branch_manager',    'Branch-level manager'),
  ('shop_assistant',    'Collection point operator'),
  ('driver',            'Parcel transporter'),
  ('clerk',             'Logistics clerk'),
  ('accountant',        'Financial controller'),
  ('logistics_manager', 'Route and fleet manager'),
  ('customer',          'End customer')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- ── Permissions ──────────────────────────────────────────────
INSERT INTO permissions (name, description) VALUES
  ('create_shipment',         'Create a new shipment'),
  ('scan_parcel',             'Scan a parcel barcode'),
  ('verify_otp',              'Verify delivery OTP'),
  ('approve_manifest',        'Approve a driver manifest'),
  ('view_finances',           'View financial reports'),
  ('manage_users',            'Manage platform users'),
  ('manage_franchise',        'Manage franchise records'),
  ('assign_driver',           'Assign a driver to a manifest'),
  ('generate_report',         'Generate reports'),
  ('manage_collection_point', 'Manage collection points')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- ── Users (bcrypt cost 12 hashes) ────────────────────────────
-- super@admin.com        → Admin@2024
-- All others             → Demo@2024

INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id, is_active) VALUES
  (
    'super@admin.com',
    '$2a$12$qU34hbnEyiagRwW9xkJv.e0x78q5IYwmXjFgf1f7OSH7GtLnNzuVK',
    'Munyah','Griezmann','+263771000001',
    (SELECT id FROM roles WHERE name='super_admin'), true
  ),
  (
    'admin@Starverse.co.zw',
    '$2a$12$jyUhhR58CW516SWOs54bseSrHvI7lp5bbVAHsICFGfgMibr2cF5AS',
    'Admin','Starverse','+263771000002',
    (SELECT id FROM roles WHERE name='admin'), true
  ),
  (
    'franchise@Starverse.co.zw',
    '$2a$12$jyUhhR58CW516SWOs54bseSrHvI7lp5bbVAHsICFGfgMibr2cF5AS',
    'Franchise','Owner','+263771000003',
    (SELECT id FROM roles WHERE name='franchise_owner'), true
  ),
  (
    'manager@Starverse.co.zw',
    '$2a$12$jyUhhR58CW516SWOs54bseSrHvI7lp5bbVAHsICFGfgMibr2cF5AS',
    'Branch','Manager','+263771000004',
    (SELECT id FROM roles WHERE name='branch_manager'), true
  ),
  (
    'driver@Starverse.co.zw',
    '$2a$12$jyUhhR58CW516SWOs54bseSrHvI7lp5bbVAHsICFGfgMibr2cF5AS',
    'Tendai','Mhere','+263771000005',
    (SELECT id FROM roles WHERE name='driver'), true
  ),
  (
    'agent@Starverse.co.zw',
    '$2a$12$jyUhhR58CW516SWOs54bseSrHvI7lp5bbVAHsICFGfgMibr2cF5AS',
    'Chido','Mupfururi','+263771000006',
    (SELECT id FROM roles WHERE name='shop_assistant'), true
  ),
  (
    'clerk@Starverse.co.zw',
    '$2a$12$jyUhhR58CW516SWOs54bseSrHvI7lp5bbVAHsICFGfgMibr2cF5AS',
    'Rudo','Makoni','+263771000007',
    (SELECT id FROM roles WHERE name='clerk'), true
  ),
  (
    'accounts@Starverse.co.zw',
    '$2a$12$jyUhhR58CW516SWOs54bseSrHvI7lp5bbVAHsICFGfgMibr2cF5AS',
    'Finance','Controller','+263771000008',
    (SELECT id FROM roles WHERE name='accountant'), true
  )
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  first_name    = EXCLUDED.first_name,
  last_name     = EXCLUDED.last_name,
  role_id       = EXCLUDED.role_id,
  is_active     = true;

-- ── Verify result ─────────────────────────────────────────────
SELECT u.email, r.name AS role, u.is_active
FROM   users u
LEFT JOIN roles r ON r.id = u.role_id
ORDER BY u.created_at;
