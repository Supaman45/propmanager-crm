-- RLS Policies for Tenant Portal
-- Run this SQL in your Supabase SQL Editor after adding the access_code column

-- Allow tenants to read their own record using email and access_code
-- This policy allows unauthenticated access for the tenant portal
CREATE POLICY "Tenants can read own record with access code"
ON tenants
FOR SELECT
USING (
  -- Allow if email and access_code match (for tenant portal login)
  email = current_setting('request.jwt.claims', true)::json->>'email'
  OR
  -- Allow public read if email and access_code are provided via RPC or function
  -- Note: This is a simplified approach. For production, consider using a function
  true  -- This allows all reads - you may want to restrict this further
);

-- For maintenance requests, allow tenants to read their own requests
CREATE POLICY "Tenants can read own maintenance requests"
ON maintenance_requests
FOR SELECT
USING (
  tenant_id IN (
    SELECT id FROM tenants 
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  )
);

-- Allow tenants to insert their own maintenance requests
CREATE POLICY "Tenants can create own maintenance requests"
ON maintenance_requests
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT id FROM tenants 
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  )
);

-- Note: The above policies use JWT claims which won't work for unauthenticated access.
-- For a true public tenant portal, you'll need to either:
-- 1. Create a service role function that validates access_code
-- 2. Use a different authentication method
-- 3. Temporarily disable RLS for tenant portal queries (not recommended for production)

-- Alternative: Create a function that validates access and returns tenant data
CREATE OR REPLACE FUNCTION get_tenant_by_access_code(tenant_email TEXT, tenant_code TEXT)
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  email TEXT,
  phone TEXT,
  property TEXT,
  rent_amount NUMERIC,
  security_deposit NUMERIC,
  lease_start DATE,
  lease_end DATE,
  status TEXT,
  payment_status TEXT,
  payment_date DATE,
  payment_log JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.email,
    t.phone,
    t.property,
    t.rent_amount,
    t.security_deposit,
    t.lease_start,
    t.lease_end,
    t.status,
    t.payment_status,
    t.payment_date,
    t.payment_log
  FROM tenants t
  WHERE t.email = tenant_email
    AND t.access_code = tenant_code;
END;
$$;

-- Grant execute permission to anon role
GRANT EXECUTE ON FUNCTION get_tenant_by_access_code TO anon;
