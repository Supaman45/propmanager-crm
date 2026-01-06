-- Migration: Add lease_documents column to tenants table and update existing data
-- Run this SQL in your Supabase SQL Editor if you already have an existing tenants table

-- Add lease_documents column to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS lease_documents JSONB DEFAULT '[]'::jsonb;

-- Migrate existing lease_document data to lease_documents array (if lease_document column exists)
-- This handles the case where you had a single lease_document before
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tenants' AND column_name = 'lease_document'
  ) THEN
    -- Convert single lease_document to array format
    UPDATE tenants
    SET lease_documents = CASE
      WHEN lease_document IS NOT NULL THEN jsonb_build_array(lease_document)
      ELSE '[]'::jsonb
    END
    WHERE lease_documents = '[]'::jsonb OR lease_documents IS NULL;
    
    -- Optionally drop the old column (uncomment if you want to remove it)
    -- ALTER TABLE tenants DROP COLUMN IF EXISTS lease_document;
  END IF;
END $$;
