-- Migration: Add Indexes for Performance
-- Date: 2026-01-08

-- ==========================================
-- 1. FOREIGN KEY INDEXES (Required for RLS & Joins)
-- ==========================================

-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Accounts
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- Trips
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);

-- Groups
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_trip_id ON groups(trip_id);

-- Group Members
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- Recurring Configs
CREATE INDEX IF NOT EXISTS idx_recurring_configs_user_id ON recurring_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_configs_account_id ON recurring_configs(account_id);
CREATE INDEX IF NOT EXISTS idx_recurring_configs_category_id ON recurring_configs(category_id);

-- Savings
CREATE INDEX IF NOT EXISTS idx_savings_user_id ON savings(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_category_id ON savings(category_id);

-- Loans
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);

-- Transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_group_id ON transactions(group_id);
CREATE INDEX IF NOT EXISTS idx_transactions_trip_id ON transactions(trip_id);
CREATE INDEX IF NOT EXISTS idx_transactions_recurring_id ON transactions(recurring_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account_id ON transactions(to_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_savings_id ON transactions(savings_id);
CREATE INDEX IF NOT EXISTS idx_transactions_loan_id ON transactions(loan_id);

-- Splits
CREATE INDEX IF NOT EXISTS idx_splits_transaction_id ON splits(transaction_id);
CREATE INDEX IF NOT EXISTS idx_splits_user_id ON splits(user_id);

-- Budgets
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Repayment Schedules
CREATE INDEX IF NOT EXISTS idx_repayment_schedules_loan_id ON repayment_schedules(loan_id);


-- ==========================================
-- 2. FILTERING & SORTING INDEXES
-- ==========================================

-- Transactions: Often filtered by date (timeline) and type
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Notifications: Often ordered by creation date (newest first)
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Trips: By start date
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON trips(start_date DESC);

-- Accounts: By is_active
CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON accounts(is_active);

