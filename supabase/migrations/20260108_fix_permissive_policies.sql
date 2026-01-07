-- Migration: Fix Permissive Policy Warnings (Overlapping SELECTs)
-- Date: 2026-01-08

-- ==========================================
-- 1. CATEGORIES TABLE
-- ==========================================

-- Drop all existing "permissive" policies to start fresh and avoid overlaps
DROP POLICY IF EXISTS "Users can view default categories" ON categories;
DROP POLICY IF EXISTS "Users can manage their own categories" ON categories;
DROP POLICY IF EXISTS "Users can access default categories or their own" ON categories; 

-- Policy 1: Combined SELECT (View default OR Own)
-- This replaces the multiple overlapping SELECT policies
CREATE POLICY "Users can view default or own categories"
ON categories FOR SELECT
USING (
  user_id IS NULL OR 
  user_id = (select auth.uid())
);

-- Policy 2: INSERT (Own only)
CREATE POLICY "Users can insert their own categories"
ON categories FOR INSERT
WITH CHECK (user_id = (select auth.uid()));

-- Policy 3: UPDATE (Own only)
CREATE POLICY "Users can update their own categories"
ON categories FOR UPDATE
USING (user_id = (select auth.uid()));

-- Policy 4: DELETE (Own only)
CREATE POLICY "Users can delete their own categories"
ON categories FOR DELETE
USING (user_id = (select auth.uid()));


-- ==========================================
-- 2. SPLITS TABLE
-- ==========================================

-- Drop all existing "permissive" policies
DROP POLICY IF EXISTS "Users can view splits on visible transactions" ON splits;
DROP POLICY IF EXISTS "Users can manage their own splits" ON splits;

-- Policy 1: Combined SELECT (Own splits OR Splits on visible transactions)
CREATE POLICY "Users can view available splits"
ON splits FOR SELECT
USING (
  user_id = (select auth.uid()) OR
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

-- Policy 2: INSERT (Own only)
CREATE POLICY "Users can insert their own splits"
ON splits FOR INSERT
WITH CHECK (user_id = (select auth.uid()));

-- Policy 3: UPDATE (Own only)
CREATE POLICY "Users can update their own splits"
ON splits FOR UPDATE
USING (user_id = (select auth.uid()));

-- Policy 4: DELETE (Own only)
CREATE POLICY "Users can delete their own splits"
ON splits FOR DELETE
USING (user_id = (select auth.uid()));
