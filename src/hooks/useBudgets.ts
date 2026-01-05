import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

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
            // 1. Get budgets with category info
            const { data: budgets, error: budgetsError } = await supabase
                .from('budgets')
                .select(`
                    *,
                    category:categories!budgets_category_id_fkey (name, icon, color)
                `)
                .eq('user_id', userId);

            if (budgetsError) throw budgetsError;

            // 2. Get current month start date
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            // 3. For each budget, calculate spending
            const budgetsWithSpending = await Promise.all((budgets || []).map(async (budget: any) => {
                const { data: spendingData, error: spendingError } = await supabase
                    .from('transactions')
                    .select('amount', { count: 'exact' })
                    .eq('user_id', userId)
                    .eq('category_id', budget.category_id)
                    .eq('type', 'expense')
                    .gte('date', startOfMonth);

                if (spendingError) throw spendingError;

                const spent = (spendingData || []).reduce((sum, t) => sum + t.amount, 0);

                return {
                    ...budget,
                    category_name: budget.category?.name,
                    category_icon: budget.category?.icon,
                    category_color: budget.category?.color,
                    spent: Math.abs(spent)
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
            const { error } = await supabase
                .from('budgets')
                .insert(budget);

            if (error) throw error;
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
            const { error } = await supabase
                .from('budgets')
                .delete()
                .eq('id', id);

            if (error) throw error;
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
            const { data: budget, error: budgetError } = await supabase
                .from('budgets')
                .select(`
                    *,
                    category:categories!budgets_category_id_fkey (name, icon, color)
                `)
                .eq('id', id)
                .single();

            if (budgetError || !budget) return null;

            // Simple spending calc for current month
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const { data: spendingData, error: spendingError } = await supabase
                .from('transactions')
                .select('amount')
                .eq('user_id', budget.user_id)
                .eq('category_id', budget.category_id)
                .eq('type', 'expense')
                .gte('date', startOfMonth);

            if (spendingError) throw spendingError;

            const spent = (spendingData || []).reduce((sum, t) => sum + t.amount, 0);

            return {
                ...budget,
                category_name: budget.category?.name,
                category_icon: budget.category?.icon,
                category_color: budget.category?.color,
                spent: Math.abs(spent)
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
