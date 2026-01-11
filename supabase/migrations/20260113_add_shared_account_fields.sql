ALTER TABLE accounts
ADD COLUMN linked_account_id UUID REFERENCES accounts(id),
ADD COLUMN is_shared_limit BOOLEAN DEFAULT FALSE;

-- Add index for performance on lookups
CREATE INDEX idx_accounts_linked_account_id ON accounts(linked_account_id);
