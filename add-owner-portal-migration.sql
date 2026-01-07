-- Owners table
CREATE TABLE IF NOT EXISTS owners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address VARCHAR(255),
  portal_enabled BOOLEAN DEFAULT false,
  portal_token UUID DEFAULT gen_random_uuid(),
  last_login TIMESTAMP WITH TIME ZONE,
  management_fee_percent DECIMAL(5,2) DEFAULT 10.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link properties to owners
ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES owners(id);

-- Owner statements table
CREATE TABLE IF NOT EXISTS owner_statements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  gross_rent DECIMAL(10,2) DEFAULT 0,
  expenses DECIMAL(10,2) DEFAULT 0,
  management_fee DECIMAL(10,2) DEFAULT 0,
  net_income DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_statements ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can manage own owners" ON owners;
CREATE POLICY "Users can manage own owners" ON owners
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own statements" ON owner_statements;
CREATE POLICY "Users can manage own statements" ON owner_statements
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_owners_user_id ON owners(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_statements_owner_id ON owner_statements(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_statements_property_id ON owner_statements(property_id);
