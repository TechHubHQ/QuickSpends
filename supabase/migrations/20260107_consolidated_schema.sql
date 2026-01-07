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
-- Enable RLS on _migrations table
DO $$
BEGIN
    ALTER TABLE IF EXISTS _migrations ENABLE ROW LEVEL SECURITY;
END $$;
-- Fix RLS policies for group_members to allow group creation and management

-- 1. INSERT Policy
-- Allow adding members if:
-- a) You are the creator of the group (checked via groups table)
-- b) You are an existing admin of the group
CREATE POLICY "Group creators and admins can add members"
ON group_members FOR INSERT
WITH CHECK (
  -- User is the creator of the group
  EXISTS (
    SELECT 1 FROM groups
    WHERE id = group_members.group_id
    AND created_by = auth.uid()
  )
  OR
  -- User is an admin of the group
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
    AND gm.role = 'admin'
  )
);

-- 2. UPDATE Policy
-- Allow updating if:
-- a) You are an admin of the group
-- b) You are updating your own record (e.g. accepting invite)
CREATE POLICY "Admins can update members and users can update themselves"
ON group_members FOR UPDATE
USING (
  -- User is an admin
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
    AND gm.role = 'admin'
  )
  OR
  -- User updating themselves
  user_id = auth.uid()
);

-- 3. DELETE Policy
-- Allow deleting if:
-- a) You are an admin of the group
-- b) You are removing yourself (leaving)
CREATE POLICY "Admins can remove members and users can leave"
ON group_members FOR DELETE
USING (
  -- User is an admin
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
    AND gm.role = 'admin'
  )
  OR
  -- User removing themselves
  user_id = auth.uid()
);
-- Fix Group Visibility and Loan Deletion

-- 1. FIX GROUP VISIBILITY
-- Add SELECT policy for groups to allow members to see them
CREATE POLICY "Group members can view groups"
ON groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
  )
);

-- 2. FIX LOAN DELETION
-- Drop existing Foreign Key on transactions.loan_id
ALTER TABLE transactions
DROP CONSTRAINT transactions_loan_id_fkey;

-- Add new Foreign Key with CASCADE DELETE
ALTER TABLE transactions
ADD CONSTRAINT transactions_loan_id_fkey
FOREIGN KEY (loan_id)
REFERENCES loans(id)
ON DELETE CASCADE;

-- Also fix repayment_schedules just in case (though usually handled by code, DB enforcement is safer)
ALTER TABLE repayment_schedules
DROP CONSTRAINT repayment_schedules_loan_id_fkey;

ALTER TABLE repayment_schedules
ADD CONSTRAINT repayment_schedules_loan_id_fkey
FOREIGN KEY (loan_id)
REFERENCES loans(id)
ON DELETE CASCADE;
-- Comprehensive RLS Fixes for Social Features

-- 1. PROFILES
-- Allow authenticated users to see other profiles (needed for group members, search, etc.)
DROP POLICY IF EXISTS "Users can only access their own profile" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- 2. GROUPS
-- Ensure creators can ALWAYS see their groups (redundant with previous fix but explicit is safer)
-- And ensure members can see groups (previous fix handled this, but we'll refine it)
DROP POLICY IF EXISTS "Group members can view groups" ON groups;
DROP POLICY IF EXISTS "Users can manage their own groups" ON groups;

CREATE POLICY "Users can view groups they belong to or created"
ON groups FOR SELECT
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert groups"
ON groups FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can update their groups"
ON groups FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Creators can delete their groups"
ON groups FOR DELETE
USING (created_by = auth.uid());


-- 3. TRANSACTIONS
-- Allow users to see transactions in groups they are part of
DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;

CREATE POLICY "Users can view their own or group transactions"
ON transactions FOR SELECT
USING (
  user_id = auth.uid() OR
  (group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = transactions.group_id
    AND group_members.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can insert their own transactions"
ON transactions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own transactions"
ON transactions FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own transactions"
ON transactions FOR DELETE
USING (user_id = auth.uid());

-- 4. SPLITS
-- Allow users to see splits for transactions they can see
DROP POLICY IF EXISTS "Users can manage their own splits" ON splits;

CREATE POLICY "Users can view splits on visible transactions"
ON splits FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM transactions
    WHERE transactions.id = splits.transaction_id
    AND (
      transactions.user_id = auth.uid() OR
      (transactions.group_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = transactions.group_id
        AND group_members.user_id = auth.uid()
      ))
    )
  )
);

