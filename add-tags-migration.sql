-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(20) DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Junction table for tag assignments
CREATE TABLE IF NOT EXISTS record_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  record_type VARCHAR(20) NOT NULL,
  record_id UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_tags ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can manage own tags" ON tags;
CREATE POLICY "Users can manage own tags" ON tags
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own record_tags" ON record_tags;
CREATE POLICY "Users can manage own record_tags" ON record_tags
  FOR ALL USING (auth.uid() = added_by) WITH CHECK (auth.uid() = added_by);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_record_tags_lookup ON record_tags(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_record_tags_tag ON record_tags(tag_id);
