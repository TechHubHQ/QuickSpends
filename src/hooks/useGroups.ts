import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Group {
    id: string;
    name: string;
    created_by: string;
}

import { useAuth } from '../context/AuthContext';

export const useGroups = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getGroupsByUser = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            // Fetch groups where user is a member
            const { data: groups, error: groupsError } = await supabase
                .from('group_members')
                .select(`
                    group:groups (*)
                `)
                .eq('user_id', userId)
                .in('status', ['joined', 'admin']);

            if (groupsError) throw groupsError;

            const groupIds = (groups || []).map(g => (g.group as any).id);

            // Enhance groups with members and balance
            const enhancedGroups = await Promise.all((groups || []).map(async (g: any) => {
                const group = g.group;

                // 1. Get sample members
                const { data: members } = await supabase
                    .from('group_members')
                    .select(`
                        id:user_id,
                        profile:profiles (username, avatar)
                    `)
                    .eq('group_id', group.id)
                    .limit(4);

                const simplifiedMembers = (members || []).map((m: any) => ({
                    id: m.id,
                    username: m.profile?.username,
                    avatar: m.profile?.avatar
                }));

                // 2. Calculate balance for this group
                // Amount Paid by me (through transactions)
                const { data: paidData } = await supabase
                    .from('transactions')
                    .select('amount')
                    .eq('group_id', group.id)
                    .eq('user_id', userId);

                const myPaid = (paidData || []).reduce((sum, t) => sum + t.amount, 0);

                // My Share (from splits)
                const { data: shareData } = await supabase
                    .from('splits')
                    .select(`
                        amount,
                        transaction:transactions!inner (group_id)
                    `)
                    .eq('user_id', userId)
                    .eq('transactions.group_id', group.id);

                const myShare = (shareData || []).reduce((sum, s) => sum + s.amount, 0);
                const myBalance = myPaid - myShare;

                return { ...group, members: simplifiedMembers, owedAmount: myBalance };
            }));

            return enhancedGroups;
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const createGroup = useCallback(async (name: string, description?: string, tripId?: string) => {
        if (!user) {
            setError("User not logged in");
            return null;
        }

        setLoading(true);
        setError(null);
        try {
            // 1. Insert group
            const { data: group, error: groupError } = await supabase
                .from('groups')
                .insert({
                    name,
                    description: description || null,
                    created_by: user.id,
                    trip_id: tripId || null
                })
                .select()
                .single();

            if (groupError) throw groupError;

            // 2. Add creator as member
            const { error: memberError } = await supabase
                .from('group_members')
                .insert({
                    group_id: group.id,
                    user_id: user.id,
                    role: 'admin',
                    status: 'joined'
                });

            if (memberError) throw memberError;

            return group.id;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [user]);

    const getGroupDetails = useCallback(async (groupId: string, currentUserId: string) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Get Group Info
            const { data: group, error: groupError } = await supabase
                .from('groups')
                .select('*')
                .eq('id', groupId)
                .single();

            if (groupError || !group) throw new Error('Group not found');

            // 2. Get Members with Profiles
            const { data: members, error: membersError } = await supabase
                .from('group_members')
                .select(`
                    id:user_id,
                    role,
                    status,
                    joined_at,
                    profile:profiles (username, avatar)
                `)
                .eq('group_id', groupId);

            if (membersError) throw membersError;

            const simplifiedMembers = (members || []).map((m: any) => ({
                id: m.id,
                username: m.profile?.username,
                avatar: m.profile?.avatar,
                role: m.role,
                status: m.status,
                joined_at: m.joined_at
            }));

            // 3. Get Recent Transactions
            const { data: transactions, error: transError } = await supabase
                .from('transactions')
                .select(`
                    *,
                    category:categories (name, icon, color),
                    payer:profiles!transactions_user_id_fkey (username, avatar),
                    trip:trips (name)
                `)
                .eq('group_id', groupId)
                .order('date', { ascending: false })
                .limit(20);

            if (transError) throw transError;

            // Enhance transactions with is_split (needs a separate check or we could use another join if we had a view)
            const enhancedTransactions = await Promise.all((transactions || []).map(async (t: any) => {
                const { count } = await supabase
                    .from('splits')
                    .select('*', { count: 'exact', head: true })
                    .eq('transaction_id', t.id);

                return {
                    ...t,
                    category_name: t.category?.name,
                    category_icon: t.category?.icon,
                    category_color: t.category?.color,
                    payer_name: t.payer?.username,
                    payer_avatar: t.payer?.avatar,
                    trip_name: t.trip?.name,
                    is_split: (count || 0) > 0
                };
            }));

            // 4. Calculate Balances
            // Get all paid amounts for split transactions
            const { data: paidData } = await supabase
                .from('transactions')
                .select('user_id, amount')
                .eq('group_id', groupId);

            // Note: In reality we should only include transactions that HAVE splits. 
            // For simplicity, we'll filter this in JS or assuming most group transactions are splits.
            // Let's do it properly.
            const paidTransactions = (enhancedTransactions || []).filter(t => t.is_split);
            const paidMap = new Map<string, number>();
            paidTransactions.forEach(t => {
                paidMap.set(t.user_id, (paidMap.get(t.user_id) || 0) + t.amount);
            });

            // Get all splits for the group
            const { data: splitsData } = await supabase
                .from('splits')
                .select(`
                    user_id,
                    amount,
                    transaction:transactions!inner (group_id)
                `)
                .eq('transactions.group_id', groupId);

            const shareMap = new Map<string, number>();
            (splitsData || []).forEach((s: any) => {
                shareMap.set(s.user_id, (shareMap.get(s.user_id) || 0) + s.amount);
            });

            // 5. Bilateral Balances (simplified logic for now)
            const bilateralMap = new Map<string, number>();
            // This needs a much more complex query or lots of JS for bilateral (Owe me vs I owe them)
            // For now, let's just calculate it from the splits we already have
            for (const txn of paidTransactions) {
                const { data: txnSplits } = await supabase.from('splits').select('*').eq('transaction_id', txn.id);
                (txnSplits || []).forEach(s => {
                    if (txn.user_id === currentUserId && s.user_id !== currentUserId) {
                        bilateralMap.set(s.user_id, (bilateralMap.get(s.user_id) || 0) + s.amount);
                    } else if (txn.user_id !== currentUserId && s.user_id === currentUserId) {
                        bilateralMap.set(txn.user_id, (bilateralMap.get(txn.user_id) || 0) - s.amount);
                    }
                });
            }

            const totalSpend = Array.from(paidMap.values()).reduce((a, b) => a + b, 0);

            const membersWithStats = simplifiedMembers.map((m: any) => {
                const paid = paidMap.get(m.id) || 0;
                const share = shareMap.get(m.id) || 0;
                const balance = paid - share;
                const bilateral_balance = bilateralMap.get(m.id) || 0;
                return {
                    ...m,
                    paid,
                    share,
                    balance,
                    bilateral_balance,
                    status: Math.abs(balance) < 1 ? 'settled' : (balance > 0 ? 'owed' : 'owes')
                };
            });

            const myMember = membersWithStats.find((m: any) => m.id === currentUserId);

            return {
                ...group,
                members: membersWithStats,
                transactions: enhancedTransactions,
                stats: {
                    totalSpend,
                    myBalance: myMember?.balance || 0,
                    myPaid: myMember?.paid || 0,
                    myShare: myMember?.share || 0
                }
            };
        } catch (err: any) {
            console.error("fetchGroupDetails error:", err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);



    const saveSplits = useCallback(async (groupId: string, splits: { transactionId: string, userId: string, amount: number }[]) => {
        setLoading(true);
        setError(null);
        try {
            const transactionIds = Array.from(new Set(splits.map(s => s.transactionId)));

            for (const txnId of transactionIds) {
                await supabase.from('splits').delete().eq('transaction_id', txnId);
            }

            const { error } = await supabase
                .from('splits')
                .insert(splits.map(s => ({
                    transaction_id: s.transactionId,
                    user_id: s.userId,
                    amount: s.amount,
                    status: 'pending'
                })));

            if (error) throw error;
        } catch (err: any) {
            console.error("saveSplits error:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const addMembersToGroup = useCallback(async (groupId: string, members: { name: string, email: string, id?: string }[]) => {
        if (!members || members.length === 0) return;

        setLoading(true);
        setError(null);
        try {
            for (const member of members) {
                let userId = member.id;

                if (!userId) {
                    // Check if profile exists by email
                    const { data: existingProfile } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('email', member.email)
                        .maybeSingle();

                    if (existingProfile) {
                        userId = existingProfile.id;
                    } else {
                        // NOTE: In Supabase, we can't easily create a profile without an auth user.
                        // For the sake of migration, let's try to find them by username if email fails.
                        const { data: byUsername } = await supabase
                            .from('profiles')
                            .select('id')
                            .eq('username', member.name)
                            .maybeSingle();

                        if (byUsername) {
                            userId = byUsername.id;
                        }
                    }
                }

                if (userId) {
                    const { data: isMember } = await supabase
                        .from('group_members')
                        .select('id')
                        .eq('group_id', groupId)
                        .eq('user_id', userId)
                        .maybeSingle();

                    if (!isMember) {
                        await supabase
                            .from('group_members')
                            .insert({
                                group_id: groupId,
                                user_id: userId,
                                role: 'member',
                                status: 'invited'
                            });
                    }
                }
            }
        } catch (err: any) {
            console.error("addMembersToGroup error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const acceptGroupInvite = useCallback(async (groupId: string) => {
        if (!user) return;
        setLoading(true);
        try {
            await supabase
                .from('group_members')
                .update({ status: 'joined' })
                .eq('group_id', groupId)
                .eq('user_id', user.id);
        } catch (err: any) {
            console.error("acceptGroupInvite error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const rejectGroupInvite = useCallback(async (groupId: string) => {
        if (!user) return;
        setLoading(true);
        try {
            await supabase
                .from('group_members')
                .update({ status: 'rejected' })
                .eq('group_id', groupId)
                .eq('user_id', user.id);
        } catch (err: any) {
            console.error("rejectGroupInvite error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const deleteGroup = useCallback(async (groupId: string) => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            // 1. Check if user is admin
            const { data: member, error: memberError } = await supabase
                .from('group_members')
                .select('role')
                .eq('group_id', groupId)
                .eq('user_id', user.id)
                .single();

            if (memberError || member?.role !== 'admin') {
                throw new Error("Only admins can delete groups");
            }

            // 2. Fetch transactions to revert balances
            const { data: transactions, error: transError } = await supabase
                .from('transactions')
                .select('id, amount, type, account_id')
                .eq('group_id', groupId);

            if (transError) throw transError;

            // 3. Revert balances
            for (const txn of (transactions || [])) {
                const { data: acc } = await supabase.from('accounts').select('balance').eq('id', txn.account_id).single();
                if (acc) {
                    const change = txn.type === 'expense' ? txn.amount : -txn.amount;
                    await supabase.from('accounts').update({ balance: acc.balance + change }).eq('id', txn.account_id);
                }
            }

            // 4. Delete splits for these transactions
            const transactionIds = (transactions || []).map(t => t.id);
            if (transactionIds.length > 0) {
                await supabase.from('splits').delete().in('transaction_id', transactionIds);
            }

            // 5. Delete transactions
            await supabase.from('transactions').delete().eq('group_id', groupId);

            // 6. Delete members
            await supabase.from('group_members').delete().eq('group_id', groupId);

            // 7. Delete group
            const { error: groupDeleteError } = await supabase.from('groups').delete().eq('id', groupId);
            if (groupDeleteError) throw groupDeleteError;

        } catch (err: any) {
            console.error("deleteGroup error:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user]);

    return {
        getGroupsByUser,
        getGroupDetails,
        createGroup,

        addMembersToGroup,
        acceptGroupInvite,
        rejectGroupInvite,
        deleteGroup,
        saveSplits,
        loading,
        error
    };
};
