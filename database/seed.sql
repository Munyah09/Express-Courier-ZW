-- ============================================================
-- Starverse Express — Seed Script
-- Paste into: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. Roles ─────────────────────────────────────────────────
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

-- ── 2. Permissions ───────────────────────────────────────────
INSERT INTO permissions (name, description) VALUES
  ('create_shipment',        'Create a new shipment'),
  ('scan_parcel',            'Scan a parcel barcode'),
  ('verify_otp',             'Verify delivery OTP'),
  ('approve_manifest',       'Approve a driver manifest'),
  ('view_finances',          'View financial reports'),
  ('manage_users',           'Manage platform users'),
  ('manage_franchise',       'Manage franchise records'),
  ('assign_driver',          'Assign a driver to a manifest'),
  ('generate_report',        'Generate reports'),
  ('manage_collection_point','Manage collection points')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- ── 3. Users (passwords pre-hashed with bcrypt cost 12) ──────
-- Passwords:
--   hello@munya.co.zw       → @@Griezmann177#$
--   All @Starverse.co.zw       → Demo@1234

INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id, is_active)
VALUES
  (
    'hello@munya.co.zw',
    '$2a$12$n3E/cTW28FCttvxErUEGm.pp3KCP9hx1IQJiYd191a6u/IJXMe23W',
    'Munyaradzi', 'Muzvidziwa', '+263771000001',
    (SELECT id FROM roles WHERE name = 'super_admin'), true
  ),
  (
    'admin@Starverse.co.zw',
    '$2a$12$dM.b.UiD.ktWTCjk.aL0AeSfCvMoOT1meV8RfEndxErppRp/Ybpkm',
    'Admin', 'Starverse', '+263771000002',
    (SELECT id FROM roles WHERE name = 'admin'), true
  ),
  (
    'franchise@Starverse.co.zw',
    '$2a$12$1EzJhcYJP7FsCjKF5I67pOuosTyJe6jsvNFa4tz5UhhAt6i2za3Wa',
    'Franchise', 'Owner', '+263771000003',
    (SELECT id FROM roles WHERE name = 'franchise_owner'), true
  ),
  (
    'manager@Starverse.co.zw',
    '$2a$12$AicECnQkIYfNS5yCFdm48ejPGyipPxJSHOJS7LV7SMUp8Gbq/KUnK',
    'Branch', 'Manager', '+263771000004',
    (SELECT id FROM roles WHERE name = 'branch_manager'), true
  ),
  (
    'driver@Starverse.co.zw',
    '$2a$12$XILnPPeir99doeCBmQ8h5uBvV9uh1BSzVY.eR5CoJbUEtE7K5Z7my',
    'Tendai', 'Mhere', '+263771000005',
    (SELECT id FROM roles WHERE name = 'driver'), true
  ),
  (
    'agent@Starverse.co.zw',
    '$2a$12$B/YWkcDVvL3UqW/9reyoDuuktZXiZf.65WmYcEBhVBU8EHX6V7hvW',
    'Chido', 'Mupfururi', '+263771000006',
    (SELECT id FROM roles WHERE name = 'shop_assistant'), true
  ),
  (
    'clerk@Starverse.co.zw',
    '$2a$12$Xlfia5H8LC9ULTEtM99x9.CLNEMiF3a57GOXSsk3q5.0D1WFmfFWC',
    'Rudo', 'Makoni', '+263771000007',
    (SELECT id FROM roles WHERE name = 'clerk'), true
  ),
  (
    'accounts@Starverse.co.zw',
    '$2a$12$cyxGcch16LNuF.TDT.B9QuH..ciB1iZx1KtEGAjoAgwiCYGZChxDO',
    'Finance', 'Controller', '+263771000008',
    (SELECT id FROM roles WHERE name = 'accountant'), true
  )
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  first_name    = EXCLUDED.first_name,
  last_name     = EXCLUDED.last_name,
  role_id       = EXCLUDED.role_id,
  is_active     = true;

-- ── Verify ───────────────────────────────────────────────────
SELECT u.email, r.name AS role, u.is_active
FROM users u
LEFT JOIN roles r ON r.id = u.role_id
ORDER BY u.created_at;
