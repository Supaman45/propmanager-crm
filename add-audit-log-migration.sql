-- Migration: Add audit_log column to tenants table
-- Run this SQL in your Supabase SQL Editor if you already have an existing tenants table

-- Add audit_log column to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS audit_log JSONB DEFAULT '[]'::jsonb;

-- The column will automatically be included in all future queries
-- Existing tenants will have an empty audit log array []
