-- Create payment_requests table for tracking payment requests
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS payment_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_requests_tenant_id ON payment_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);

-- Enable Row Level Security
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own payment requests
CREATE POLICY "Users can view their own payment requests"
  ON payment_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own payment requests
CREATE POLICY "Users can create their own payment requests"
  ON payment_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own payment requests
CREATE POLICY "Users can update their own payment requests"
  ON payment_requests
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Public can view payment requests (for payment page)
-- Note: This allows public access to payment requests, which is needed for the /pay route
-- You may want to restrict this further based on your security requirements
CREATE POLICY "Public can view payment requests for payment page"
  ON payment_requests
  FOR SELECT
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_payment_requests_updated_at ON payment_requests;
CREATE TRIGGER update_payment_requests_updated_at
  BEFORE UPDATE ON payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_requests_updated_at();
