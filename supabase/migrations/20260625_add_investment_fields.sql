-- Add investment fields to the savings table
ALTER TABLE savings ADD COLUMN IF NOT EXISTS is_investment boolean DEFAULT false;
ALTER TABLE savings ADD COLUMN IF NOT EXISTS investment_type text CHECK(
  investment_type IS NULL OR
  investment_type IN ('mutual_fund','gold','fd','stocks','ppf_epf','real_estate')
);
ALTER TABLE savings ADD COLUMN IF NOT EXISTS tenure_years numeric DEFAULT 0;

-- Update RLS policies to include new columns automatically
