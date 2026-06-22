import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Tag {
    id: string;
    user_id: string;
    name: string;
    color: string;
    is_event: boolean;
    event_type?: 'birthday' | 'marriage' | 'anniversary' | 'festival' | 'travel' | 'other' | null;
    event_date?: string | null;
    budget?: number | null;
    description?: string | null;
    created_at: string;
}

export interface TagWithSpending extends Tag {
    spent: number;
    transactions: any[];
}

export const useTags = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getTagsByUser = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .eq('user_id', userId)
                .order('name', { ascending: true });

            if (error) throw error;
            return (data || []) as Tag[];
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const addTag = useCallback(async (tag: Omit<Tag, 'id' | 'created_at'>) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('tags')
                .insert({
                    user_id: tag.user_id,
                    name: tag.name,
                    color: tag.color,
                    is_event: tag.is_event,
                    event_type: tag.event_type || null,
                    event_date: tag.event_date || null,
                    budget: tag.budget || null,
                    description: tag.description || null,
                })
                .select()
                .single();

            if (error) throw error;
            return data as Tag;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateTag = useCallback(async (tagId: string, updates: Partial<Omit<Tag, 'id' | 'user_id' | 'created_at'>>) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('tags')
                .update(updates)
                .eq('id', tagId)
                .select()
                .single();

            if (error) throw error;
            return data as Tag;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteTag = useCallback(async (tagId: string) => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase
                .from('tags')
                .delete()
                .eq('id', tagId);

            if (error) throw error;
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const getTagWithSpending = useCallback(async (tagId: string) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch tag details
            const { data: tag, error: tagError } = await supabase
                .from('tags')
                .select('*')
                .eq('id', tagId)
                .single();

            if (tagError) throw tagError;
            if (!tag) return null;

            // 2. Fetch all transactions for this tag
            const { data: txs, error: txsError } = await supabase
                .from('transactions')
                .select(`
                    *,
                    categories!transactions_category_id_fkey (name, icon, color, parent:parent_id(name)),
                    accounts!transactions_account_id_fkey (name)
                `)
                .eq('tag_id', tagId)
                .order('date', { ascending: false });

            if (txsError) throw txsError;

            // Flatten/format transactions
            const formattedTxs = (txs || []).map((t: any) => ({
                ...t,
                category_name: t.categories?.parent
                    ? `${t.categories.parent.name} > ${t.categories.name}`
                    : t.categories?.name,
                category_icon: t.categories?.icon,
                category_color: t.categories?.color,
                account_name: t.accounts?.name,
            }));

            // 3. Sum expenses for this tag
            const spent = formattedTxs
                .filter((t) => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            return {
                ...tag,
                spent,
                transactions: formattedTxs,
            } as TagWithSpending;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const getAllTagsWithSpending = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data: tags, error: tagsError } = await supabase
                .from('tags')
                .select('*')
                .eq('user_id', userId);

            if (tagsError) throw tagsError;
            if (!tags || tags.length === 0) return [];

            const { data: txs, error: txsError } = await supabase
                .from('transactions')
                .select('tag_id, amount, type, name, date, categories!transactions_category_id_fkey(name, icon, color), accounts!transactions_account_id_fkey(name)')
                .in('tag_id', tags.map(t => t.id))
                .order('date', { ascending: false });

            if (txsError) throw txsError;

            // Build tag_id -> transactions map
            const txMap: Record<string, any[]> = {};
            (txs || []).forEach((t: any) => {
                if (!txMap[t.tag_id]) txMap[t.tag_id] = [];
                txMap[t.tag_id].push({
                    ...t,
                    category_name: t.categories?.name,
                    category_icon: t.categories?.icon,
                    category_color: t.categories?.color,
                    account_name: t.accounts?.name,
                });
            });

            return tags.map((tag) => {
                const tagTxs = txMap[tag.id] || [];
                const spent = tagTxs
                    .filter((t: any) => t.type === 'expense')
                    .reduce((sum: number, t: any) => sum + t.amount, 0);
                return { ...tag, spent, transactions: tagTxs } as TagWithSpending;
            });
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        getTagsByUser,
        addTag,
        updateTag,
        deleteTag,
        getTagWithSpending,
        getAllTagsWithSpending,
        loading,
        error,
    };
};
