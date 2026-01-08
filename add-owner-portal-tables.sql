-- Owner Portal Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Add portal access fields to owners table
ALTER TABLE owners ADD COLUMN IF NOT EXISTS portal_email VARCHAR(255);
ALTER TABLE owners ADD COLUMN IF NOT EXISTS portal_password_hash VARCHAR(255);
ALTER TABLE owners ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT false;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS portal_token VARCHAR(255);
ALTER TABLE owners ADD COLUMN IF NOT EXISTS portal_last_login TIMESTAMP WITH TIME ZONE;

-- Create owner_properties junction table (which properties belong to which owner)
CREATE TABLE IF NOT EXISTS owner_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  property_id BIGINT REFERENCES properties(id) ON DELETE CASCADE,
  ownership_percentage DECIMAL(5,2) DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_id, property_id)
);

-- Create owner_distributions table for tracking payments to owners
CREATE TABLE IF NOT EXISTS owner_distributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  property_id BIGINT REFERENCES properties(id),
  amount DECIMAL(10,2) NOT NULL,
  period_start DATE,
  period_end DATE,
  status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE owner_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_distributions ENABLE ROW LEVEL SECURITY;

-- Policies for owner_properties
CREATE POLICY "Users can manage owner_properties" ON owner_properties
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for owner_distributions  
CREATE POLICY "Users can manage owner_distributions" ON owner_distributions
  FOR ALL USING (true) WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_owner_properties_owner_id ON owner_properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_properties_property_id ON owner_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_owner_distributions_owner_id ON owner_distributions(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_distributions_status ON owner_distributions(status);
