import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

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
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchCategories = useCallback(async (type?: 'income' | 'expense') => {
        setLoading(true);
        setError(null);
        try {
            let query = supabase.from('categories').select('*');

            if (type) {
                query = query.eq('type', type);
            }

            const { data, error } = await query;
            if (error) throw error;
            setCategories(data as Category[]);
            return data as Category[];
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getCategories = useCallback(async (type?: 'income' | 'expense') => {
        setLoading(true);
        setError(null);
        try {
            let query = supabase.from('categories').select('*');

            if (type) {
                query = query.eq('type', type);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as Category[];
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchCategories();
        }
    }, [user, fetchCategories]);

    const addCategory = useCallback(async (name: string, icon: string, color: string, type: 'income' | 'expense', parentId?: string, isDefault: boolean = false) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('categories')
                .insert({
                    user_id: (await supabase.auth.getUser()).data.user?.id,
                    name,
                    icon,
                    color,
                    type,
                    parent_id: parentId || null,
                    is_default: isDefault
                })
                .select()
                .single();

            if (error) throw error;
            return data as Category;
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
            // Check if default
            const { data: category, error: fetchError } = await supabase
                .from('categories')
                .select('is_default')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;
            if (category?.is_default) {
                throw new Error('Cannot delete default categories');
            }

            const { error: deleteError } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        categories,
        fetchCategories,
        getCategories,
        addCategory,
        deleteCategory,
        loading,
        error
    };
};
