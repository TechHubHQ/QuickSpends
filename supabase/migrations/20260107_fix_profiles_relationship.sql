-- 1. Backfill profiles from auth.users for any missing users
-- This ensures that all registered users have a corresponding profile
INSERT INTO public.profiles (id, email, username)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'username', SPLIT_PART(email, '@', 1)) as username
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 2. Modify group_members to reference profiles instead of auth.users
-- This allows PostgREST to properly detect the relationship for embedding

-- Add new constraint referencing profiles
DO $$
BEGIN
    -- Check if the old constraint exists and points to auth.users (we can't easily check target, but we can drop by name)
    -- We'll just drop it if it exists to be safe and recreate it pointing to profiles
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'group_members_user_id_fkey' 
        AND table_name = 'group_members'
    ) THEN
        ALTER TABLE public.group_members DROP CONSTRAINT group_members_user_id_fkey;
    END IF;

    -- Create/Recreate the constraint pointing to profiles
    ALTER TABLE public.group_members
    ADD CONSTRAINT group_members_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
END $$;

-- 3. Also fix transactions table which is often used in similar joins
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'transactions_user_id_fkey' 
        AND table_name = 'transactions'
    ) THEN
        ALTER TABLE public.transactions DROP CONSTRAINT transactions_user_id_fkey;
    END IF;

    ALTER TABLE public.transactions
    ADD CONSTRAINT transactions_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
END $$;
