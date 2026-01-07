-- Migration: Fix trip visibility using SECURITY DEFINER function
-- Date: 2026-01-12
-- Description: Use a security definer function to check trip visibility to bypass RLS complexity on joined tables.

-- 1. Create the helper function
CREATE OR REPLACE FUNCTION public.can_view_trip(_trip_id UUID, _trip_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Check if the trip is linked to a group the user is in (trips.group_id)
  IF _trip_group_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = _trip_group_id 
      AND user_id = auth.uid()
    ) THEN
      RETURN TRUE;
    END IF;
  END IF;

  -- 2. Check if a group links to this trip and user is in it (groups.trip_id)
  -- Note: We access groups and group_members with no RLS check (SECURITY DEFINER)
  IF EXISTS (
    SELECT 1 FROM groups g
    JOIN group_members gm ON g.id = gm.group_id
    WHERE g.trip_id = _trip_id
    AND gm.user_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update the RLS Policy
DROP POLICY IF EXISTS "Users can view trips linked to their groups" ON trips;

CREATE POLICY "Users can view trips linked to their groups"
ON trips FOR SELECT
USING (
  public.can_view_trip(id, group_id)
);
