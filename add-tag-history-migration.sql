-- Tag history table for tracking tag additions and removals
CREATE TABLE IF NOT EXISTS tag_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  tag_name VARCHAR(50),
  record_type VARCHAR(20) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(10) NOT NULL,
  action_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action_by UUID REFERENCES auth.users(id),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE tag_history ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own tag history" ON tag_history;
CREATE POLICY "Users can view own tag history" ON tag_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tag_history_record ON tag_history(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_tag_history_tag ON tag_history(tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_history_action_at ON tag_history(action_at);
