-- 1. Fix Profiles RLS: Allow users to update their own profile
-- The previous migrations dropped the ALL policy and replaced it with SELECT only.

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2. Backfill/Sync avatar from auth.users metadata to profiles
-- This fixes any profiles that were updated in Settings but failed to write to profiles table due to missing RLS
UPDATE public.profiles p
SET 
  avatar = (u.raw_user_meta_data->>'avatar')
FROM auth.users u
WHERE p.id = u.id
AND p.avatar IS DISTINCT FROM (u.raw_user_meta_data->>'avatar')
AND (u.raw_user_meta_data->>'avatar') IS NOT NULL;
