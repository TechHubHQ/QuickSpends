import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Settlement {
    id: string;
    user_id: string;
    name: string;
    total_amount: number;
    settled_amount: number;
    person_name: string;
    type: 'lent' | 'borrowed';
    notes?: string;
    due_date?: string;
    status: 'active' | 'closed';
    created_at: string;
}

export const useSettlements = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getSettlements = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('settlements')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Settlement[];
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getSettlement = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('settlements')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as Settlement;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const addSettlement = useCallback(async (settlement: Omit<Settlement, 'id' | 'settled_amount' | 'created_at' | 'status'>) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('settlements')
                .insert({
                    ...settlement,
                    user_id: (await supabase.auth.getUser()).data.user?.id,
                    settled_amount: 0,
                    status: 'active'
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

    const updateSettlement = useCallback(async (id: string, updates: Partial<Omit<Settlement, 'id' | 'user_id' | 'created_at'>>) => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase
                .from('settlements')
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

    const deleteSettlement = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase
                .from('settlements')
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

    const getSettlementProgress = useCallback((settlement: Settlement) => {
        if (settlement.total_amount <= 0) return 0;
        const progress = (settlement.settled_amount / settlement.total_amount) * 100;
        return Math.min(100, Math.max(0, progress));
    }, []);

    return {
        getSettlements,
        getSettlement,
        addSettlement,
        updateSettlement,
        deleteSettlement,
        getSettlementProgress,
        loading,
        error
    };
};
