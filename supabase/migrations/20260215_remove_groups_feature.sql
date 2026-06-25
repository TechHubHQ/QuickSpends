-- Remove group expense sharing and group-based split settlements.

DROP POLICY IF EXISTS "Users can view trips linked to their groups" ON trips;
DROP FUNCTION IF EXISTS public.can_view_trip(UUID, UUID);

DROP POLICY IF EXISTS "Users can view their own or group transactions" ON transactions;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;

CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
CREATE POLICY "Users can insert their own transactions"
ON transactions FOR INSERT
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
CREATE POLICY "Users can update their own transactions"
ON transactions FOR UPDATE
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;
CREATE POLICY "Users can delete their own transactions"
ON transactions FOR DELETE
USING (user_id = (select auth.uid()));

DROP TABLE IF EXISTS splits CASCADE;

DROP POLICY IF EXISTS "Users can see group members of their groups" ON group_members;
DROP POLICY IF EXISTS "Group creators and admins can add members" ON group_members;
DROP POLICY IF EXISTS "Admins can update members and users can update themselves" ON group_members;
DROP POLICY IF EXISTS "Admins can remove members and users can leave" ON group_members;
DROP FUNCTION IF EXISTS public.is_group_member(UUID);
DROP TABLE IF EXISTS group_members CASCADE;

DROP POLICY IF EXISTS "Group members can view groups" ON groups;
DROP POLICY IF EXISTS "Users can manage their own groups" ON groups;
DROP POLICY IF EXISTS "Users can view groups they belong to or created" ON groups;
DROP POLICY IF EXISTS "Users can insert groups" ON groups;
DROP POLICY IF EXISTS "Creators can update their groups" ON groups;
DROP POLICY IF EXISTS "Creators can delete their groups" ON groups;
DROP TABLE IF EXISTS groups CASCADE;

ALTER TABLE transactions DROP COLUMN IF EXISTS group_id;
ALTER TABLE trips DROP COLUMN IF EXISTS group_id;
