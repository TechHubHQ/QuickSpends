import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Loan {
    id: string;
    user_id: string;
    name?: string;
    person_name: string;
    type: 'lent' | 'borrowed';
    total_amount: number;
    remaining_amount: number;
    interest_rate: number;
    due_date?: string;
    loan_type?: string;
    payment_type?: string;
    emi_amount?: number;
    tenure_months?: number;
    next_due_date?: string;
    interest_type?: 'yearly' | 'monthly';
    created_at: string;
    status: 'active' | 'closed';
}

export interface RepaymentSchedule {
    id: string;
    loan_id: string;
    due_date: string;
    amount: number;
    status: 'pending' | 'paid' | 'overdue';
    payment_date?: string;
    installment_number: number;
}

export const useLoans = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getLoans = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('loans')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Loan[];
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const addLoan = useCallback(async (loan: Omit<Loan, 'id' | 'remaining_amount' | 'created_at' | 'status'>, schedule?: Omit<RepaymentSchedule, 'id' | 'loan_id' | 'status'>[]) => {
        setLoading(true);
        setError(null);
        try {
            const userId = (await supabase.auth.getUser()).data.user?.id;
            if (!userId) throw new Error("User not found");

            const { data: newLoan, error: loanError } = await supabase
                .from('loans')
                .insert({
                    ...loan,
                    user_id: userId,
                    remaining_amount: loan.total_amount,
                    status: 'active'
                })
                .select()
                .single();

            if (loanError) throw loanError;

            if (schedule && schedule.length > 0) {
                const scheduleToInsert = schedule.map((s, index) => ({
                    loan_id: newLoan.id,
                    due_date: s.due_date,
                    amount: s.amount,
                    status: 'pending',
                    installment_number: index + 1
                }));

                const { error: scheduleError } = await supabase
                    .from('repayment_schedules')
                    .insert(scheduleToInsert);

                if (scheduleError) throw scheduleError;
            }
            return newLoan.id;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateLoan = useCallback(async (id: string, updates: Partial<Omit<Loan, 'id' | 'user_id' | 'created_at'>>) => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase
                .from('loans')
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

    const deleteLoan = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch linked transactions
            const { data: transactions, error: transError } = await supabase
                .from('transactions')
                .select(`
                    id, amount, type, account_id,
                    category:categories!transactions_category_id_fkey (name, parent:categories!categories_parent_id_fkey (name))
                `)
                .eq('loan_id', id);

            if (transError) throw transError;

            // 2. Revert logic (sequential for simplicity here)
            for (const txn of (transactions || [])) {
                const category = txn.category as any;
                const categoryName = category?.name;
                const parentName = category?.parent?.name;
                const isLoanRelated = categoryName === 'Loans & Debt' || parentName === 'Loans & Debt';

                if (isLoanRelated) {
                    // Revert Account Balance
                    const { data: acc } = await supabase.from('accounts').select('balance').eq('id', txn.account_id).single();
                    if (acc) {
                        const change = txn.type === 'expense' ? txn.amount : -txn.amount;
                        await supabase.from('accounts').update({ balance: acc.balance + change }).eq('id', txn.account_id);
                    }
                    // Delete transaction
                    await supabase.from('transactions').delete().eq('id', txn.id);
                } else {
                    // Just unlink
                    await supabase.from('transactions').update({ loan_id: null }).eq('id', txn.id);
                }
            }

            // 3. Delete schedules
            await supabase.from('repayment_schedules').delete().eq('loan_id', id);

            // 4. Delete loan
            const { error: loanDeleteError } = await supabase.from('loans').delete().eq('id', id);
            if (loanDeleteError) throw loanDeleteError;

            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const getLoan = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('loans')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as Loan;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const getRepaymentSchedule = useCallback(async (loanId: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('repayment_schedules')
                .select('*')
                .eq('loan_id', loanId)
                .order('installment_number', { ascending: true });

            if (error) throw error;
            return data as RepaymentSchedule[];
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        getLoans,
        getLoan,
        getRepaymentSchedule,
        addLoan,
        updateLoan,
        deleteLoan,
        loading,
        error
    };
};
