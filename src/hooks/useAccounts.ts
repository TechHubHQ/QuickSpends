import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Account {
    id: string;
    user_id: string;
    name: string;
    type: 'bank' | 'cash' | 'card';
    card_type?: 'credit' | 'debit';
    credit_limit?: number;
    balance: number;
    currency: string;
    account_number_last_4?: string;
    is_active: boolean;
}

export const useAccounts = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createAccount = useCallback(async (account: Omit<Account, 'id' | 'is_active'>) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Create Account
            const { data: newAccount, error: accError } = await supabase
                .from('accounts')
                .insert({
                    user_id: account.user_id,
                    name: account.name,
                    type: account.type,
                    card_type: account.card_type || null,
                    credit_limit: account.credit_limit || null,
                    balance: account.balance,
                    currency: account.currency,
                    account_number_last_4: account.account_number_last_4 || null,
                })
                .select()
                .single();

            if (accError) throw accError;

            // 2. Create Opening Balance Transaction if balance > 0
            if (account.balance > 0) {
                // Find or Create "Opening Balance" Category
                const { data: existingCategory, error: catFetchError } = await supabase
                    .from('categories')
                    .select('id')
                    .eq('name', 'Opening Balance')
                    .eq('type', 'income')
                    .single();

                let categoryId: string | null = null;
                if (existingCategory) {
                    categoryId = existingCategory.id;
                } else {
                    const { data: newCat, error: catError } = await supabase
                        .from('categories')
                        .insert({
                            name: 'Opening Balance',
                            icon: 'wallet-plus',
                            color: '#4CAF50',
                            type: 'income',
                            is_default: true
                        })
                        .select()
                        .single();

                    if (catError) throw catError;
                    categoryId = newCat.id;
                }

                const { error: transError } = await supabase
                    .from('transactions')
                    .insert({
                        user_id: account.user_id,
                        account_id: newAccount.id,
                        category_id: categoryId,
                        name: 'Opening Balance',
                        description: 'Initial account balance',
                        amount: account.balance,
                        type: 'income',
                        date: new Date().toISOString()
                    });

                if (transError) throw transError;
            }
            return newAccount.id;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const getAccountsByUser = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('accounts')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true);

            if (error) throw error;
            return data as Account[];
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const updateAccount = useCallback(async (id: string, updates: Partial<Omit<Account, 'id' | 'user_id' | 'currency' | 'is_active'>>) => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase
                .from('accounts')
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

    const deleteAccount = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase
                .from('accounts')
                .update({ is_active: false })
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

    return {
        createAccount,
        updateAccount,
        deleteAccount,
        getAccountsByUser,
        loading,
        error,
    };
};
