-- Add is_system column to tags table for system-managed tags (Need, Want, Savings)
ALTER TABLE tags ADD COLUMN is_system BOOLEAN DEFAULT FALSE NOT NULL;
