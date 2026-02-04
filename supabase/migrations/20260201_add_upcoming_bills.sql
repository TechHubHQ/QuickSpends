-- Add upcoming bills table
CREATE TABLE upcoming_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  category_id UUID REFERENCES categories(id),
  account_id UUID REFERENCES accounts(id),
  bill_type TEXT CHECK(bill_type IN ('transfer', 'expense')) NOT NULL DEFAULT 'expense',
  to_account_id UUID REFERENCES accounts(id), -- For credit card transfers
  due_date TIMESTAMPTZ NOT NULL,
  frequency TEXT CHECK(frequency IN ('once', 'monthly', 'quarterly', 'yearly')) NOT NULL DEFAULT 'once',
  next_due_date TIMESTAMPTZ,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  auto_pay BOOLEAN DEFAULT false,
  reminder_days INTEGER DEFAULT 3,
  last_reminder_sent TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE upcoming_bills ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage their own upcoming bills" 
ON upcoming_bills FOR ALL 
USING (user_id = auth.uid());

-- Add indexes for performance
CREATE INDEX idx_upcoming_bills_user_id ON upcoming_bills(user_id);
CREATE INDEX idx_upcoming_bills_due_date ON upcoming_bills(due_date);
CREATE INDEX idx_upcoming_bills_next_due_date ON upcoming_bills(next_due_date);