-- Comprehensive RLS Fixes for Social Features

-- 1. PROFILES
-- Allow authenticated users to see other profiles (needed for group members, search, etc.)
DROP POLICY IF EXISTS "Users can only access their own profile" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- 2. GROUPS
-- Ensure creators can ALWAYS see their groups (redundant with previous fix but explicit is safer)
-- And ensure members can see groups (previous fix handled this, but we'll refine it)
DROP POLICY IF EXISTS "Group members can view groups" ON groups;
DROP POLICY IF EXISTS "Users can manage their own groups" ON groups;

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
-- Allow users to see transactions in groups they are part of
DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;

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
-- Allow users to see splits for transactions they can see
DROP POLICY IF EXISTS "Users can manage their own splits" ON splits;

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
