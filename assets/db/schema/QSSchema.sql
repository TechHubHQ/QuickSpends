-- =========================
-- USER SETTINGS
-- =========================
CREATE TABLE
    IF NOT EXISTS user_settings (key TEXT PRIMARY KEY, value TEXT);

-- =========================
-- ACCOUNTS
-- =========================
CREATE TABLE
    IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        acct_name TEXT NOT NULL,
        bank_name TEXT,
        type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'wallet', 'cash')),
        balance REAL NOT NULL DEFAULT 0,
        credit_limit REAL NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

-- =========================
-- CATEGORIES
-- =========================
CREATE TABLE
    IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        parent_id INTEGER,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
        FOREIGN KEY (parent_id) REFERENCES categories (id)
    );

-- =========================
-- TRANSACTIONS
-- =========================
CREATE TABLE
    IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        amount REAL NOT NULL CHECK (amount >= 0),
        type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
        label TEXT CHECK (label IN ('need', 'want', 'saving')),
        category_id INTEGER,
        note TEXT,
        transaction_date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts (id),
        FOREIGN KEY (category_id) REFERENCES categories (id)
    );

-- =========================
-- TRANSACTION LINKS (Polymorphic)
-- =========================
CREATE TABLE
    IF NOT EXISTS transaction_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id INTEGER NOT NULL,
        link_type TEXT NOT NULL CHECK (
            link_type IN ('trip', 'goal', 'investment', 'insurance')
        ),
        link_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES transactions (id)
    );

-- =========================
-- BILLS (Upcoming Bills Feature)
-- =========================
CREATE TABLE
    IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        category_id INTEGER,
        account_id INTEGER,
        due_date TEXT NOT NULL,
        is_paid INTEGER DEFAULT 0,
        transaction_id INTEGER, -- link when bill is paid
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id),
        FOREIGN KEY (account_id) REFERENCES accounts (id),
        FOREIGN KEY (transaction_id) REFERENCES transactions (id)
    );

-- =========================
-- BUDGETS
-- =========================
CREATE TABLE
    IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        amount REAL NOT NULL CHECK (amount >= 0),
        used_amount REAL DEFAULT 0,
        period TEXT NOT NULL CHECK (period IN ('monthly', 'weekly')),
        start_date TEXT,
        end_date TEXT,
        FOREIGN KEY (category_id) REFERENCES categories (id)
    );

-- =========================
-- RECURRING TRANSACTIONS
-- =========================
CREATE TABLE
    IF NOT EXISTS recurring_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        category_id INTEGER,
        amount REAL NOT NULL CHECK (amount >= 0),
        frequency TEXT NOT NULL CHECK (
            frequency IN ('daily', 'weekly', 'monthly', 'yearly')
        ),
        next_run_date TEXT NOT NULL,
        note TEXT,
        FOREIGN KEY (account_id) REFERENCES accounts (id),
        FOREIGN KEY (category_id) REFERENCES categories (id)
    );

-- =========================
-- FINANCIAL GOALS (Savings + Goals)
-- =========================
CREATE TABLE
    IF NOT EXISTS financial_goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('saving', 'goal')),
        target_amount REAL,
        current_amount REAL DEFAULT 0 CHECK (current_amount >= 0),
        linked_account_id INTEGER,
        target_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (linked_account_id) REFERENCES accounts (id)
    );

-- =========================
-- INVESTMENTS
-- =========================
CREATE TABLE
    IF NOT EXISTS investments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (
            type IN ('stock', 'mutual_fund', 'crypto', 'other')
        ),
        invested_amount REAL DEFAULT 0,
        current_value REAL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

-- =========================
-- INSURANCE POLICIES
-- =========================
CREATE TABLE
    IF NOT EXISTS insurance_policies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('life', 'health', 'vehicle', 'other')),
        provider TEXT,
        premium_amount REAL,
        payment_frequency TEXT CHECK (
            payment_frequency IN ('monthly', 'quarterly', 'yearly')
        ),
        start_date TEXT,
        end_date TEXT,
        next_due_date TEXT,
        coverage_amount REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

-- =========================
-- TRIPS
-- =========================
CREATE TABLE
    IF NOT EXISTS trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        budget REAL,
        start_date TEXT,
        end_date TEXT
    );

-- =========================
-- MONTHLY FLOW (Planner Feature)
-- =========================
CREATE TABLE
    IF NOT EXISTS monthly_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT NOT NULL, -- "2026-06"
        expected_income REAL DEFAULT 0,
        income_details TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    IF NOT EXISTS monthly_plan_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (
            type IN ('expense', 'saving', 'investment', 'bill')
        ),
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        category_id INTEGER,
        notes TEXT,
        FOREIGN KEY (plan_id) REFERENCES monthly_plans (id),
        FOREIGN KEY (category_id) REFERENCES categories (id)
    );

-- =========================
-- INDEXES (Performance)
-- =========================
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions (account_id);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (transaction_date);

CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions (category_id);

CREATE INDEX IF NOT EXISTS idx_transaction_links_txn ON transaction_links (transaction_id);

CREATE INDEX IF NOT EXISTS idx_transaction_links_type ON transaction_links (link_type, link_id);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories (parent_id);

CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets (category_id);

CREATE INDEX IF NOT EXISTS idx_recurring_next_run ON recurring_transactions (next_run_date);

CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills (due_date);

CREATE INDEX IF NOT EXISTS idx_monthly_plan ON monthly_plans (month);