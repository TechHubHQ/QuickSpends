import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

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
    target_date?: string;
    include_in_net_worth?: boolean;
}

export const useSavings = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getSavingsGoals = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('savings')
                .select(`
                    *,
                    category:categories!savings_category_id_fkey (name, icon, color)
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []).map(s => ({
                ...s,
                category_name: s.category?.name,
                category_icon: s.category?.icon,
                category_color: s.category?.color,
                target_date: s.target_date,
                include_in_net_worth: s.include_in_net_worth
            })) as SavingsGoal[];
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
            const { data, error } = await supabase
                .from('savings')
                .insert({
                    ...goal,
                    user_id: (await supabase.auth.getUser()).data.user?.id,
                    current_amount: 0
                })
                .select()
                .single();

            if (error) throw error;
            return data.id;
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
            const { error } = await supabase
                .from('savings')
                .update(updates)
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

    const deleteSavingsGoal = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Unlink transactions
            await supabase
                .from('transactions')
                .update({ savings_id: null })
                .eq('savings_id', id);

            // 2. Delete goal
            const { error } = await supabase
                .from('savings')
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

    const getSavingsProgress = useCallback((goal: SavingsGoal) => {
        if (goal.target_amount <= 0) return 0;
        const progress = (goal.current_amount / goal.target_amount) * 100;
        return Math.min(100, Math.max(0, progress));
    }, []);

    const getSavingsGoal = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('savings')
                .select(`
                    *,
                    category:categories!savings_category_id_fkey (name, icon, color)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            return {
                ...data,
                category_name: data.category?.name,
                category_icon: data.category?.icon,
                category_color: data.category?.color,
                target_date: data.target_date,
                include_in_net_worth: data.include_in_net_worth
            } as SavingsGoal;
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
