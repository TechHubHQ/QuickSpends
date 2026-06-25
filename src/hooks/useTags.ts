import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { NWS_DISPLAY } from '../utils/nwsClassification';

export interface Tag {
    id: string;
    user_id: string;
    name: string;
    color: string;
    is_event: boolean;
    is_system: boolean;
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

export const SYSTEM_TAG_NAMES = ['Need', 'Want', 'Savings'] as const;

export const SYSTEM_TAG_DEFINITIONS = [
    { name: 'Need', color: NWS_DISPLAY.needs.color },
    { name: 'Want', color: NWS_DISPLAY.wants.color },
    { name: 'Savings', color: NWS_DISPLAY.savings.color },
];

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
                .order('is_system', { ascending: false })
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

    const ensureSystemTags = useCallback(async (userId: string) => {
        try {
            const { data: existing } = await supabase
                .from('tags')
                .select('name')
                .eq('user_id', userId)
                .in('name', SYSTEM_TAG_NAMES);

            const existingNames = new Set((existing || []).map(t => t.name));

            const toCreate = SYSTEM_TAG_DEFINITIONS.filter(t => !existingNames.has(t.name));

            if (toCreate.length === 0) return;

            await supabase.from('tags').insert(
                toCreate.map(t => ({
                    user_id: userId,
                    name: t.name,
                    color: t.color,
                    is_event: false,
                    is_system: true,
                }))
            );
        } catch (err) {
            console.error('Error ensuring system tags:', err);
        }
    }, []);

    const addTag = useCallback(async (tag: Omit<Tag, 'id' | 'created_at'>) => {
        setLoading(true);
        setError(null);
        try {
            if (SYSTEM_TAG_NAMES.includes(tag.name as any)) {
                throw new Error('Cannot create a tag with a reserved system name');
            }

            const { data, error } = await supabase
                .from('tags')
                .insert({
                    user_id: tag.user_id,
                    name: tag.name,
                    color: tag.color,
                    is_event: tag.is_event,
                    is_system: false,
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
            const { data: existing } = await supabase
                .from('tags')
                .select('is_system')
                .eq('id', tagId)
                .single();

            if (existing?.is_system) {
                throw new Error('System tags cannot be edited');
            }

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
            const { data: existing } = await supabase
                .from('tags')
                .select('is_system')
                .eq('id', tagId)
                .single();

            if (existing?.is_system) {
                throw new Error('System tags cannot be deleted');
            }

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
            const { data: tag, error: tagError } = await supabase
                .from('tags')
                .select('*')
                .eq('id', tagId)
                .single();

            if (tagError) throw tagError;
            if (!tag) return null;

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

            const formattedTxs = (txs || []).map((t: any) => ({
                ...t,
                category_name: t.categories?.parent
                    ? `${t.categories.parent.name} > ${t.categories.name}`
                    : t.categories?.name,
                category_icon: t.categories?.icon,
                category_color: t.categories?.color,
                account_name: t.accounts?.name,
            }));

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

    const getSystemTags = useCallback(async (userId: string) => {
        try {
            const { data } = await supabase
                .from('tags')
                .select('*')
                .eq('user_id', userId)
                .in('name', SYSTEM_TAG_NAMES);
            return (data || []) as Tag[];
        } catch {
            return [];
        }
    }, []);

    return {
        getTagsByUser,
        addTag,
        updateTag,
        deleteTag,
        getTagWithSpending,
        getAllTagsWithSpending,
        ensureSystemTags,
        getSystemTags,
        loading,
        error,
    };
};
