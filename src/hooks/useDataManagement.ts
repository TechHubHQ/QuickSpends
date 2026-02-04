import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useState } from "react";
import { supabase } from "../lib/supabase";

export const useDataManagement = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearData = useCallback(async (userId: string, selections: {
        transactions?: boolean;
        accounts?: boolean;
        budgets?: boolean;
        savings?: boolean;
        loans?: boolean;
        trips?: boolean;
        groups?: boolean;
        preferences?: boolean;
    }) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Transactions - Should be first if others depend on it
            if (selections.transactions || selections.accounts || selections.trips || selections.groups || selections.loans || selections.savings) {
                const { error: tError } = await supabase
                    .from('transactions')
                    .delete()
                    .eq('user_id', userId);
                if (tError) throw tError;
            }

            // 2. Budgets
            if (selections.budgets) {
                const { error: bError } = await supabase
                    .from('budgets')
                    .delete()
                    .eq('user_id', userId);
                if (bError) throw bError;
            }

            // 3. Savings
            if (selections.savings) {
                const { error: sError } = await supabase
                    .from('savings')
                    .delete()
                    .eq('user_id', userId);
                if (sError) throw sError;
            }

            // 4. Loans
            if (selections.loans) {
                // Also clear repayment schedules if they exist (usually cascade)
                const { error: lError } = await supabase
                    .from('loans')
                    .delete()
                    .eq('user_id', userId);
                if (lError) throw lError;
            }

            // 5. Trips
            if (selections.trips) {
                const { error: trError } = await supabase
                    .from('trips')
                    .delete()
                    .eq('user_id', userId);
                if (trError) throw trError;
            }

            // 6. Groups (Careful with memberships)
            if (selections.groups) {
                // First clear memberships where user is part of
                const { error: gmError } = await supabase
                    .from('group_members')
                    .delete()
                    .eq('user_id', userId);
                if (gmError) throw gmError;

                // Then clear groups created by user
                const { error: gError } = await supabase
                    .from('groups')
                    .delete()
                    .eq('created_by', userId);
                if (gError) throw gError;
            }

            // 7. Accounts
            if (selections.accounts) {
                const { error: aError } = await supabase
                    .from('accounts')
                    .delete()
                    .eq('user_id', userId);
                if (aError) throw aError;
            }

            // 8. Preferences (AsyncStorage)
            if (selections.preferences) {
                const keys = await AsyncStorage.getAllKeys();
                const prefKeys = keys.filter(k => k.startsWith('qs_') || k.includes('theme') || k.includes('notification'));
                if (prefKeys.length > 0) {
                    await AsyncStorage.multiRemove(prefKeys);
                }
            }

            return true;
        } catch (err: any) {
            console.error("Error clearing data:", err);
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        clearData,
        loading,
        error
    };
};
