import { getDB } from "../../db/engine";
import { FinancialGoal } from "../types";
import { createTransaction } from "../transactions/transactions.service";

export interface GoalWithDetails extends FinancialGoal {
    linked_account_name?: string;
}

export const getGoals = async (): Promise<GoalWithDetails[]> => {
    const db = await getDB();
    return db.getAllAsync<GoalWithDetails>(`
        SELECT g.*, a.acct_name as linked_account_name
        FROM financial_goals g
        LEFT JOIN accounts a ON g.linked_account_id = a.id
        ORDER BY g.created_at DESC;
    `);
};

export const createGoal = async (goal: Omit<FinancialGoal, "id" | "current_amount" | "created_at">): Promise<number> => {
    const db = await getDB();
    const result = await db.runAsync(
        "INSERT INTO financial_goals (name, type, target_amount, current_amount, linked_account_id, target_date) VALUES (?, ?, ?, ?, ?, ?);",
        [goal.name, goal.type, goal.target_amount, 0, goal.linked_account_id, goal.target_date]
    );
    return result.lastInsertRowId;
};

export const deleteGoal = async (id: number): Promise<void> => {
    const db = await getDB();
    
    // Find linked transactions and delete links
    const links = await db.getAllAsync<{ transaction_id: number }>(
        "SELECT transaction_id FROM transaction_links WHERE link_type = 'goal' AND link_id = ?;",
        [id]
    );
    
    for (const link of links) {
        await db.runAsync("DELETE FROM transaction_links WHERE transaction_id = ?;", [link.transaction_id]);
        // We keep the actual transactions, just remove the links so history isn't lost, 
        // or we can delete transactions. Let's just remove the links to prevent referential errors.
    }
    
    await db.runAsync("DELETE FROM financial_goals WHERE id = ?;", [id]);
};

/**
 * Adds a savings contribution to a goal:
 * 1. Creates an expense/saving transaction on the source account.
 * 2. The transaction is linked to the goal.
 * 3. The transaction helper automatically increases the goal's current_amount.
 */
export const addGoalContribution = async (
    goalId: number,
    accountId: number,
    amount: number,
    date: string
): Promise<number> => {
    const goal = await getGoals().then(goals => goals.find(g => g.id === goalId));
    if (!goal) throw new Error("Goal not found.");

    return createTransaction(
        {
            account_id: accountId,
            amount: amount,
            type: "expense", // Deducted from cash/bank
            label: "saving", // Labeled as saving
            category_id: null,
            note: `Savings Deposit to Goal: ${goal.name}`,
            transaction_date: date
        },
        {
            type: "goal",
            id: goalId
        }
    );
};
