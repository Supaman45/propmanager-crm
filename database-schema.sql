-- Supabase Database Schema for Property Manager CRM
-- Run this SQL in your Supabase SQL Editor

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  property TEXT,
  rent_amount NUMERIC(10, 2) DEFAULT 0,
  security_deposit NUMERIC(10, 2) DEFAULT 0,
  lease_start DATE,
  lease_end DATE,
  status TEXT DEFAULT 'prospect',
  payment_status TEXT DEFAULT 'n/a',
  payment_date DATE,
  payment_log JSONB DEFAULT '[]'::jsonb,
  activity_log JSONB DEFAULT '[]'::jsonb,
  audit_log JSONB DEFAULT '[]'::jsonb,
  lease_documents JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  move_in_date DATE,
  move_in_notes TEXT,
  move_out_date DATE,
  move_out_notes TEXT,
  deposit_deductions JSONB DEFAULT '[]'::jsonb,
  deposit_refund_amount NUMERIC(10, 2),
  refund_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  units INTEGER DEFAULT 0,
  type TEXT,
  occupied INTEGER DEFAULT 0,
  monthly_revenue NUMERIC(10, 2) DEFAULT 0,
  photo_url TEXT,
  expenses JSONB DEFAULT '[]'::jsonb,
  owner_name TEXT,
  owner_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create maintenance_requests table
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id BIGINT REFERENCES tenants(id) ON DELETE SET NULL,
  tenant_name TEXT,
  property TEXT,
  issue TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  date DATE DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_payment_status ON tenants(payment_status);
CREATE INDEX IF NOT EXISTS idx_tenants_lease_end ON tenants(lease_end);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_user_id ON maintenance_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_tenant_id ON maintenance_requests(tenant_id);

-- Enable Row Level Security (RLS) - adjust policies as needed
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on tenants" ON tenants;
DROP POLICY IF EXISTS "Allow all operations on properties" ON properties;
DROP POLICY IF EXISTS "Allow all operations on maintenance_requests" ON maintenance_requests;

-- Create RLS policies for user-specific data access
-- Users can only see and modify their own data
CREATE POLICY "Users can view their own tenants" ON tenants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tenants" ON tenants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tenants" ON tenants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tenants" ON tenants
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own properties" ON properties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own properties" ON properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" ON properties
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties" ON properties
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own maintenance_requests" ON maintenance_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own maintenance_requests" ON maintenance_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own maintenance_requests" ON maintenance_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own maintenance_requests" ON maintenance_requests
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_requests_updated_at
  BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
