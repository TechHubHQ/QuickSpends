-- Migration: Fix Trip Visibility for Group Members
-- Date: 2026-01-08
-- Description: Allow group members to view trips that are linked to their groups.

-- Drop existing policy if it conflicts (though we are adding a new one, getting clean state is good)
-- We are NOT dropping "Users can manage their own trips" because that is for the creator/owner.
-- We are ADDING a new policy for "viewing" via group membership.

DROP POLICY IF EXISTS "Users can view trips linked to their groups" ON trips;

CREATE POLICY "Users can view trips linked to their groups"
ON trips FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM groups
    JOIN group_members ON groups.id = group_members.group_id
    WHERE groups.trip_id = trips.id
    AND group_members.user_id = (select auth.uid())
  )
);
