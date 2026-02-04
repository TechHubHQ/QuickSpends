-- Add supporting columns for custom recurring logic

ALTER TABLE recurring_configs
ADD COLUMN IF NOT EXISTS "interval" INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_occurrences INTEGER,
ADD COLUMN IF NOT EXISTS execution_count INTEGER DEFAULT 0;

-- "interval" allows "Every 2 Weeks", "Every 3 Months", etc.
-- "total_occurrences" allows "Stop after 10 payments". NULL means strictly infinite (or until end_date).
-- "execution_count" tracks how many times it has run, to compare against total_occurrences.
