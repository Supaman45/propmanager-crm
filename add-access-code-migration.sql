-- Add access_code column to tenants table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS access_code TEXT;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_access_code ON tenants(access_code);

-- Generate access codes for existing tenants that don't have one
-- This uses a simple random string generator
UPDATE tenants 
SET access_code = upper(
  substr(md5(random()::text || id::text || random()::text), 1, 8)
)
WHERE access_code IS NULL OR access_code = '';
