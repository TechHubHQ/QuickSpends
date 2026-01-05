import { useCallback, useState } from 'react';
import { generateUUID, getDatabase } from '../lib/database';

export interface Transaction {
    id: string;
    user_id: string;
    account_id: string;
    category_id?: string;
    name: string;
    description?: string;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    date: string;
    category_name?: string;
    category_icon?: string;
    category_color?: string;
    account_name?: string;
    trip_name?: string;
    group_name?: string;
    recurring_frequency?: string;
    group_id?: string;
    trip_id?: string;
    recurring_id?: string;
    to_account_id?: string;
    receipt_url?: string;
    is_split?: boolean;
}

export const useTransactions = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getBalanceTrend = useCallback(async (userId: string, currentBalance: number) => {
        try {
            const db = await getDatabase();
            const now = new Date();
            const date = new Date();
            date.setDate(date.getDate() - 30);
            const thirtyDaysAgo = date.toISOString().split('T')[0];

            const result = await db.getFirstAsync<{ net_change: number }>(
                `SELECT SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END) as net_change 
                 FROM transactions 
                 WHERE user_id = ? AND date >= ?`,
                [userId, thirtyDaysAgo]
            );



            const netChange = result?.net_change || 0;
            const previousBalance = currentBalance - netChange;

            // Trend Logic:
            // If Net Change is positive, Trend is UP (Green).
            // If Net Change is negative, Trend is DOWN (Red).

            const trend = netChange >= 0 ? 'up' as const : 'down' as const;

            let percentage = 0;
            if (previousBalance !== 0) {
                // Formula: (Change / |Previous|) * 100
                percentage = (netChange / Math.abs(previousBalance)) * 100;
            } else if (netChange !== 0) {
                // Previous 0, Current != 0 -> 100% growth/loss
                percentage = 100;
            }

            return {
                percentage: parseFloat(Math.abs(percentage).toFixed(1)),
                trend: trend
            };
        } catch (err) {
            console.error("Error calculating balance trend:", err);
            return { percentage: 0, trend: 'up' as const };
        }
    }, []);

    const getRecentTransactions = useCallback(async (userId: string, limit: number = 5) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            const transactions = await db.getAllAsync<Transaction>(
                `SELECT t.*, 
                        c.name as category_name, c.icon as category_icon, c.color as category_color,
                        a.name as account_name,
                        tr.name as trip_name,
                        g.name as group_name,
                        r.frequency as recurring_frequency,
                        (SELECT COUNT(*) FROM splits s WHERE s.transaction_id = t.id) > 0 as is_split
                 FROM transactions t
                 LEFT JOIN categories c ON t.category_id = c.id
                 LEFT JOIN accounts a ON t.account_id = a.id
                 LEFT JOIN trips tr ON t.trip_id = tr.id
                 LEFT JOIN groups g ON t.group_id = g.id
                 LEFT JOIN recurring_configs r ON t.recurring_id = r.id
                 WHERE t.user_id = ?
                 ORDER BY t.date DESC
                 LIMIT ?`,
                [userId, limit]
            );
            return transactions;
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getMonthlyStats = useCallback(async (userId: string) => {
        try {
            const db = await getDatabase();
            const now = new Date();
            const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
            const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

            // Current Month Spending
            const currentMonthResult = await db.getFirstAsync<{ total: number }>(
                `SELECT SUM(t.amount) as total FROM transactions t
                 LEFT JOIN accounts a ON t.to_account_id = a.id
                 WHERE t.user_id = ? 
                 AND t.date >= ?
                 AND (
                    t.type = 'expense' 
                    OR (t.type = 'transfer' AND a.type = 'card' AND a.card_type = 'credit')
                 )`,
                [userId, startOfCurrentMonth]
            );

            // Previous Month Spending
            const previousMonthResult = await db.getFirstAsync<{ total: number }>(
                `SELECT SUM(t.amount) as total FROM transactions t
                 LEFT JOIN accounts a ON t.to_account_id = a.id
                 WHERE t.user_id = ? 
                 AND t.date >= ? AND t.date <= ?
                 AND (
                    t.type = 'expense' 
                    OR (t.type = 'transfer' AND a.type = 'card' AND a.card_type = 'credit')
                 )`,
                [userId, startOfPreviousMonth, endOfPreviousMonth]
            );

            const currentTotal = currentMonthResult?.total || 0;
            const previousTotal = previousMonthResult?.total || 0;

            let percentageChange = 0;
            let trend: 'up' | 'down' = 'up';

            if (previousTotal > 0) {
                percentageChange = ((currentTotal - previousTotal) / previousTotal) * 100;
                trend = percentageChange >= 0 ? 'up' : 'down';
            } else if (currentTotal > 0) {
                percentageChange = 100;
                trend = 'up';
            }

            return {
                currentTotal,
                previousTotal,
                percentageChange: Math.abs(percentageChange),
                trend
            };
        } catch (err) {

            return { currentTotal: 0, previousTotal: 0, percentageChange: 0, trend: 'up' };
        }
    }, []);

    const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>, recurringOptions?: { frequency: 'weekly' | 'monthly' | 'daily' | 'yearly' }) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            const id = generateUUID();

            await db.withTransactionAsync(async () => {
                let recurringId = transaction.recurring_id;

                // If this is a new recurring setup, create the config
                if (recurringOptions) {
                    recurringId = generateUUID();
                    await db.runAsync(
                        `INSERT INTO recurring_configs (id, user_id, account_id, category_id, name, amount, frequency, start_date, last_executed) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            recurringId,
                            transaction.user_id,
                            transaction.account_id,
                            transaction.category_id || null,
                            transaction.name,
                            transaction.amount,
                            recurringOptions.frequency,
                            transaction.date || new Date().toISOString(),
                            transaction.date || new Date().toISOString()
                        ]
                    );
                }

                // Insert transaction
                await db.runAsync(
                    `INSERT INTO transactions (id, user_id, account_id, category_id, name, description, amount, type, date, group_id, trip_id, to_account_id, receipt_url, recurring_id) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        id,
                        transaction.user_id,
                        transaction.account_id,
                        transaction.category_id || null,
                        transaction.name,
                        transaction.description || null,
                        transaction.amount,
                        transaction.type,
                        transaction.date || new Date().toISOString(),
                        transaction.group_id || null,
                        transaction.trip_id || null,
                        transaction.to_account_id || null,
                        transaction.receipt_url || null,
                        recurringId || null
                    ]
                );

                // Update account balances with Asset/Liability Logic
                // Asset (Bank, Cash): +Income, -Expense
                // Liability (Credit Card): -Payment (In), +Spending (Out, Expense)

                const getAccountType = async (accId: string) => {
                    return await db.getFirstAsync<{ type: string, card_type?: string }>('SELECT type, card_type FROM accounts WHERE id = ?', [accId]);
                };

                const sourceAcc = await getAccountType(transaction.account_id);
                const isSourceLiability = sourceAcc?.type === 'card' && sourceAcc?.card_type === 'credit';

                if (transaction.type === 'expense') {
                    // Spending decreases Balance (Asset OR Available Credit)
                    await db.runAsync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [transaction.amount, transaction.account_id]);
                } else if (transaction.type === 'income') {
                    // Income/Payment increases Balance (Asset OR Available Credit)
                    await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [transaction.amount, transaction.account_id]);
                } else if (transaction.type === 'transfer') {
                    // 1. Handle Source (Money Out) -> Decrease Balance
                    await db.runAsync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [transaction.amount, transaction.account_id]);

                    // 2. Handle Destination (Money In) -> Increase Balance
                    if (transaction.to_account_id) {
                        await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [transaction.amount, transaction.to_account_id]);
                    }
                }
            });

            return id;
        } catch (err: any) {

            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const processRecurringTransactions = useCallback(async (userId: string) => {
        try {
            const db = await getDatabase();
            const now = new Date();

            // Fetch all recurring configs for the user
            const configs = await db.getAllAsync<any>(
                `SELECT * FROM recurring_configs WHERE user_id = ?`,
                [userId]
            );

            await db.withTransactionAsync(async () => {
                for (const config of configs) {
                    let lastExecuted = new Date(config.last_executed || config.start_date);
                    const frequency = config.frequency;

                    const getNextDueDate = (current: Date) => {
                        const next = new Date(current);
                        if (frequency === 'daily') next.setDate(next.getDate() + 1);
                        if (frequency === 'weekly') next.setDate(next.getDate() + 7);
                        if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
                        if (frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
                        return next;
                    };

                    let nextDueDate = getNextDueDate(lastExecuted);

                    // While the next due date is in the past or today, create a transaction
                    while (nextDueDate <= now) {
                        const transactionId = generateUUID();

                        await db.runAsync(
                            `INSERT INTO transactions (id, user_id, account_id, category_id, name, description, amount, type, date, recurring_id) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                transactionId,
                                userId,
                                config.account_id,
                                config.category_id || null,
                                config.name,
                                'Auto-processed recurring transaction',
                                config.amount,
                                'expense', // Assume expense for now, ideally recurring config should store type too. defaulting to expense as vast majority are.
                                nextDueDate.toISOString(),
                                config.id
                            ]
                        );

                        // Update account balance
                        await db.runAsync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [config.amount, config.account_id]);

                        // Update last_executed
                        await db.runAsync(
                            'UPDATE recurring_configs SET last_executed = ? WHERE id = ?',
                            [nextDueDate.toISOString(), config.id]
                        );

                        // Move to next period
                        lastExecuted = nextDueDate;
                        nextDueDate = getNextDueDate(lastExecuted);
                    }
                }
            });

        } catch (err) {

        }
    }, []);

    const deleteTransaction = useCallback(async (transactionId: string) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();

            await db.withTransactionAsync(async () => {
                // 1. Fetch the transaction to know what to revert
                const transaction = await db.getFirstAsync<Transaction>(
                    'SELECT * FROM transactions WHERE id = ?',
                    [transactionId]
                );

                if (!transaction) throw new Error("Transaction not found");

                // 2. Revert Balance Changes
                const getAccountType = async (accId: string) => {
                    return await db.getFirstAsync<{ type: string, card_type?: string }>('SELECT type, card_type FROM accounts WHERE id = ?', [accId]);
                };

                const sourceAcc = await getAccountType(transaction.account_id);
                const isSourceLiability = sourceAcc?.type === 'card' && sourceAcc?.card_type === 'credit';

                // Helper to revert balance (Inverse of addTransaction)
                // Helper to revert balance (Inverse of addTransaction)
                if (transaction.type === 'expense') {
                    // Was: -Balance -> Revert: +Balance
                    await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [transaction.amount, transaction.account_id]);
                } else if (transaction.type === 'income') {
                    // Was: +Balance -> Revert: -Balance
                    await db.runAsync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [transaction.amount, transaction.account_id]);
                } else if (transaction.type === 'transfer') {
                    // Revert Source (Was: -Balance -> Revert: +Balance)
                    await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [transaction.amount, transaction.account_id]);

                    // Revert Destination (Was: +Balance -> Revert: -Balance)
                    if (transaction.to_account_id) {
                        await db.runAsync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [transaction.amount, transaction.to_account_id]);
                    }
                }

                // 3. Delete the transaction
                await db.runAsync('DELETE FROM transactions WHERE id = ?', [transactionId]);
            });

            return true;
        } catch (err: any) {
            console.error("Error deleting transaction:", err);
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateTransaction = useCallback(async (transactionId: string, updates: Omit<Transaction, 'id' | 'user_id'>) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            await db.withTransactionAsync(async () => {
                // 1. Fetch current transaction to revert
                const currentTransaction = await db.getFirstAsync<Transaction>(
                    'SELECT * FROM transactions WHERE id = ?',
                    [transactionId]
                );

                if (!currentTransaction) throw new Error("Transaction not found");

                // 2. Revert Balance (Same as Delete)
                const getAccountType = async (accId: string) => {
                    return await db.getFirstAsync<{ type: string, card_type?: string }>('SELECT type, card_type FROM accounts WHERE id = ?', [accId]);
                };

                // --- START REVERT LOGIC ---
                const oldSourceAcc = await getAccountType(currentTransaction.account_id);
                const isOldSourceLiability = oldSourceAcc?.type === 'card' && oldSourceAcc?.card_type === 'credit';

                if (currentTransaction.type === 'expense') {
                    // Revert: +Balance
                    await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [currentTransaction.amount, currentTransaction.account_id]);
                } else if (currentTransaction.type === 'income') {
                    // Revert: -Balance
                    await db.runAsync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [currentTransaction.amount, currentTransaction.account_id]);
                } else if (currentTransaction.type === 'transfer') {
                    // Revert Source: +Balance
                    await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [currentTransaction.amount, currentTransaction.account_id]);

                    if (currentTransaction.to_account_id) {
                        // Revert Dest: -Balance
                        await db.runAsync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [currentTransaction.amount, currentTransaction.to_account_id]);
                    }
                }
                // --- END REVERT LOGIC ---

                // 3. Apply New Details
                await db.runAsync(
                    `UPDATE transactions 
                     SET account_id = ?, category_id = ?, name = ?, description = ?, amount = ?, type = ?, date = ?, group_id = ?, trip_id = ?, to_account_id = ?
                     WHERE id = ?`,
                    [
                        updates.account_id,
                        updates.category_id || null,
                        updates.name,
                        updates.description || null,
                        updates.amount,
                        updates.type,
                        updates.date,
                        updates.group_id || null,
                        updates.trip_id || null,
                        updates.to_account_id || null,
                        transactionId
                    ]
                );

                // 4. Apply New Balance (Logic from Add)
                const newSourceAcc = await getAccountType(updates.account_id);
                const isNewSourceLiability = newSourceAcc?.type === 'card' && newSourceAcc?.card_type === 'credit';

                if (updates.type === 'expense') {
                    // Apply: -Balance
                    await db.runAsync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [updates.amount, updates.account_id]);
                } else if (updates.type === 'income') {
                    // Apply: +Balance
                    await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [updates.amount, updates.account_id]);
                } else if (updates.type === 'transfer') {
                    // Apply Source: -Balance
                    await db.runAsync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [updates.amount, updates.account_id]);

                    if (updates.to_account_id) {
                        // Apply Dest: +Balance
                        await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [updates.amount, updates.to_account_id]);
                    }
                }

            });

            return true;
        } catch (err: any) {
            console.error("Error updating transaction:", err);
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const getTransactionsByTrip = useCallback(async (tripId: string) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            const transactions = await db.getAllAsync<Transaction>(
                `SELECT t.*, 
                        c.name as category_name, c.icon as category_icon, c.color as category_color,
                        a.name as account_name
                 FROM transactions t
                 LEFT JOIN categories c ON t.category_id = c.id
                 LEFT JOIN accounts a ON t.account_id = a.id
                 WHERE t.trip_id = ?
                 ORDER BY t.date DESC`,
                [tripId]
            );
            return transactions;
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getSpendingByCategoryByTrip = useCallback(async (tripId: string) => {
        try {
            const db = await getDatabase();
            const stats = await db.getAllAsync<{ category_name: string, category_icon: string, category_color: string, total: number }>(
                `SELECT c.name as category_name, c.icon as category_icon, c.color as category_color, SUM(t.amount) as total
                 FROM transactions t
                 JOIN categories c ON t.category_id = c.id
                 WHERE t.trip_id = ? AND t.type = 'expense'
                 GROUP BY c.id`,
                [tripId]
            );
            return stats;
        } catch (err) {
            return [];
        }
    }, []);

    return {
        getRecentTransactions,
        getMonthlyStats,
        getBalanceTrend,
        addTransaction,
        processRecurringTransactions,
        deleteTransaction,
        updateTransaction,
        getTransactionsByTrip,
        getSpendingByCategoryByTrip,
        loading,
        error,
    };
};
