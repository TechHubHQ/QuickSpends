-- Migration: Add `type` column to recurring_configs
-- Adds a TEXT column restricted to ('income','expense'), populates it from categories when available,
-- sets a sensible default of 'expense' for legacy rows, adds an index for querying, and enforces NOT NULL.

BEGIN;

-- 1) Add column if it doesn't exist
ALTER TABLE IF EXISTS recurring_configs
  ADD COLUMN IF NOT EXISTS type TEXT;

-- 2) Add check constraint if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recurring_configs_type_check'
  ) THEN
    ALTER TABLE recurring_configs
      ADD CONSTRAINT recurring_configs_type_check CHECK (type IN ('income','expense'));
  END IF;
END
$$;

-- 3) Populate type from category relation where possible
UPDATE recurring_configs rc
SET type = c.type
FROM categories c
WHERE rc.category_id = c.id
  AND (rc.type IS NULL OR rc.type = '');

-- 4) For any remaining NULL/empty values, set a safe default (expense)
UPDATE recurring_configs
SET type = 'expense'
WHERE type IS NULL OR type = '';

-- 5) Set default and enforce NOT NULL to keep schema strict going forward
ALTER TABLE recurring_configs
  ALTER COLUMN type SET DEFAULT 'expense',
  ALTER COLUMN type SET NOT NULL;

-- 6) Add an index to speed up queries that filter by type
CREATE INDEX IF NOT EXISTS idx_recurring_configs_type ON recurring_configs(type);

COMMIT;
