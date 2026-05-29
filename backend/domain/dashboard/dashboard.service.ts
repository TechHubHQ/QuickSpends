import { getDB } from "../../db/engine";

export interface DashboardSummary {
    netWorth: number;
    totalAssets: number;
    totalDebts: number;
    monthlyIncome: number;
    monthlyExpense: number;
    recentTransactions: any[];
    categorySpend: { categoryId: number; name: string; amount: number; percentage: number }[];
    budgetSummary: { totalBudgeted: number; totalSpent: number; percentUsed: number };
}

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
    const db = await getDB();
    
    // 1. Calculate Net Worth
    const accounts = await db.getAllAsync<{ type: string; balance: number }>(
        "SELECT type, balance FROM accounts;"
    );
    let totalAssets = 0;
    let totalDebts = 0;
    for (const acct of accounts) {
        if (acct.type === "credit") {
            // For credit accounts, the balance is outstanding debt
            totalDebts += acct.balance;
        } else {
            totalAssets += acct.balance;
        }
    }
    const netWorth = totalAssets - totalDebts;

    // 2. Calculate Monthly Cash Flow (Income vs Expense)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const currentMonthPrefix = `${year}-${month}%`; // Matches "YYYY-MM%"

    const cashFlow = await db.getAllAsync<{ type: string; total: number }>(
        `SELECT type, SUM(amount) as total 
         FROM transactions 
         WHERE transaction_date LIKE ? 
         GROUP BY type;`,
        [currentMonthPrefix]
    );

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    for (const flow of cashFlow) {
        if (flow.type === "income") {
            monthlyIncome = flow.total;
        } else if (flow.type === "expense") {
            monthlyExpense = flow.total;
        }
    }

    // 3. Category Spend Breakdown (for current month)
    const categorySpendData = await db.getAllAsync<{ category_id: number; name: string; total: number }>(
        `SELECT t.category_id, c.name, SUM(t.amount) as total 
         FROM transactions t
         INNER JOIN categories c ON t.category_id = c.id
         WHERE t.type = 'expense' AND t.transaction_date LIKE ?
         GROUP BY t.category_id, c.name
         ORDER BY total DESC;`,
        [currentMonthPrefix]
    );

    const totalCategorySpend = categorySpendData.reduce((sum, item) => sum + item.total, 0);
    const categorySpend = categorySpendData.map(item => ({
        categoryId: item.category_id,
        name: item.name,
        amount: item.total,
        percentage: totalCategorySpend > 0 ? Math.round((item.total / totalCategorySpend) * 100) : 0
    }));

    // 4. Budget Summary (recalculated)
    const budgets = await db.getAllAsync<{ amount: number; used_amount: number }>(
        "SELECT amount, used_amount FROM budgets;"
    );
    let totalBudgeted = 0;
    let totalSpent = 0;
    for (const b of budgets) {
        totalBudgeted += b.amount;
        totalSpent += b.used_amount;
    }
    const percentUsed = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

    // 5. Recent Transactions (last 5)
    const recentTransactions = await db.getAllAsync<any>(
        `SELECT t.*, c.name as category_name, a.acct_name as account_name
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         LEFT JOIN accounts a ON t.account_id = a.id
         ORDER BY t.transaction_date DESC, t.id DESC 
         LIMIT 5;`
    );

    return {
        netWorth,
        totalAssets,
        totalDebts,
        monthlyIncome,
        monthlyExpense,
        recentTransactions,
        categorySpend,
        budgetSummary: {
            totalBudgeted,
            totalSpent,
            percentUsed
        }
    };
};