CREATE POLICY "Users can manage their own splits"
ON splits FOR ALL
USING (user_id = auth.uid());
-- Seed ALL categories (Consolidated)

DO $$
DECLARE
    parent_id UUID;
BEGIN
    -- Parent: Transport
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Transport', 'car', '#1E90FF', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Fuel', 'gas-station', '#1E90FF', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Parking & Tolls', 'parking', '#1E90FF', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Maintenance & Service', 'wrench', '#1E90FF', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Public Transport', 'bus', '#1E90FF', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Taxi / Cab', 'taxi', '#1E90FF', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Car Insurance', 'file-document', '#1E90FF', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Vehicle Accessories', 'car-battery', '#1E90FF', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Car Wash', 'water-pump', '#1E90FF', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Food & Dining
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Food & Dining', 'silverware-fork-knife', '#FF9800', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Restaurants', 'silverware', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Coffee & Cafes', 'coffee', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Fast Food', 'hamburger', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Alcohol / Bars', 'glass-cocktail', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Breakfast / Brunch', 'egg-fried', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Lunch', 'food', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Dinner', 'food-turkey', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Groceries
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Groceries', 'cart-outline', '#8BC34A', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Fruits & Vegetables', 'food-apple', '#8BC34A', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Meat, Fish & Dairy', 'food-steak', '#8BC34A', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Pantry & Staples', 'shaker', '#8BC34A', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Beverages', 'cup-water', '#8BC34A', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Household Supplies', 'paper-roll', '#8BC34A', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Shopping
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Shopping', 'shopping', '#9C27B0', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Clothing', 'tshirt-crew', '#9C27B0', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Electronics', 'laptop', '#9C27B0', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Home & Garden', 'flower', '#9C27B0', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Beauty & Personal Care', 'lipstick', '#9C27B0', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Books & Stationery', 'book-open-variant', '#9C27B0', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Shoes & Accessories', 'shoe-heel', '#9C27B0', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Sports & Outdoors', 'basketball', '#9C27B0', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Utilities
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Utilities', 'flash', '#FFC107', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Electricity', 'lightning-bolt', '#FFC107', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Water', 'water', '#FFC107', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Internet', 'wifi', '#FFC107', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Mobile / Phone', 'cellphone', '#FFC107', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Gas / Heating', 'fire', '#FFC107', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Cable / TV', 'television-classic', '#FFC107', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Garbage / Recycling', 'delete', '#FFC107', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Health
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Health', 'doctor', '#4CAF50', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Doctor & Medical', 'stethoscope', '#4CAF50', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Pharmacy', 'pill', '#4CAF50', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Gym & Fitness', 'dumbbell', '#4CAF50', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Health Insurance', 'shield-plus', '#4CAF50', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Dentist', 'tooth', '#4CAF50', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Mental Health', 'brain', '#4CAF50', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Entertainment
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Entertainment', 'movie', '#E91E63', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Movies', 'filmstrip', '#E91E63', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Games', 'controller-classic', '#E91E63', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Streaming', 'youtube-tv', '#E91E63', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Concerts & Events', 'ticket', '#E91E63', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Hobbies', 'palette', '#E91E63', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Nightlife', 'music-note', '#E91E63', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Travel
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Travel', 'airplane', '#03A9F4', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Flights', 'airplane-takeoff', '#03A9F4', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Hotels', 'bed', '#03A9F4', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Car Rental', 'car-key', '#03A9F4', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Sightseeing', 'camera', '#03A9F4', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Travel Insurance', 'file-certificate', '#03A9F4', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Visa & Passport', 'passport', '#03A9F4', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Education
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Education', 'school', '#FF5722', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Tuition Fees', 'bank', '#FF5722', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Books & Supplies', 'book', '#FF5722', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Online Courses', 'laptop-account', '#FF5722', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Personal Care
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Personal Care', 'spa', '#F06292', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Hair Salon', 'scissors-cutting', '#F06292', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Spa & Massage', 'spa', '#F06292', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Cosmetics', 'lipstick', '#F06292', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Housing
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Housing', 'home', '#795548', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Rent / Mortgage', 'home-city', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Property Tax', 'file-percent', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Home Insurance', 'home-lock', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Repairs', 'hammer-wrench', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Services', 'broom', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Gifts & Donations
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Gifts & Donations', 'gift', '#E040FB', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Charity', 'heart', '#E040FB', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Birthday Gifts', 'cake', '#E040FB', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Wedding', 'ring', '#E040FB', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Holiday Gifts', 'pine-tree', '#E040FB', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Family
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Family', 'account-group', '#FF9800', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Childcare', 'baby-carriage', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Baby Supplies', 'baby-bottle', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('School Activities', 'school', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Toys', 'toy-brick', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Pets
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Pets', 'paw', '#795548', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Pet Food', 'food-drumstick', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Vet & Medical', 'medical-bag', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Grooming', 'content-cut', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Toys & Accessories', 'tennis-ball', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Transfer
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Transfer', 'bank-transfer', '#607D8B', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Self Transfer', 'bank-transfer-out', '#607D8B', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Bank Transfer', 'bank', '#607D8B', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Wallet Top-up', 'wallet-plus', '#607D8B', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Lent to Friend', 'account-arrow-right', '#607D8B', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Bills & Fees
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Bills & Fees', 'file-document-outline', '#F44336', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Credit Card Bill', 'credit-card', '#F44336', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Late Fees', 'alert-circle', '#F44336', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Bank Charges', 'bank-minus', '#F44336', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('ATM Fees', 'atm', '#F44336', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Subscription Renewal', 'autorenew', '#F44336', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Mobile Recharge', 'cellphone-wireless', '#F44336', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Taxes
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Taxes', 'file-percent', '#795548', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Income Tax', 'file-chart', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Property Tax', 'home-analytics', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Sales Tax', 'receipt', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Professional Tax', 'briefcase', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Insurance
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Insurance', 'shield-check', '#009688', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Life Insurance', 'heart-pulse', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Health Insurance', 'hospital-box', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Vehicle Insurance', 'car-info', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Home Insurance', 'home-alert', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Travel Insurance', 'airplane-check', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Business
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Business', 'domain', '#3F51B5', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Office Supplies', 'paperclip', '#3F51B5', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Software', 'microsoft-visual-studio-code', '#3F51B5', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Advertising', 'bullhorn', '#3F51B5', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Shipping', 'truck-delivery', '#3F51B5', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Business Meals', 'food-fork-drink', '#3F51B5', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Investment
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Investment', 'chart-line', '#009688', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Stocks Check', 'finance', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('SIP', 'calendar-clock', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Gold Plan', 'ring', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Mutual Funds', 'chart-pie', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Crypto Buy', 'bitcoin', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Real Estate', 'home-group', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Provident Fund', 'piggy-bank', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Subscriptions
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Subscriptions', 'autorenew', '#9E9E9E', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    -- Parent: Bill Payment
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Bill Payment', 'file-document-outline', '#607D8B', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    -- Parent: Loans & Debt
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Loans & Debt', 'handshake', '#FF5722', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Loan Disbursement', 'format-list-bulleted-type', '#FF5722', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('EMI Payment', 'calendar-clock', '#FF5722', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Debt Repayment', 'cash-check', '#FF5722', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Personal Loan', 'account-cash', '#FF5722', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Salary
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Salary', 'cash-multiple', '#4CAF50', 'income', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Full-time Pay', 'briefcase-check', '#4CAF50', 'income', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Bonus', 'star-circle', '#4CAF50', 'income', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Commission', 'percent', '#4CAF50', 'income', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Freelance
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Freelance', 'briefcase', '#00BCD4', 'income', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    -- Parent: Investments
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Investments', 'trending-up', '#3F51B5', 'income', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Dividends', 'chart-pie', '#3F51B5', 'income', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Interest', 'bank', '#3F51B5', 'income', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Stock Sales', 'finance', '#3F51B5', 'income', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Crypto', 'bitcoin', '#3F51B5', 'income', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Rental
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Rental', 'home-city', '#673AB7', 'income', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    -- Parent: Gifts
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Gifts', 'gift', '#E040FB', 'income', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    -- Parent: Other
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Other', 'dots-horizontal', '#9E9E9E', 'income', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    -- Parent: Opening Balance
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Opening Balance', 'wallet-outline', '#4CAF50', 'income', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    -- Parent: Loans & Debt (Income side?)
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Loans & Debt', 'handshake', '#FF5722', 'income', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Loan Received', 'wallet-plus', '#FF5722', 'income', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Debt Recovery', 'cash-plus', '#FF5722', 'income', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('EMI Received', 'calendar-check', '#FF5722', 'income', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

END $$;
