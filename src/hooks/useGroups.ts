import { useCallback, useState } from 'react';
import { generateUUID, getDatabase } from '../lib/database';

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
            const db = await getDatabase();
            // Fetch groups where user is a member or creator
            const groups = await db.getAllAsync<any>(
                `SELECT g.* FROM groups g
                 JOIN group_members gm ON g.id = gm.group_id
                 WHERE gm.user_id = ? AND gm.status IN ('joined', 'admin')
                 ORDER BY g.created_at DESC`,
                [userId]
            );


            // Enhance groups with members and balance
            const enhancedGroups = await Promise.all(groups.map(async (group: any) => {
                const members = await db.getAllAsync<any>(
                    `SELECT u.id, u.username, u.avatar FROM users u
                     JOIN group_members gm ON u.id = gm.user_id
                     WHERE gm.group_id = ?
                     LIMIT 4`,
                    [group.id]
                );

                // Calculate balance for this group
                // 1. Amount Paid by me
                const myPaidRow = await db.getFirstAsync<{ total: number }>(
                    'SELECT SUM(amount) as total FROM transactions WHERE group_id = ? AND user_id = ?',
                    [group.id, userId]
                );
                const myPaid = myPaidRow?.total || 0;

                // 2. My Share (from splits)
                const myShareRow = await db.getFirstAsync<{ total: number }>(
                    `SELECT SUM(s.amount) as total 
                     FROM splits s
                     JOIN transactions t ON s.transaction_id = t.id
                     WHERE t.group_id = ? AND s.user_id = ?`,
                    [group.id, userId]
                );
                const myShare = myShareRow?.total || 0;
                const myBalance = myPaid - myShare;

                return { ...group, members, owedAmount: myBalance };
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
            const db = await getDatabase();
            // Generate IDs
            const groupId = generateUUID();
            const memberId = generateUUID();

            await db.withTransactionAsync(async () => {
                // Insert group
                await db.runAsync(
                    'INSERT INTO groups (id, name, description, created_by, created_at, trip_id) VALUES (?, ?, ?, ?, ?, ?)',
                    [groupId, name, description || null, user.id, new Date().toISOString(), tripId || null]
                );

                // Add creator as member
                await db.runAsync(
                    'INSERT INTO group_members (id, group_id, user_id, role, status, joined_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [
                        memberId,
                        groupId,
                        user.id,
                        'admin',
                        'joined',
                        new Date().toISOString()
                    ]
                );
            });

            return groupId;
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
            const db = await getDatabase();

            // 1. Get Group Info
            const group = await db.getFirstAsync<any>(
                'SELECT * FROM groups WHERE id = ?',
                [groupId]
            );

            if (!group) throw new Error('Group not found');

            // 2. Get Members
            const members = await db.getAllAsync<any>(
                `SELECT u.id, u.username, u.avatar, gm.role, gm.status, gm.joined_at 
                 FROM users u
                 JOIN group_members gm ON u.id = gm.user_id
                 WHERE gm.group_id = ?`,
                [groupId]
            );

            // 3. Get Recent Transactions (Linked to group)
            // Check if transaction has splits using a subquery or strict LEFT JOIN group
            const transactions = await db.getAllAsync<any>(
                `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color, u.username as payer_name, u.avatar as payer_avatar,
                 tr.name as trip_name,
                 (SELECT COUNT(*) FROM splits s WHERE s.transaction_id = t.id) > 0 as is_split
                 FROM transactions t
                 LEFT JOIN categories c ON t.category_id = c.id
                 JOIN users u ON t.user_id = u.id
                 LEFT JOIN trips tr ON t.trip_id = tr.id
                 WHERE t.group_id = ?
                 ORDER BY t.date DESC
                 LIMIT 20`,
                [groupId]
            );

            // 4. Calculate Balances
            // Get all paid amounts by user (ONLY for split transactions)
            const paidByUser = await db.getAllAsync<{ user_id: string, total: number }>(
                `SELECT t.user_id, SUM(t.amount) as total 
                 FROM transactions t 
                 WHERE t.group_id = ? 
                 AND EXISTS (SELECT 1 FROM splits s WHERE s.transaction_id = t.id)
                 GROUP BY t.user_id`,
                [groupId]
            );
            const paidMap = new Map(paidByUser.map(p => [p.user_id, p.total]));

            // Get all split shares by user
            const shareByUser = await db.getAllAsync<{ user_id: string, total: number }>(
                `SELECT s.user_id, SUM(s.amount) as total 
                 FROM splits s
                 JOIN transactions t ON s.transaction_id = t.id
                 WHERE t.group_id = ?
                 GROUP BY s.user_id`,
                [groupId]
            );
            const shareMap = new Map(shareByUser.map(s => [s.user_id, s.total]));

            // 5. Calculate Bilateral Balances (Me vs Others)
            const bilateralBalances = await db.getAllAsync<{ other_id: string, balance: number }>(
                `SELECT 
                    CASE WHEN t.user_id = ? THEN s.user_id ELSE t.user_id END as other_id,
                    SUM(CASE WHEN t.user_id = ? THEN s.amount ELSE -s.amount END) as balance
                 FROM transactions t
                 JOIN splits s ON t.id = s.transaction_id
                 WHERE t.group_id = ? 
                 AND (
                     (t.user_id = ? AND s.user_id != ?) 
                     OR 
                     (t.user_id != ? AND s.user_id = ?)
                 )
                 GROUP BY other_id`,
                [currentUserId, currentUserId, groupId, currentUserId, currentUserId, currentUserId, currentUserId]
            );
            const bilateralMap = new Map(bilateralBalances.map(b => [b.other_id, b.balance]));

            const totalSpend = Array.from(paidMap.values()).reduce((a, b) => a + b, 0);

            // Enhance members with stats
            const membersWithStats = members.map((m: any) => {
                const paid = paidMap.get(m.id) || 0;
                const share = shareMap.get(m.id) || 0;
                const balance = paid - share;
                const bilateral_balance = bilateralMap.get(m.id) || 0;
                return {
                    ...m,
                    paid,
                    share,
                    balance, // +ve means owed, -ve means owes (General Group Balance)
                    bilateral_balance, // +ve means they owe me, -ve means I owe them (Specific)
                    status: Math.abs(balance) < 1 ? 'settled' : (balance > 0 ? 'owed' : 'owes')
                };
            });

            // My Stats
            const myMember = membersWithStats.find((m: any) => m.id === currentUserId);
            const myPaid = myMember?.paid || 0;
            const myShare = myMember?.share || 0;
            const myBalance = myMember?.balance || 0;

            return {
                ...group,
                members: membersWithStats,
                transactions,
                stats: {
                    totalSpend,
                    myBalance,
                    myPaid,
                    myShare
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
            const db = await getDatabase();

            await db.withTransactionAsync(async () => {
                // For each transaction involved, clear existing splits?
                // Or clear all splits for these transaction IDs?
                const transactionIds = Array.from(new Set(splits.map(s => s.transactionId)));

                for (const txnId of transactionIds) {
                    await db.runAsync('DELETE FROM splits WHERE transaction_id = ?', [txnId]);
                }

                // Insert new splits
                for (const split of splits) {
                    const splitId = generateUUID();
                    await db.runAsync(
                        'INSERT INTO splits (id, transaction_id, user_id, amount, status) VALUES (?, ?, ?, ?, ?)',
                        [splitId, split.transactionId, split.userId, split.amount, 'pending']
                    );
                }
            });

        } catch (err: any) {
            console.error("saveSplits error:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const addMembersToGroup = useCallback(async (groupId: string, members: { name: string, phone: string, id?: string }[]) => {
        if (!members || members.length === 0) return;

        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            const avatarUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAD7mWjrHawdcvg72D_ee4L0F4QjJxoQfOzVfXjJ65F9-GC4F5LyIrnMaId9frI4qeCg0TvlKBdDSNmWtiIXcvzMtxtiwiNEIJSnOYjpaC8kpvJn35xAqmWHbLQkuntEU0NLJiMseBtsZzfgZJxAgPOXlJp65B5pZcpbE-2irapS00uAdbPfoTTob9nEFve_mYCgfdMkaIK0KqYRMODRUtvH4jAlt6Ry8sMSn7WWgSzKNKqJI2HNH5uydSuMzSb2cA_Wt261a4Kz7o';

            await db.withTransactionAsync(async () => {
                for (const member of members) {
                    let userId = member.id;

                    // If no ID provided (manual entry), check if user exists by phone
                    if (!userId) {
                        const existingUser = await db.getFirstAsync<{ id: string }>(
                            'SELECT id FROM users WHERE phone = ?',
                            [member.phone]
                        );

                        if (existingUser) {
                            userId = existingUser.id;
                        } else {
                            // Create new user
                            userId = generateUUID();
                            await db.runAsync(
                                'INSERT INTO users (id, username, phone, password_hash, avatar) VALUES (?, ?, ?, ?, ?)',
                                [userId, member.name, member.phone, 'hash', avatarUrl]
                            );
                        }
                    }

                    // Check if already a member of this group
                    const isMember = await db.getFirstAsync(
                        'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
                        [groupId, userId]
                    );

                    if (!isMember) {
                        await db.runAsync(
                            'INSERT INTO group_members (id, group_id, user_id, role, status, joined_at) VALUES (?, ?, ?, ?, ?, ?)',
                            [generateUUID(), groupId, userId!, 'member', 'invited', new Date().toISOString()]
                        );
                    }
                }
            });

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
            const db = await getDatabase();
            await db.runAsync(
                'UPDATE group_members SET status = ? WHERE group_id = ? AND user_id = ?',
                ['joined', groupId, user.id]
            );
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
            const db = await getDatabase();
            await db.runAsync(
                'UPDATE group_members SET status = ? WHERE group_id = ? AND user_id = ?',
                ['rejected', groupId, user.id]
            );
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
            const db = await getDatabase();

            // Check if user is admin/creator
            const member = await db.getFirstAsync<{ role: string }>(
                'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
                [groupId, user.id]
            );

            if (member?.role !== 'admin') {
                throw new Error("Only admins can delete groups");
            }

            await db.withTransactionAsync(async () => {
                // Delete splits associated with group's transactions
                await db.runAsync(
                    `DELETE FROM splits WHERE transaction_id IN (
                        SELECT id FROM transactions WHERE group_id = ?
                    )`,
                    [groupId]
                );

                // Fetch transactions to revert balances
                const transactions = await db.getAllAsync<{
                    id: string,
                    amount: number,
                    type: 'income' | 'expense' | 'transfer',
                    account_id: string
                }>(
                    `SELECT id, amount, type, account_id FROM transactions WHERE group_id = ?`,
                    [groupId]
                );

                for (const txn of transactions) {
                    if (txn.type === 'expense') {
                        await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [txn.amount, txn.account_id]);
                    } else if (txn.type === 'income') {
                        await db.runAsync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [txn.amount, txn.account_id]);
                    }
                }

                // Delete transactions
                await db.runAsync(
                    'DELETE FROM transactions WHERE group_id = ?',
                    [groupId]
                );

                // Delete members
                await db.runAsync(
                    'DELETE FROM group_members WHERE group_id = ?',
                    [groupId]
                );

                // Delete group
                await db.runAsync(
                    'DELETE FROM groups WHERE id = ?',
                    [groupId]
                );
            });

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
