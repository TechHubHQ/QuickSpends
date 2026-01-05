import { useCallback, useState } from 'react';
import { generateUUID, getDatabase } from '../lib/database';

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
            const db = await getDatabase();
            const id = generateUUID();
            await db.withTransactionAsync(async () => {
                // 1. Create Account
                await db.runAsync(
                    `INSERT INTO accounts (id, user_id, name, type, card_type, credit_limit, balance, currency, account_number_last_4) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        id,
                        account.user_id,
                        account.name,
                        account.type,
                        account.card_type || null,
                        account.credit_limit || null,
                        account.balance,
                        account.currency,
                        account.account_number_last_4 || null,
                    ]
                );

                // 2. Create Opening Balance Transaction if balance > 0
                if (account.balance > 0) {
                    const transactionId = generateUUID();
                    // For Credit Cards, balance is Available Credit (Asset-like positive capability).
                    // For Bank/Cash, balance is Asset.
                    // In all cases, initial positive balance is treated as 'income' (Positive Entry).
                    const type = 'income';

                    // Find or Create "Opening Balance" Category
                    let categoryId: string | null = null;
                    const existingCategory = await db.getFirstAsync<{ id: string }>(
                        `SELECT id FROM categories WHERE name = 'Opening Balance' AND type = 'income'`
                    );

                    if (existingCategory) {
                        categoryId = existingCategory.id;
                    } else {
                        categoryId = generateUUID();
                        await db.runAsync(
                            `INSERT INTO categories (id, name, icon, color, type) VALUES (?, ?, ?, ?, ?)`,
                            [categoryId, 'Opening Balance', 'wallet-plus', '#4CAF50', 'income']
                        );
                    }

                    await db.runAsync(
                        `INSERT INTO transactions (id, user_id, account_id, category_id, name, description, amount, type, date) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            transactionId,
                            account.user_id,
                            id, // account_id
                            categoryId, // Now using the specific category ID
                            'Opening Balance',
                            'Initial account balance',
                            account.balance,
                            type,
                            new Date().toISOString()
                        ]
                    );
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

    const getAccountsByUser = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            const accounts = await db.getAllAsync<Account>(
                'SELECT * FROM accounts WHERE user_id = ? AND is_active = 1',
                [userId]
            );
            return accounts;
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
            const db = await getDatabase();
            const fields: string[] = [];
            const values: any[] = [];

            if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
            if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
            if (updates.card_type !== undefined) { fields.push('card_type = ?'); values.push(updates.card_type || null); }
            if (updates.credit_limit !== undefined) { fields.push('credit_limit = ?'); values.push(updates.credit_limit || null); }
            if (updates.balance !== undefined) { fields.push('balance = ?'); values.push(updates.balance); }
            if (updates.account_number_last_4 !== undefined) { fields.push('account_number_last_4 = ?'); values.push(updates.account_number_last_4 || null); }

            if (fields.length === 0) return true;

            values.push(id);
            await db.runAsync(`UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`, values);
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
            const db = await getDatabase();
            await db.runAsync('UPDATE accounts SET is_active = 0 WHERE id = ?', [id]);
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
