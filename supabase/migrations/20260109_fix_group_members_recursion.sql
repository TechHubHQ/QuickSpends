-- Migration: Fix Infinite Recursion in group_members RLS
-- Date: 2026-01-09
-- Description: The previous policy for "Users can see group members of their groups" caused infinite recursion
-- because it queried the 'group_members' table while evaluating permission for the 'group_members' table.
-- We fix this by moving the membership check into a SECURITY DEFINER function, which bypasses RLS for the internal query.

-- 1. Create the helper function
-- SECURITY DEFINER allows this function to run with the privileges of the creator (superuser/service_role),
-- thus bypassing the RLS recursion on group_members.
CREATE OR REPLACE FUNCTION is_group_member(_group_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Security best practice
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM group_members
    WHERE group_id = _group_id
    AND user_id = (select auth.uid())
  );
END;
$$;

-- 2. Update the recursive policy
DROP POLICY IF EXISTS "Users can see group members of their groups" ON group_members;

CREATE POLICY "Users can see group members of their groups"
ON group_members FOR SELECT
USING (
  is_group_member(group_id)
);

-- 3. Update other policies that utilized the recursive pattern if necessary
-- The implementation plan focused on this specific error.
-- We can also optimize other policies that check group membership to use this function for performance/safety,
-- but strictly speaking, only the one on `group_members` causes *recursion*.
-- For example, policies on `groups` or `transactions` checking `group_members` are fine because they are different tables.
-- However, for consistency and performance, we can leave them or update them.
-- To minimize risk of regressions, we will strictly fix the recursion error here.
