-- Fix Group Visibility and Loan Deletion (Safer Version)

-- 1. FIX LOAN DELETION
-- Drop existing Foreign Key on transactions.loan_id using standard SQL
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_loan_id_fkey;

-- Add new Foreign Key with CASCADE DELETE
ALTER TABLE transactions
ADD CONSTRAINT transactions_loan_id_fkey
FOREIGN KEY (loan_id)
REFERENCES loans(id)
ON DELETE CASCADE;

-- Also fix repayment_schedules
ALTER TABLE repayment_schedules DROP CONSTRAINT IF EXISTS repayment_schedules_loan_id_fkey;

ALTER TABLE repayment_schedules
ADD CONSTRAINT repayment_schedules_loan_id_fkey
FOREIGN KEY (loan_id)
REFERENCES loans(id)
ON DELETE CASCADE;


-- Comprehensive RLS Fixes for Social Features

-- 1. PROFILES
DROP POLICY IF EXISTS "Users can only access their own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- 2. GROUPS
DROP POLICY IF EXISTS "Group members can view groups" ON groups;
DROP POLICY IF EXISTS "Users can manage their own groups" ON groups;
DROP POLICY IF EXISTS "Users can view groups they belong to or created" ON groups;
DROP POLICY IF EXISTS "Users can insert groups" ON groups;
DROP POLICY IF EXISTS "Creators can update their groups" ON groups;
DROP POLICY IF EXISTS "Creators can delete their groups" ON groups;

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
DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view their own or group transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;

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
DROP POLICY IF EXISTS "Users can manage their own splits" ON splits;
DROP POLICY IF EXISTS "Users can view splits on visible transactions" ON splits;

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
