-- Migration: Add end date and net worth toggle to savings
ALTER TABLE savings
ADD COLUMN target_date TIMESTAMPTZ,
ADD COLUMN include_in_net_worth BOOLEAN DEFAULT false;
