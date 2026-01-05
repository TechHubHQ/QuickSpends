import { useCallback, useState } from 'react';
import { generateUUID, getDatabase } from '../lib/database';

export interface SavingsGoal {
    id: string;
    user_id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    category_id?: string;
    created_at: string;
    category_name?: string;
    category_icon?: string;
    category_color?: string;
}

export const useSavings = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getSavingsGoals = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            const goals = await db.getAllAsync<SavingsGoal>(
                `SELECT s.*, c.name as category_name, c.icon as category_icon, c.color as category_color
                 FROM savings s
                 LEFT JOIN categories c ON s.category_id = c.id
                 WHERE s.user_id = ?
                 ORDER BY s.created_at DESC`,
                [userId]
            );
            return goals;
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const addSavingsGoal = useCallback(async (goal: Omit<SavingsGoal, 'id' | 'current_amount' | 'created_at'>) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            const id = generateUUID();
            await db.runAsync(
                `INSERT INTO savings (id, user_id, name, target_amount, current_amount, category_id) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [id, goal.user_id, goal.name, goal.target_amount, 0, goal.category_id || null]
            );
            return id;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateSavingsGoal = useCallback(async (id: string, updates: Partial<Omit<SavingsGoal, 'id' | 'user_id' | 'created_at'>>) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            const keys = Object.keys(updates);
            if (keys.length === 0) return true;

            const setClause = keys.map(k => `${k} = ?`).join(', ');
            const values = Object.values(updates);

            await db.runAsync(
                `UPDATE savings SET ${setClause} WHERE id = ?`,
                [...values, id]
            );
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteSavingsGoal = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            await db.withTransactionAsync(async () => {
                // 1. Unlink transactions
                await db.runAsync('UPDATE transactions SET savings_id = NULL WHERE savings_id = ?', [id]);
                // 2. Delete goal
                await db.runAsync('DELETE FROM savings WHERE id = ?', [id]);
            });
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const getSavingsProgress = useCallback((goal: SavingsGoal) => {
        if (goal.target_amount <= 0) return 0;
        const progress = (goal.current_amount / goal.target_amount) * 100;
        return Math.min(100, Math.max(0, progress));
    }, []);

    const getSavingsGoal = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            const goal = await db.getFirstAsync<SavingsGoal>(
                `SELECT s.*, c.name as category_name, c.icon as category_icon, c.color as category_color
                 FROM savings s
                 LEFT JOIN categories c ON s.category_id = c.id
                 WHERE s.id = ?`,
                [id]
            );
            return goal;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        getSavingsGoals,
        getSavingsGoal,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        getSavingsProgress,
        loading,
        error
    };
};
