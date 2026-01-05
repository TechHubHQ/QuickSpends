import * as Crypto from 'expo-crypto';
import { useCallback, useState } from 'react';
import { getDatabase } from '../lib/database';

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: 'income' | 'expense';
    parent_id?: string;
    is_default?: boolean;
}

export const useCategories = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getCategories = useCallback(async (type?: 'income' | 'expense') => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            let query = 'SELECT * FROM categories';
            const params: any[] = [];

            if (type) {
                query += ' WHERE type = ?';
                params.push(type);
            }

            const categories = await db.getAllAsync<Category>(query, params);
            return categories;
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const addCategory = useCallback(async (name: string, icon: string, color: string, type: 'income' | 'expense', parentId?: string, isDefault: boolean = false) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            const id = Crypto.randomUUID();
            await db.runAsync(
                'INSERT INTO categories (id, name, icon, color, type, parent_id, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [id, name, icon, color, type, parentId || null, isDefault ? 1 : 0]
            );
            return { id, name, icon, color, type, parent_id: parentId, is_default: isDefault };
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteCategory = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();

            // Check if default
            const category = await db.getFirstAsync<{ is_default: boolean }>('SELECT is_default FROM categories WHERE id = ?', [id]);

            if (category?.is_default) {
                throw new Error('Cannot delete default categories');
            }

            await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
            // Also delete subcategories if any? Or re-assign? For now, let's delete orphans or assume cascade if setup (SQLite FKs are ON)
            // But we should probably check for transactions linked to this category.
            // For MVP/step-by-step, we'll just delete the category.

        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        getCategories,
        addCategory,
        deleteCategory,
        loading,
        error
    };
};
