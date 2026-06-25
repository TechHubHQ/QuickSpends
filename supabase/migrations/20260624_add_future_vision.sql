-- Extend savings table for Future Vision Suite
ALTER TABLE savings
  ADD COLUMN IF NOT EXISTS goal_type TEXT CHECK(goal_type IN ('emergency_fund','vehicle','property','marriage','education','investment','travel','custom')),
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS monthly_allocation REAL,
  ADD COLUMN IF NOT EXISTS cost_inflation_rate REAL,
  ADD COLUMN IF NOT EXISTS expected_return_rate REAL,
  ADD COLUMN IF NOT EXISTS is_vision_goal BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create vision_scenarios table
CREATE TABLE IF NOT EXISTS vision_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  assumptions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vision_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own vision scenarios"
  ON vision_scenarios
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_vision_scenarios_user_id ON vision_scenarios(user_id);

-- Seed default scenarios for existing users
INSERT INTO vision_scenarios (user_id, name, is_default, assumptions)
SELECT
  id as user_id,
  'Base' as name,
  TRUE as is_default,
  '{"inflation_rate":6,"investment_return":10,"savings_capacity":null,"income_growth":5,"expense_growth":3}'::jsonb as assumptions
FROM auth.users
ON CONFLICT DO NOTHING;
