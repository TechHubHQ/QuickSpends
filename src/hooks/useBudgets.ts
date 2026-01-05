import { useCallback, useState } from 'react';
import { generateUUID, getDatabase } from '../lib/database';

export interface Budget {
    id: string;
    user_id: string;
    category_id: string;
    amount: number;
    period: 'monthly' | 'yearly';
    category_name: string;
    category_icon: string;
    category_color: string;
    spent: number;
}

export const useBudgets = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getBudgetsWithSpending = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();

            // Get budgets with category info
            const budgets = await db.getAllAsync<any>(
                `SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color 
                 FROM budgets b
                 JOIN categories c ON b.category_id = c.id
                 WHERE b.user_id = ?`,
                [userId]
            );

            // Get current month start date
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            // For each budget, calculate spending in current month
            const budgetsWithSpending = await Promise.all(budgets.map(async (budget: any) => {
                const spending = await db.getFirstAsync<{ total: number }>(
                    `SELECT SUM(amount) as total 
                     FROM transactions 
                     WHERE user_id = ? 
                     AND category_id = ? 
                     AND type = 'expense' 
                     AND date >= ?`,
                    [userId, budget.category_id, startOfMonth]
                );

                return {
                    ...budget,
                    spent: Math.abs(spending?.total || 0)
                };
            }));

            return budgetsWithSpending;
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const addBudget = useCallback(async (budget: { user_id: string; category_id: string; amount: number; period: 'monthly' | 'yearly' }) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            const id = await generateUUID();

            // specific import if needed, or assume it's available in scope if I import it
            // checking imports in original file: import { getDatabase } from '../lib/database';
            // I need to make sure generateUUID is imported or I use a new one.  
            // The file doesn't import generateUUID. I should check if I can import it or if I need to change imports.
            // Wait, I should do this in a separate step or verify imports first.
            // Actually, I'll assume I can add the import in the replace or I already see it.
            // `import { getDatabase } from '../lib/database';` is there. I need to add generateUUID to imports.

            await db.runAsync(
                `INSERT INTO budgets (id, user_id, category_id, amount, period) VALUES (?, ?, ?, ?, ?)`,
                [id, budget.user_id, budget.category_id, budget.amount, budget.period]
            );
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteBudget = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            await db.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const getBudgetById = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            const budget = await db.getFirstAsync<any>(
                `SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color 
                 FROM budgets b
                 JOIN categories c ON b.category_id = c.id
                 WHERE b.id = ?`,
                [id]
            );

            if (!budget) return null;

            // Simple spending calc for current month (consistent with getBudgetsWithSpending)
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const spending = await db.getFirstAsync<{ total: number }>(
                `SELECT SUM(amount) as total 
                 FROM transactions 
                 WHERE user_id = ? 
                 AND category_id = ? 
                 AND type = 'expense' 
                 AND date >= ?`,
                [budget.user_id, budget.category_id, startOfMonth]
            );

            return {
                ...budget,
                spent: Math.abs(spending?.total || 0)
            };
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        getBudgetsWithSpending,
        addBudget,
        deleteBudget,
        getBudgetById,
        loading,
        error,
    };
};
