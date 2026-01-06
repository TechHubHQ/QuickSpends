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
