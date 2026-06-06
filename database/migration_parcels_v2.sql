-- Migration: Add extended parcel columns
-- Run this in your Supabase SQL Editor to unlock full parcel functionality
-- Safe to run multiple times (uses IF NOT EXISTS / DO blocks)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parcels' AND column_name='delivery_type') THEN
    ALTER TABLE parcels ADD COLUMN delivery_type text CHECK (delivery_type IN ('home','collection_point','intercity','bike_delivery'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parcels' AND column_name='payment_method') THEN
    ALTER TABLE parcels ADD COLUMN payment_method text CHECK (payment_method IN ('cash','ecocash','swipe','zipit','account'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parcels' AND column_name='delivery_charge') THEN
    ALTER TABLE parcels ADD COLUMN delivery_charge numeric(12,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parcels' AND column_name='pickup_landmark') THEN
    ALTER TABLE parcels ADD COLUMN pickup_landmark text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parcels' AND column_name='delivery_landmark') THEN
    ALTER TABLE parcels ADD COLUMN delivery_landmark text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parcels' AND column_name='fragile') THEN
    ALTER TABLE parcels ADD COLUMN fragile boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parcels' AND column_name='requires_signature') THEN
    ALTER TABLE parcels ADD COLUMN requires_signature boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parcels' AND column_name='delivery_zone') THEN
    ALTER TABLE parcels ADD COLUMN delivery_zone text;
  END IF;
END $$;
