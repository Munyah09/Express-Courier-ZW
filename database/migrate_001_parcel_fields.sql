-- ================================================================
-- Migration 001: Add delivery_type, payment_method, fragile,
--                requires_signature to parcels table
-- Run in: Supabase → SQL Editor → New Query
-- ================================================================

ALTER TABLE parcels
  ADD COLUMN IF NOT EXISTS delivery_type       text CHECK (delivery_type IN ('home','collection_point','intercity')),
  ADD COLUMN IF NOT EXISTS payment_method      text CHECK (payment_method IN ('cash','ecocash','swipe','zipit','account')),
  ADD COLUMN IF NOT EXISTS fragile             boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_signature  boolean NOT NULL DEFAULT false;

-- Add index for filtering by delivery_type
CREATE INDEX IF NOT EXISTS idx_parcels_delivery_type ON parcels(delivery_type);

-- Verify
SELECT column_name, data_type, column_default
FROM   information_schema.columns
WHERE  table_name = 'parcels'
  AND  column_name IN ('delivery_type','payment_method','fragile','requires_signature');
