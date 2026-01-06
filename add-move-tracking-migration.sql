-- Migration: Add move-in/move-out tracking fields to tenants table
-- Run this SQL in your Supabase SQL Editor if you already have an existing tenants table

-- Add move-in/move-out tracking columns
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS move_in_date DATE,
ADD COLUMN IF NOT EXISTS move_in_notes TEXT,
ADD COLUMN IF NOT EXISTS move_out_date DATE,
ADD COLUMN IF NOT EXISTS move_out_notes TEXT,
ADD COLUMN IF NOT EXISTS deposit_deductions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS deposit_refund_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'pending';
