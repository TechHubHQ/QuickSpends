-- Migration: Fix Notifications RLS to allow User-to-User Invites
-- Date: 2026-01-10
-- Description: Splits the notification policies to allow authenticated users to insert notifications for other users (needed for invites),
-- while maintaining strict privacy for SELECT, UPDATE, and DELETE (users can only manage their own).

-- 1. Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can manage their own notifications" ON notifications;

-- 2. CREATE GRANULAR POLICIES

-- SELECT: Users can ONLY see their own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

-- INSERT: Authenticated users can insert notifications (e.g. invites)
-- We check that the user is authenticated. 
-- Note: This allows any authenticated user to send a notification to anyone. 
-- This is necessary for the invite system to work from the client side.
CREATE POLICY "Users can insert notifications"
ON notifications FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: Users can ONLY update their own notifications (e.g. mark as read)
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- DELETE: Users can ONLY delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE
USING (user_id = auth.uid());
