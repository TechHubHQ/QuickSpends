import { useCallback, useState } from "react";
import { supabase } from "../lib/supabase";

export interface RecurringConfig {
    id: string;
    user_id: string;
    account_id: string;
    category_id?: string;
    name: string;
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    total_occurrences?: number;
    execution_count?: number;
    start_date: string;
    end_date?: string;
    last_executed?: string;
    category?: {
        name: string;
        icon?: string;
        color?: string;
        parent?: {
            name: string;
        };
    };
    account?: {
        name: string;
    };
}

export const useRecurringConfigs = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getRecurringConfigs = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from("recurring_configs")
                .select(`
                    *,
                    category:categories!recurring_configs_category_id_fkey(name, icon, color, parent:parent_id(name)),
                    account:accounts!recurring_configs_account_id_fkey(name)
                `)
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            if (error) throw error;

            return data as RecurringConfig[];
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const updateRecurringConfig = useCallback(async (
        id: string,
        updates: Partial<Omit<RecurringConfig, "id" | "user_id" | "created_at" | "category" | "account">>
    ) => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase
                .from("recurring_configs")
                .update(updates)
                .eq("id", id);

            if (error) throw error;
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteRecurringConfig = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase
                .from("recurring_configs")
                .delete()
                .eq("id", id);

            if (error) throw error;
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        getRecurringConfigs,
        updateRecurringConfig,
        deleteRecurringConfig
    };
};
