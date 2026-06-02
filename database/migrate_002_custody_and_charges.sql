-- ================================================================
-- Migration 002: Delivery charge on parcels + Chain of Custody
-- Run in: Supabase → SQL Editor → New Query
-- ================================================================

-- ── 1. Delivery charge on parcels ────────────────────────────
ALTER TABLE parcels
  ADD COLUMN IF NOT EXISTS delivery_charge   numeric(10,2),
  ADD COLUMN IF NOT EXISTS delivery_zone     text,   -- e.g. "Avenues, Harare"
  ADD COLUMN IF NOT EXISTS pickup_landmark   text,   -- e.g. "Shell Msasa, opposite OK Food"
  ADD COLUMN IF NOT EXISTS delivery_landmark text;   -- e.g. "Green house next to Bon Marche Gwanda"

-- ── 2. Chain of Custody table ────────────────────────────────
CREATE TABLE IF NOT EXISTS custody_transfers (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id         uuid NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,

  -- Who handed over
  from_user_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  from_location     text NOT NULL,   -- local name: "Harare Branch Depot", "Roadblock - Mvurwi turnoff"
  from_vehicle_id   uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  from_signature    text,            -- base64 data-URL of signature

  -- Who received
  to_user_id        uuid REFERENCES users(id) ON DELETE SET NULL,
  to_location       text,            -- where they're taking it: "Bulawayo Main Depot"
  to_vehicle_id     uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  to_signature      text,            -- base64 data-URL of signature

  transfer_type     text NOT NULL DEFAULT 'driver_to_driver'
                    CHECK (transfer_type IN (
                      'intake',            -- first receipt at branch
                      'branch_to_driver',  -- branch loads onto vehicle
                      'driver_to_driver',  -- vehicle-to-vehicle relay
                      'driver_to_branch',  -- offload at relay branch
                      'branch_to_branch',  -- inter-branch transfer
                      'last_mile',         -- final driver taking to customer
                      'failed_return',     -- returning after failed delivery
                      'customer_pickup'    -- customer collects from point
                    )),

  parcel_condition  text DEFAULT 'good'
                    CHECK (parcel_condition IN ('good','damaged','suspected_damaged','missing_contents')),

  notes             text,
  transferred_at    timestamptz NOT NULL DEFAULT now(),
  acknowledged_at   timestamptz   -- when receiver added their signature
);

CREATE INDEX IF NOT EXISTS idx_custody_parcel_id ON custody_transfers(parcel_id);
CREATE INDEX IF NOT EXISTS idx_custody_from_user ON custody_transfers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_custody_to_user   ON custody_transfers(to_user_id);

-- ── 3. Verify ────────────────────────────────────────────────
SELECT 'custody_transfers created' AS status, count(*) FROM custody_transfers;
