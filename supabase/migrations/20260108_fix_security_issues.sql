-- Migration: Fix RLS Performance, Duplicates and Function Security
-- Date: 2026-01-08

-- 1. Fix Function Search Path (Issue 31)
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 2. Optimize RLS Policies (Performance - Replace auth.uid() with (select auth.uid()))
-- Issues 1-22

-- CATEGORIES
DROP POLICY IF EXISTS "Users can only access their own profile" ON profiles; -- Cleanup old if exists
-- Note: "Users can access default categories or their own" had duplicates. We fix duplicates AND performance here.
DROP POLICY IF EXISTS "Users can access default categories or their own" ON categories;
DROP POLICY IF EXISTS "Users can manage their own categories" ON categories;

-- Fix Duplicate: Split into pure default view vs own management
CREATE POLICY "Users can view default categories" 
ON categories FOR SELECT 
USING (user_id IS NULL);

CREATE POLICY "Users can manage their own categories" 
ON categories FOR ALL 
USING (user_id = (select auth.uid()));

-- ACCOUNTS
DROP POLICY IF EXISTS "Users can manage their own accounts" ON accounts;
CREATE POLICY "Users can manage their own accounts" 
ON accounts FOR ALL 
USING (user_id = (select auth.uid()));

-- TRIPS
DROP POLICY IF EXISTS "Users can manage their own trips" ON trips;
CREATE POLICY "Users can manage their own trips" 
ON trips FOR ALL 
USING (user_id = (select auth.uid()));

-- GROUPS
DROP POLICY IF EXISTS "Users can view groups they belong to or created" ON groups;
DROP POLICY IF EXISTS "Users can insert groups" ON groups;
DROP POLICY IF EXISTS "Creators can update their groups" ON groups;
DROP POLICY IF EXISTS "Creators can delete their groups" ON groups;

CREATE POLICY "Users can view groups they belong to or created"
ON groups FOR SELECT
USING (
  created_by = (select auth.uid()) OR
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can insert groups"
ON groups FOR INSERT
WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Creators can update their groups"
ON groups FOR UPDATE
USING (created_by = (select auth.uid()));

CREATE POLICY "Creators can delete their groups"
ON groups FOR DELETE
USING (created_by = (select auth.uid()));

-- GROUP MEMBERS
DROP POLICY IF EXISTS "Group creators and admins can add members" ON group_members;
DROP POLICY IF EXISTS "Admins can update members and users can update themselves" ON group_members;
DROP POLICY IF EXISTS "Admins can remove members and users can leave" ON group_members;
DROP POLICY IF EXISTS "Users can see group members of their groups" ON group_members;

CREATE POLICY "Users can see group members of their groups" 
ON group_members FOR SELECT 
USING (
   EXISTS (
       SELECT 1 FROM group_members gm
       WHERE gm.group_id = group_members.group_id
       AND gm.user_id = (select auth.uid())
   )
);

CREATE POLICY "Group creators and admins can add members"
ON group_members FOR INSERT
WITH CHECK (
  -- User is the creator of the group
  EXISTS (
    SELECT 1 FROM groups
    WHERE id = group_members.group_id
    AND created_by = (select auth.uid())
  )
  OR
  -- User is an admin of the group
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = (select auth.uid())
    AND gm.role = 'admin'
  )
);

CREATE POLICY "Admins can update members and users can update themselves"
ON group_members FOR UPDATE
USING (
  -- User is an admin
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = (select auth.uid())
    AND gm.role = 'admin'
  )
  OR
  -- User updating themselves
  user_id = (select auth.uid())
);

CREATE POLICY "Admins can remove members and users can leave"
ON group_members FOR DELETE
USING (
  -- User is an admin
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = (select auth.uid())
    AND gm.role = 'admin'
  )
  OR
  -- User removing themselves
  user_id = (select auth.uid())
);


-- RECURRING CONFIGS
DROP POLICY IF EXISTS "Users can manage their own recurring configs" ON recurring_configs;
CREATE POLICY "Users can manage their own recurring configs" 
ON recurring_configs FOR ALL 
USING (user_id = (select auth.uid()));

-- SAVINGS
DROP POLICY IF EXISTS "Users can manage their own savings" ON savings;
CREATE POLICY "Users can manage their own savings" 
ON savings FOR ALL 
USING (user_id = (select auth.uid()));

-- LOANS
DROP POLICY IF EXISTS "Users can manage their own loans" ON loans;
CREATE POLICY "Users can manage their own loans" 
ON loans FOR ALL 
USING (user_id = (select auth.uid()));

-- TRANSACTIONS
DROP POLICY IF EXISTS "Users can view their own or group transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;

CREATE POLICY "Users can view their own or group transactions"
ON transactions FOR SELECT
USING (
  user_id = (select auth.uid()) OR
  (group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = transactions.group_id
    AND group_members.user_id = (select auth.uid())
  ))
);

CREATE POLICY "Users can insert their own transactions"
ON transactions FOR INSERT
WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own transactions"
ON transactions FOR UPDATE
USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own transactions"
ON transactions FOR DELETE
USING (user_id = (select auth.uid()));


-- SPLITS
DROP POLICY IF EXISTS "Users can view splits on visible transactions" ON splits;
DROP POLICY IF EXISTS "Users can manage their own splits" ON splits;

-- Remove duplicate logic: Only authorize if NOT owner (owner covered by manage policy)
CREATE POLICY "Users can view splits on visible transactions"
ON splits FOR SELECT
USING (
  -- user_id = auth.uid() -- REMOVED: Covered by manage policy
  EXISTS (
    SELECT 1 FROM transactions
    WHERE transactions.id = splits.transaction_id
    AND (
      transactions.user_id = (select auth.uid()) OR
      (transactions.group_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = transactions.group_id
        AND group_members.user_id = (select auth.uid())
      ))
    )
  )
);

CREATE POLICY "Users can manage their own splits"
ON splits FOR ALL
USING (user_id = (select auth.uid()));


-- BUDGETS
DROP POLICY IF EXISTS "Users can manage their own budgets" ON budgets;
CREATE POLICY "Users can manage their own budgets" 
ON budgets FOR ALL 
USING (user_id = (select auth.uid()));

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can manage their own notifications" ON notifications;
CREATE POLICY "Users can manage their own notifications" 
ON notifications FOR ALL 
USING (user_id = (select auth.uid()));

-- REPAYMENT SCHEDULES
DROP POLICY IF EXISTS "Users can manage repayment schedules of their loans" ON repayment_schedules;
CREATE POLICY "Users can manage repayment schedules of their loans" 
ON repayment_schedules FOR ALL 
USING (
  EXISTS (SELECT 1 FROM loans WHERE loans.id = repayment_schedules.loan_id AND loans.user_id = (select auth.uid()))
);
