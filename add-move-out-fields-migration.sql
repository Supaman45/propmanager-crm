-- Add move-out related columns to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS move_out_date DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS move_out_reason VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS move_out_notes TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS forwarding_address TEXT;

-- Note: deposit_deductions and deposit_refund_amount already exist in the schema
-- If they don't exist, uncomment these lines:
-- ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deposit_deductions JSONB DEFAULT '[]';
-- ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deposit_refund_amount DECIMAL(10,2);
-- ALTER TABLE tenants ADD COLUMN IF NOT EXISTS refund_status VARCHAR(20) DEFAULT 'pending';
