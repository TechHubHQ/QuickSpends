-- Add deficit_cover to plan_items source_type check constraint
ALTER TABLE plan_items DROP CONSTRAINT IF EXISTS plan_items_source_type_check;
ALTER TABLE plan_items ADD CONSTRAINT plan_items_source_type_check
  CHECK (source_type IN ('bill', 'recurring', 'loan', 'savings', 'manual', 'deficit_cover'));

-- Add cover_method column
ALTER TABLE plan_items ADD COLUMN cover_method TEXT
  CHECK (cover_method IN ('credit_card', 'loan', 'savings', 'overdraft', 'borrowed', 'other'));

-- Add reference_id column (polymorphic FK to accounts.id or loans.id)
ALTER TABLE plan_items ADD COLUMN reference_id UUID;

-- Index for reference_id lookups
CREATE INDEX idx_plan_items_reference_id ON plan_items(reference_id);
