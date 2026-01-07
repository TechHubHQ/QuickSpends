-- Migration: Fix trip visibility for bidirectional group linking
-- Date: 2026-01-12
-- Description: Ensure trips are visible if they are linked to a group either by trips.group_id OR groups.trip_id

-- Drop the existing policy to replace it with a more comprehensive one
DROP POLICY IF EXISTS "Users can view trips linked to their groups" ON trips;

CREATE POLICY "Users can view trips linked to their groups"
ON trips FOR SELECT
USING (
  -- Case 1: Link via trips.group_id (Trip points to Group)
  (group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = trips.group_id
    AND group_members.user_id = auth.uid()
  ))
  OR
  -- Case 2: Link via groups.trip_id (Group points to Trip)
  EXISTS (
    SELECT 1 FROM groups
    JOIN group_members ON groups.id = group_members.group_id
    WHERE groups.trip_id = trips.id
    AND group_members.user_id = auth.uid()
  )
);
