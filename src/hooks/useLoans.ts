import { useCallback, useState } from 'react';
import { generateUUID, getDatabase } from '../lib/database';

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
            const db = await getDatabase();
            const loans = await db.getAllAsync<Loan>(
                `SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC`,
                [userId]
            );
            return loans;
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
            const db = await getDatabase();
            const id = generateUUID();
            await db.runAsync(
                `INSERT INTO loans (id, user_id, name, person_name, type, total_amount, remaining_amount, interest_rate, due_date, loan_type, payment_type, emi_amount, tenure_months, next_due_date, interest_type, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    loan.user_id,
                    loan.name || null,
                    loan.person_name,
                    loan.type,
                    loan.total_amount,
                    loan.total_amount,
                    loan.interest_rate || 0,
                    loan.due_date || null,
                    loan.loan_type || null,
                    loan.payment_type || null,
                    loan.emi_amount || null,
                    loan.tenure_months || null,
                    loan.next_due_date || null,
                    loan.interest_type || 'yearly',
                    'active'
                ]
            );

            if (schedule && schedule.length > 0) {
                const schedulePlaceholders = schedule.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
                const scheduleValues: any[] = [];

                schedule.forEach((s, index) => {
                    scheduleValues.push(
                        generateUUID(),
                        id,
                        s.due_date,
                        s.amount,
                        'pending',
                        index + 1
                    );
                });

                await db.runAsync(
                    `INSERT INTO repayment_schedules (id, loan_id, due_date, amount, status, installment_number) VALUES ${schedulePlaceholders}`,
                    scheduleValues
                );
            }
            return id;
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
            const db = await getDatabase();
            const keys = Object.keys(updates);
            if (keys.length === 0) return true;

            const setClause = keys.map(k => `${k} = ?`).join(', ');
            const values = Object.values(updates);

            await db.runAsync(
                `UPDATE loans SET ${setClause} WHERE id = ?`,
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

    const deleteLoan = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            await db.withTransactionAsync(async () => {
                // Fetch linked transactions with category info
                const transactions = await db.getAllAsync<{
                    id: string,
                    amount: number,
                    type: 'income' | 'expense' | 'transfer',
                    account_id: string,
                    category_name: string | null,
                    parent_category_name: string | null
                }>(
                    `SELECT t.id, t.amount, t.type, t.account_id, c.name as category_name, p.name as parent_category_name 
                     FROM transactions t 
                     LEFT JOIN categories c ON t.category_id = c.id
                     LEFT JOIN categories p ON c.parent_id = p.id
                     WHERE t.loan_id = ?`,
                    [id]
                );

                for (const txn of transactions) {
                    const isLoanRelated = txn.category_name === 'Loans & Debt' || txn.parent_category_name === 'Loans & Debt';

                    if (isLoanRelated) {
                        // Revert Account Balance related to this transaction
                        if (txn.type === 'expense') {
                            // Was: -Balance -> Revert: +Balance
                            await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [txn.amount, txn.account_id]);
                        } else if (txn.type === 'income') {
                            // Was: +Balance -> Revert: -Balance
                            await db.runAsync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [txn.amount, txn.account_id]);
                        }

                        // Permanently delete loan-specific transactions (Disbursements, Repayments)
                        await db.runAsync('DELETE FROM transactions WHERE id = ?', [txn.id]);
                    } else {
                        // For converted transactions (e.g. Credit Card expenses), just unlink them
                        // so they remain as normal expenses
                        await db.runAsync('UPDATE transactions SET loan_id = NULL WHERE id = ?', [txn.id]);
                    }
                }

                await db.runAsync('DELETE FROM loans WHERE id = ?', [id]);
            });
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
            const db = await getDatabase();
            const loan = await db.getFirstAsync<Loan>(
                `SELECT * FROM loans WHERE id = ?`,
                [id]
            );
            return loan;
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
            const db = await getDatabase();
            const schedule = await db.getAllAsync<RepaymentSchedule>(
                `SELECT * FROM repayment_schedules WHERE loan_id = ? ORDER BY installment_number ASC`,
                [loanId]
            );
            return schedule;
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
