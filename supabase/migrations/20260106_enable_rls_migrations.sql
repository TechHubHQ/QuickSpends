-- Enable RLS on _migrations table
DO $$
BEGIN
    ALTER TABLE IF EXISTS _migrations ENABLE ROW LEVEL SECURITY;
END $$;
