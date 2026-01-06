-- SUPABASE SCHEMA FOR QUICKSPENDS MIGRATION

-- 1. Profiles Table (Extends Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  email TEXT UNIQUE,
  avatar TEXT,
  last_monthly_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE, -- NULL for default categories
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
  parent_id UUID REFERENCES categories(id),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_default_category_name_type_parent UNIQUE NULLS NOT DISTINCT (name, type, parent_id, user_id)
);


-- 3. Accounts Table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('bank', 'cash', 'card')) NOT NULL,
  card_type TEXT CHECK(card_type IN ('credit', 'debit')),
  credit_limit REAL,
  balance REAL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  account_number_last_4 TEXT,
  is_active BOOLEAN DEFAULT true,
  last_low_balance_alert TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Trips Table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  budget_amount REAL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  image_url TEXT,
  base_currency TEXT DEFAULT 'INR',
  locations TEXT,
  trip_mode TEXT CHECK(trip_mode IN ('single', 'multi')) DEFAULT 'single',
  alert_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Groups Table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_by UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES trips(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Group Members Table
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  status TEXT DEFAULT 'joined', -- 'invited', 'joined'
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Recurring Configs Table
CREATE TABLE recurring_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) NOT NULL,
  category_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  frequency TEXT CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  last_executed TIMESTAMPTZ,
  last_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Savings Table
CREATE TABLE savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL DEFAULT 0,
  category_id UUID REFERENCES categories(id),
  goal_reached_notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Loans Table
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT,
  person_name TEXT NOT NULL,
  type TEXT CHECK(type IN ('lent', 'borrowed')) NOT NULL,
  total_amount REAL NOT NULL,
  remaining_amount REAL NOT NULL,
  interest_rate REAL DEFAULT 0,
  interest_type TEXT DEFAULT 'yearly',
  due_date TIMESTAMPTZ,
  loan_type TEXT,
  payment_type TEXT,
  emi_amount REAL,
  tenure_months INTEGER,
  next_due_date TIMESTAMPTZ,
  last_reminder_date TIMESTAMPTZ,
  paid_notification_sent BOOLEAN DEFAULT false,
  status TEXT CHECK(status IN ('active', 'closed')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Transactions Table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) NOT NULL,
  category_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT,
  amount REAL NOT NULL,
  type TEXT CHECK(type IN ('income', 'expense', 'transfer')) NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  receipt_url TEXT,
  group_id UUID REFERENCES groups(id),
  trip_id UUID REFERENCES trips(id),
  recurring_id UUID REFERENCES recurring_configs(id),
  to_account_id UUID REFERENCES accounts(id),
  savings_id UUID REFERENCES savings(id),
  loan_id UUID REFERENCES loans(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Splits Table
CREATE TABLE splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  amount REAL NOT NULL,
  status TEXT CHECK(status IN ('pending', 'settled')) DEFAULT 'pending',
  alert_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Budgets Table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  amount REAL NOT NULL,
  period TEXT CHECK(period IN ('monthly', 'yearly')) DEFAULT 'monthly',
  alert_month TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Repayment Schedules Table
CREATE TABLE repayment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  amount REAL NOT NULL,
  status TEXT CHECK(status IN ('pending', 'paid', 'overdue')) DEFAULT 'pending',
  payment_date TIMESTAMPTZ,
  installment_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES (Enabling security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE repayment_schedules ENABLE ROW LEVEL SECURITY;

-- Basic policy: Users can only access their own data
CREATE POLICY "Users can only access their own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can access default categories or their own" ON categories FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Users can manage their own categories" ON categories FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own accounts" ON accounts FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own trips" ON trips FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own groups" ON groups FOR ALL USING (created_by = auth.uid());
CREATE POLICY "Users can see group members of their groups" ON group_members FOR SELECT USING (true); -- Simplified for now
CREATE POLICY "Users can manage their own recurring configs" ON recurring_configs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own savings" ON savings FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own loans" ON loans FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own transactions" ON transactions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own splits" ON splits FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own budgets" ON budgets FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own notifications" ON notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage repayment schedules of their loans" ON repayment_schedules FOR ALL USING (
  EXISTS (SELECT 1 FROM loans WHERE loans.id = repayment_schedules.loan_id AND loans.user_id = auth.uid())
);

-- AUTOMATION: Create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
