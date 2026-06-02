-- PostgreSQL schema for Mufasa Express Courier logistics platform

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
  franchise_id uuid REFERENCES franchises(id),
  branch_id uuid REFERENCES branches(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE,
  phone text NOT NULL,
  whatsapp text,
  password_hash text,
  national_id text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE franchises (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  owner_name text,
  territory text,
  royalty_rate numeric(5,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE branches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_id uuid REFERENCES franchises(id) ON DELETE SET NULL,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  address text,
  gps_point geography(Point,4326),
  city text,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_code text NOT NULL UNIQUE,
  first_name text,
  last_name text,
  company_name text,
  national_id text,
  phone text NOT NULL,
  whatsapp text,
  email text,
  landmark_address text,
  physical_address text,
  gps_point geography(Point,4326),
  notes text,
  customer_type text NOT NULL CHECK (customer_type IN ('individual', 'corporate')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE collection_points (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  contact_name text,
  phone text,
  whatsapp text,
  email text,
  address text,
  gps_point geography(Point,4326),
  commission_rate numeric(5,2) NOT NULL DEFAULT 0,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  whatsapp text,
  email text,
  territory text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('Motorcycle','Pickup Truck','Van','Mini Truck','Truck','Bus Partner')),
  make_model text,
  current_driver_id uuid REFERENCES users(id) ON DELETE SET NULL,
  mileage bigint NOT NULL DEFAULT 0,
  fuel_status text,
  last_service_at timestamptz,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE routes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  origin text,
  destination text,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE manifests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id uuid REFERENCES routes(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES users(id) ON DELETE SET NULL,
  manifest_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE parcels (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_number text NOT NULL UNIQUE,
  sender_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  receiver_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  collection_point_id uuid REFERENCES collection_points(id) ON DELETE SET NULL,
  assigned_driver_id uuid REFERENCES users(id) ON DELETE SET NULL,
  route_id uuid REFERENCES routes(id) ON DELETE SET NULL,
  manifest_id uuid REFERENCES manifests(id) ON DELETE SET NULL,
  weight numeric(8,2),
  dimensions text,
  declared_value numeric(12,2),
  insurance_amount numeric(12,2),
  status text NOT NULL DEFAULT 'Accepted',
  qr_code text,
  barcode text,
  pickup_gps geography(Point,4326),
  delivery_gps geography(Point,4326),
  estimated_delivery_date date,
  delivered_at timestamptz,
  return_reason text,
  damage_notes text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE parcel_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id uuid REFERENCES parcels(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_description text,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  device text,
  gps_point geography(Point,4326),
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE parcel_photos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id uuid REFERENCES parcels(id) ON DELETE CASCADE,
  photo_type text,
  url text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE parcel_signatures (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id uuid REFERENCES parcels(id) ON DELETE CASCADE,
  signer_role text,
  signer_name text,
  signature_url text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE parcel_scans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id uuid REFERENCES parcels(id) ON DELETE CASCADE,
  scan_type text NOT NULL,
  scanned_by uuid REFERENCES users(id) ON DELETE SET NULL,
  location text,
  gps_point geography(Point,4326),
  scan_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE parcel_otps (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id uuid REFERENCES parcels(id) ON DELETE CASCADE,
  otp_code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz
);

CREATE TABLE deliveries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id uuid REFERENCES parcels(id) ON DELETE CASCADE,
  delivery_type text NOT NULL,
  delivered_by uuid REFERENCES users(id) ON DELETE SET NULL,
  collection_point_id uuid REFERENCES collection_points(id) ON DELETE SET NULL,
  status text NOT NULL,
  note text,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id uuid REFERENCES parcels(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  payment_method text NOT NULL,
  paid_by uuid REFERENCES customers(id) ON DELETE SET NULL,
  paid_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  category text NOT NULL,
  amount numeric(12,2) NOT NULL,
  incurred_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

CREATE TABLE commissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  parcel_id uuid REFERENCES parcels(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id uuid REFERENCES parcels(id) ON DELETE SET NULL,
  document_type text NOT NULL,
  file_url text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  channel text NOT NULL,
  event text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payload jsonb,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  ip_address text,
  device text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_parcels_tracking_number ON parcels(tracking_number);
CREATE INDEX idx_parcel_events_parcel_id ON parcel_events(parcel_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_whatsapp ON customers(whatsapp);
CREATE INDEX idx_branches_gps ON branches USING GIST (gps_point);
CREATE INDEX idx_parcel_otps_expires_at ON parcel_otps(expires_at);
