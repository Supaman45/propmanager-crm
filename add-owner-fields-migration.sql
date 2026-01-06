-- Migration: Add owner_name and owner_email columns to properties table
-- Run this SQL in your Supabase SQL Editor if you already have an existing properties table

-- Add owner fields to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS owner_email TEXT;
