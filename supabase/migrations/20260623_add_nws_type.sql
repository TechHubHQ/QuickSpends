ALTER TABLE transactions ADD COLUMN nws_type TEXT CHECK(nws_type IN ('needs', 'wants', 'savings'));
CREATE INDEX idx_transactions_nws_type ON transactions(nws_type);
