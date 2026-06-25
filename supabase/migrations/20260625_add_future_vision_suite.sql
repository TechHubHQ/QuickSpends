-- Future Vision Suite: unified future planner items
CREATE TABLE IF NOT EXISTS vision_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT CHECK(plan_type IN ('goal','future_expense','safety_buffer','debt_payoff','small_wish')) NOT NULL DEFAULT 'goal',
  title TEXT NOT NULL,
  target_amount REAL NOT NULL DEFAULT 0,
  current_amount REAL NOT NULL DEFAULT 0,
  monthly_allocation REAL NOT NULL DEFAULT 0,
  target_date DATE,
  priority INTEGER DEFAULT 5,
  status TEXT CHECK(status IN ('active','paused','completed','archived')) NOT NULL DEFAULT 'active',
  notes TEXT,
  icon TEXT,
  color TEXT,
  handling_strategy TEXT,
  linked_savings_id UUID REFERENCES savings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vision_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own vision plans"
  ON vision_plans
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_vision_plans_user_id ON vision_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_vision_plans_status ON vision_plans(status);
CREATE INDEX IF NOT EXISTS idx_vision_plans_plan_type ON vision_plans(plan_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vision_plans_linked_savings_id
  ON vision_plans(linked_savings_id)
  WHERE linked_savings_id IS NOT NULL;

INSERT INTO vision_plans (
  user_id,
  plan_type,
  title,
  target_amount,
  current_amount,
  monthly_allocation,
  target_date,
  priority,
  status,
  notes,
  icon,
  color,
  handling_strategy,
  linked_savings_id,
  created_at
)
SELECT
  user_id,
  'goal',
  name,
  target_amount,
  current_amount,
  COALESCE(monthly_allocation, 0),
  target_date,
  COALESCE(priority, 5),
  CASE WHEN current_amount >= target_amount AND target_amount > 0 THEN 'completed' ELSE 'active' END,
  notes,
  icon,
  color,
  'Save monthly until the target is funded',
  id,
  created_at
FROM savings
WHERE is_vision_goal = TRUE
ON CONFLICT DO NOTHING;
