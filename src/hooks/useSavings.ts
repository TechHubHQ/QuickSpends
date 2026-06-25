import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { InvestmentType, INVESTMENT_TYPE_META } from '../config/investmentTypes';

function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

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
    // Future Vision fields
    goal_type?: string;
    priority?: number;
    monthly_allocation?: number;
    cost_inflation_rate?: number;
    expected_return_rate?: number;
    is_vision_goal?: boolean;
    icon?: string;
    color?: string;
    notes?: string;
    // Investment fields
    is_investment?: boolean;
    investment_type?: string;
    tenure_years?: number;
    projected_maturity?: number;
}

/** Columns that exist in the `savings` database table (no joined/computed fields). */
export type SavingsGoalInsert = Omit<SavingsGoal, 'id' | 'current_amount' | 'created_at' | 'category_name' | 'category_icon' | 'category_color' | 'projected_maturity'>;

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

    const addSavingsGoal = useCallback(async (goal: SavingsGoalInsert, initialAmount?: number) => {
        setLoading(true);
        setError(null);
        try {
            const id = generateId();
            const { error } = await supabase
                .from('savings')
                .insert({
                    ...goal,
                    id,
                    user_id: (await supabase.auth.getUser()).data.user?.id,
                    current_amount: initialAmount ?? 0,
                });

            if (error) throw error;
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

    const calculateProjectedMaturity = useCallback((goal: SavingsGoal): number => {
        if (!goal.is_investment || !goal.investment_type) return goal.target_amount;
        const meta = INVESTMENT_TYPE_META[goal.investment_type as InvestmentType];
        if (!meta) return goal.target_amount;
        const tenure = goal.tenure_years || 0;
        if (tenure <= 0) return goal.target_amount;
        const rate = goal.expected_return_rate ?? meta.defaultReturn;
        return meta.calc({
            monthlySip: goal.monthly_allocation,
            lumpsum: undefined,
            annualContribution: goal.monthly_allocation ? goal.monthly_allocation * 12 : undefined,
            currentAmount: goal.current_amount,
            tenureYears: tenure,
            returnRate: rate,
        });
    }, []);

    return {
        getSavingsGoals,
        getSavingsGoal,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        getSavingsProgress,
        calculateProjectedMaturity,
        loading,
        error
    };
};
