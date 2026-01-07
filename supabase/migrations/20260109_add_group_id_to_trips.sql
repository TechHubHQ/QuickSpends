-- Migration: Add group_id to trips table
-- Date: 2026-01-09
-- Description: The application expects trips to be linked to groups via a 'group_id' column on the 'trips' table.
-- This was missing, causing errors. We are adding it and updating the RLS policy.

-- 1. Add group_id column
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

-- 2. Update RLS Policy
-- Drop the potential old policy that might have relied on a different linkage (if any specific one existed that conflicts)
DROP POLICY IF EXISTS "Users can view trips linked to their groups" ON trips;

-- Create the new policy
-- Users can view trips if:
-- a) They are the owner (already covered by "Users can manage their own trips")
-- b) The trip belongs to a group they are a member of.
CREATE POLICY "Users can view trips linked to their groups"
ON trips FOR SELECT
USING (
  group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = trips.group_id
    AND group_members.user_id = (select auth.uid())
  )
);

-- Note: We use the secure (select auth.uid()) pattern for performance and best practice.
