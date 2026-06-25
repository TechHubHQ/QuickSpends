-- Create tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366F1' NOT NULL,
  is_event BOOLEAN DEFAULT FALSE NOT NULL,
  event_type TEXT CHECK(event_type IN ('birthday', 'marriage', 'anniversary', 'festival', 'travel', 'other')),
  event_date TIMESTAMPTZ,
  budget REAL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Enable Row Level Security
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
CREATE POLICY "Users can manage their own tags"
  ON tags
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Link tags to transactions
ALTER TABLE transactions
  ADD COLUMN tag_id UUID REFERENCES tags(id) ON DELETE SET NULL;
