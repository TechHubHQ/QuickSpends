export interface UserSetting {
    key: string;
    value: string;
}

export interface Account {
    id?: number;
    acct_name: string;
    bank_name: string | null;
    type: 'credit' | 'debit' | 'wallet' | 'cash';
    balance: number;
    credit_limit: number;
    created_at?: string;
}

export interface Category {
    id?: number;
    name: string;
    parent_id: number | null;
    type: 'income' | 'expense' | 'transfer';
}

export interface Transaction {
    id?: number;
    account_id: number;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    label: 'need' | 'want' | 'saving' | null;
    category_id: number | null;
    note: string | null;
    transaction_date: string; // ISO date string or YYYY-MM-DD
    created_at?: string;
}

export interface TransactionLink {
    id?: number;
    transaction_id: number;
    link_type: 'trip' | 'goal' | 'investment' | 'insurance';
    link_id: number;
    created_at?: string;
}

export interface Bill {
    id?: number;
    name: string;
    amount: number;
    category_id: number | null;
    account_id: number | null;
    due_date: string;
    is_paid: number; // 0 or 1
    transaction_id: number | null;
    created_at?: string;
}

export interface Budget {
    id?: number;
    category_id: number;
    amount: number;
    used_amount: number;
    period: 'monthly' | 'weekly';
    start_date: string | null;
    end_date: string | null;
}

export interface RecurringTransaction {
    id?: number;
    account_id: number;
    category_id: number | null;
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    next_run_date: string;
    note: string | null;
}

export interface FinancialGoal {
    id?: number;
    name: string;
    type: 'saving' | 'goal';
    target_amount: number | null;
    current_amount: number;
    linked_account_id: number | null;
    target_date: string | null;
    created_at?: string;
}

export interface Investment {
    id?: number;
    name: string;
    type: 'stock' | 'mutual_fund' | 'crypto' | 'other';
    invested_amount: number;
    current_value: number;
    created_at?: string;
}

export interface InsurancePolicy {
    id?: number;
    name: string;
    type: 'life' | 'health' | 'vehicle' | 'other';
    provider: string | null;
    premium_amount: number | null;
    payment_frequency: 'monthly' | 'quarterly' | 'yearly' | null;
    start_date: string | null;
    end_date: string | null;
    next_due_date: string | null;
    coverage_amount: number | null;
    created_at?: string;
}

export interface Trip {
    id?: number;
    name: string;
    budget: number | null;
    start_date: string | null;
    end_date: string | null;
}

export interface MonthlyPlan {
    id?: number;
    month: string; // YYYY-MM
    expected_income: number;
    income_details: string | null;
    created_at?: string;
}

export interface MonthlyPlanItem {
    id?: number;
    plan_id: number;
    type: 'expense' | 'saving' | 'investment' | 'bill';
    name: string;
    amount: number;
    category_id: number | null;
    notes: string | null;
}
