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
--   super@admin.com          → Admin@2024
--   All others               → Demo@2024

INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id, is_active)
VALUES
  (
    'super@admin.com',
    '$2a$12$qU34hbnEyiagRwW9xkJv.e0x78q5IYwmXjFgf1f7OSH7GtLnNzuVK',
    'Munyah', 'Griezmann', '+263771000001',
    (SELECT id FROM roles WHERE name = 'super_admin'), true
  ),
  (
    'admin@Starverse.co.zw',
    '$2a$12$jyUhhR58CW516SWOs54bseSrHvI7lp5bbVAHsICFGfgMibr2cF5AS',
    'Admin', 'Starverse', '+263771000002',
    (SELECT id FROM roles WHERE name = 'admin'), true
  ),
  (
    'franchise@Starverse.co.zw',
    '$2a$12$jyUhhR58CW516SWOs54bseSrHvI7lp5bbVAHsICFGfgMibr2cF5AS',
    'Franchise', 'Owner', '+263771000003',
    (SELECT id FROM roles WHERE name = 'franchise_owner'), true
  ),
  (
    'manager@Starverse.co.zw',
    '$2a$12$jyUhhR58CW516SWOs54bseSrHvI7lp5bbVAHsICFGfgMibr2cF5AS',
    'Branch', 'Manager', '+263771000004',
    (SELECT id FROM roles WHERE name = 'branch_manager'), true
  ),
  (
    'driver@Starverse.co.zw',
    '$2a$12$jyUhhR58CW516SWOs54bseSrHvI7lp5bbVAHsICFGfgMibr2cF5AS',
    'Tendai', 'Mhere', '+263771000005',
    (SELECT id FROM roles WHERE name = 'driver'), true
  ),
  (
    'agent@Starverse.co.zw',
    '$2a$12$jyUhhR58CW516SWOs54bseSrHvI7lp5bbVAHsICFGfgMibr2cF5AS',
    'Chido', 'Mupfururi', '+263771000006',
    (SELECT id FROM roles WHERE name = 'shop_assistant'), true
  ),
  (
    'clerk@Starverse.co.zw',
    '$2a$12$jyUhhR58CW516SWOs54bseSrHvI7lp5bbVAHsICFGfgMibr2cF5AS',
    'Rudo', 'Makoni', '+263771000007',
    (SELECT id FROM roles WHERE name = 'clerk'), true
  ),
  (
    'accounts@Starverse.co.zw',
    '$2a$12$jyUhhR58CW516SWOs54bseSrHvI7lp5bbVAHsICFGfgMibr2cF5AS',
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
