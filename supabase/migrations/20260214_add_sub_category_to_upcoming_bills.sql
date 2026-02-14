-- Add sub_category_id to upcoming_bills
ALTER TABLE upcoming_bills
  ADD COLUMN IF NOT EXISTS sub_category_id UUID REFERENCES categories(id);

CREATE INDEX IF NOT EXISTS idx_upcoming_bills_sub_category_id
  ON upcoming_bills(sub_category_id);
