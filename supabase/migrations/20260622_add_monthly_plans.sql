-- Create monthly_plans table
CREATE TABLE monthly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL,
  notes TEXT,
  is_locked BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Create plan_items table
CREATE TABLE plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES monthly_plans(id) ON DELETE CASCADE NOT NULL,
  source_type TEXT CHECK(source_type IN ('bill', 'recurring', 'loan', 'savings', 'manual')) NOT NULL DEFAULT 'manual',
  source_id UUID,
  label TEXT NOT NULL,
  type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
  amount REAL NOT NULL,
  category_id UUID REFERENCES categories(id),
  due_date DATE,
  status TEXT CHECK(status IN ('pending', 'settled', 'paid')) NOT NULL DEFAULT 'pending',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE monthly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monthly_plans
CREATE POLICY "Users can manage their own monthly plans"
  ON monthly_plans
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for plan_items (via plan ownership)
CREATE POLICY "Users can manage plan items of their own plans"
  ON plan_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM monthly_plans
      WHERE monthly_plans.id = plan_items.plan_id
        AND monthly_plans.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM monthly_plans
      WHERE monthly_plans.id = plan_items.plan_id
        AND monthly_plans.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_monthly_plans_user_id ON monthly_plans(user_id);
CREATE INDEX idx_monthly_plans_month ON monthly_plans(month);
CREATE INDEX idx_plan_items_plan_id ON plan_items(plan_id);
CREATE INDEX idx_plan_items_source ON plan_items(source_type, source_id);
