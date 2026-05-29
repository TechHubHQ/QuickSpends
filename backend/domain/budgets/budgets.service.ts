import { getDB } from "../../db/engine";
import { Budget } from "../types";

export interface BudgetWithCategory extends Budget {
    category_name: string;
    category_type: string;
}

/**
 * Calculates current usage for all active budgets and updates their used_amount
 * in the database, then returns the updated list.
 */
export const getBudgets = async (): Promise<BudgetWithCategory[]> => {
    const db = await getDB();
    
    // First, let's recalculate the budget usages dynamically based on transactions!
    // We assume 'monthly' budgets track transactions in the current month (YYYY-MM).
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const currentMonthPrefix = `${year}-${month}%`; // Matches "2026-05%"
    
    // Fetch all budgets
    const budgets = await db.getAllAsync<Budget>("SELECT * FROM budgets;");
    
    for (const budget of budgets) {
        if (!budget.id) continue;
        
        // Sum expenses in this budget's category in the current month
        const sumResult = await db.getFirstAsync<{ total: number }>(
            `SELECT SUM(amount) as total 
             FROM transactions 
             WHERE category_id = ? 
               AND type = 'expense'
               AND transaction_date LIKE ?;`,
            [budget.category_id, currentMonthPrefix]
        );
        
        const actualSpent = sumResult?.total || 0;
        
        // Update the budget's used_amount
        await db.runAsync(
            "UPDATE budgets SET used_amount = ? WHERE id = ?;",
            [actualSpent, budget.id]
        );
    }
    
    // Fetch and return the fully populated list of budgets joined with categories
    return db.getAllAsync<BudgetWithCategory>(`
        SELECT b.*, c.name as category_name, c.type as category_type
        FROM budgets b
        INNER JOIN categories c ON b.category_id = c.id
        ORDER BY b.amount DESC;
    `);
};

export const createBudget = async (budget: Omit<Budget, "id" | "used_amount">): Promise<number> => {
    const db = await getDB();
    const result = await db.runAsync(
        "INSERT INTO budgets (category_id, amount, used_amount, period, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?);",
        [budget.category_id, budget.amount, 0, budget.period, budget.start_date, budget.end_date]
    );
    return result.lastInsertRowId;
};

export const updateBudget = async (budget: Budget): Promise<void> => {
    if (!budget.id) throw new Error("Budget ID is required for update.");
    const db = await getDB();
    await db.runAsync(
        "UPDATE budgets SET category_id = ?, amount = ?, period = ?, start_date = ?, end_date = ? WHERE id = ?;",
        [budget.category_id, budget.amount, budget.period, budget.start_date, budget.end_date, budget.id]
    );
};

export const deleteBudget = async (id: number): Promise<void> => {
    const db = await getDB();
    await db.runAsync("DELETE FROM budgets WHERE id = ?;", [id]);
};
