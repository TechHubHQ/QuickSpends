import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotificationPreferences } from '../context/NotificationPreferencesContext';
import { generateUUID, getDatabase } from '../lib/database';

export interface Notification {
    id: string;
    userId: string;
    type: 'invite' | 'alert' | 'info';
    title: string;
    message: string;
    data?: any;
    isRead: boolean;
    createdAt: string;
}

export const useNotifications = () => {
    const { preferences } = useNotificationPreferences();
    const { user: currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getNotifications = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            const result = await db.getAllAsync<any>(
                'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );

            return result.map(n => ({
                id: n.id,
                userId: n.user_id,
                type: n.type as any,
                title: n.title,
                message: n.message,
                data: n.data ? JSON.parse(n.data) : undefined,
                isRead: Boolean(n.is_read),
                createdAt: n.created_at
            }));
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getUnreadCount = useCallback(async (userId: string) => {
        try {
            const db = await getDatabase();
            const result = await db.getFirstAsync<{ count: number }>(
                'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
                [userId]
            );
            return result?.count || 0;
        } catch (err) {
            return 0;
        }
    }, []);

    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            const db = await getDatabase();
            await db.runAsync(
                'UPDATE notifications SET is_read = 1 WHERE id = ?',
                [notificationId]
            );
            return true;
        } catch (err: any) {
            return false;
        }
    }, []);

    const markAllAsRead = useCallback(async (userId: string) => {
        try {
            const db = await getDatabase();
            await db.runAsync(
                'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
                [userId]
            );
            return true;
        } catch (err: any) {
            return false;
        }
    }, []);

    const clearAllNotifications = useCallback(async (userId: string) => {
        try {
            const db = await getDatabase();
            await db.runAsync(
                'DELETE FROM notifications WHERE user_id = ?',
                [userId]
            );
            return true;
        } catch (err: any) {
            return false;
        }
    }, []);

    const sendInvite = useCallback(async (fromUserName: string, toPhoneNumber: string, groupName: string, groupId: string) => {
        setLoading(true);
        try {
            const db = await getDatabase();

            // 1. Find the user by phone number
            const user = await db.getFirstAsync<{ id: string }>(
                'SELECT id FROM users WHERE phone = ?',
                [toPhoneNumber]
            );

            if (!user) {
                return { success: true, message: `Invite sent to ${toPhoneNumber}` };
            }

            if (currentUser && user.id === currentUser.id) {
                return { success: false, message: "You cannot invite yourself." };
            }

            // 2. Create notification for that user
            const id = generateUUID();
            await db.runAsync(
                `INSERT INTO notifications (id, user_id, type, title, message, data, is_read, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    user.id,
                    'invite',
                    'Group Invitation',
                    `${fromUserName} invited you to join "${groupName}"`,
                    JSON.stringify({ groupId, groupName, fromUserName }),
                    0,
                    new Date().toISOString()
                ]
            );

            return { success: true, message: "Invitation sent successfully!" };

        } catch (err: any) {
            return { success: false, message: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const createNotification = async (db: any, userId: string, title: string, message: string, type: 'alert' | 'info' | 'invite', data: any = {}) => {
        const id = generateUUID();
        await db.runAsync(
            `INSERT INTO notifications (id, user_id, type, title, message, data, is_read, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, userId, type, title, message, JSON.stringify(data), 0, new Date().toISOString()]
        );
    };

    const checkRecurringReminders = useCallback(async (userId: string) => {
        if (!preferences.billReminders) return;
        try {
            const db = await getDatabase();
            const configs = await db.getAllAsync<any>('SELECT * FROM recurring_configs WHERE user_id = ?', [userId]);

            for (const config of configs) {
                const lastExecuted = new Date(config.last_executed || config.start_date);
                const frequency = config.frequency;

                const getNextDueDate = (current: Date) => {
                    const next = new Date(current);
                    if (frequency === 'daily') next.setDate(next.getDate() + 1);
                    if (frequency === 'weekly') next.setDate(next.getDate() + 7);
                    if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
                    if (frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
                    return next;
                };

                const nextDueDate = getNextDueDate(lastExecuted);
                const now = new Date();
                const diffTime = nextDueDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Notify if due tomorrow (approx 24 hours) and haven't notified today
                if (diffDays <= 1 && diffDays >= 0) {
                    const lastNotified = config.last_notified_at ? new Date(config.last_notified_at) : null;
                    const isToday = lastNotified && lastNotified.toDateString() === now.toDateString();

                    if (!isToday) {
                        await createNotification(db, userId, 'Recurring Payment Due', `"${config.name}" of ${config.amount} is due soon.`, 'info', { recurringId: config.id });
                        await db.runAsync('UPDATE recurring_configs SET last_notified_at = ? WHERE id = ?', [now.toISOString(), config.id]);
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    const checkBudgetAlerts = useCallback(async (userId: string) => {
        if (!preferences.budgetAlerts) return;
        try {
            const db = await getDatabase();
            // Get all budgets
            const budgets = await db.getAllAsync<any>(
                `SELECT b.*, c.name as category_name FROM budgets b JOIN categories c ON b.category_id = c.id WHERE b.user_id = ?`,
                [userId]
            );

            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            for (const budget of budgets) {
                // Check if already alerted this month
                if (budget.alert_month === currentMonth) continue;

                // Calculate spending
                const result = await db.getFirstAsync<{ total: number }>(
                    `SELECT SUM(amount) as total FROM transactions 
                     WHERE user_id = ? AND category_id = ? AND type = 'expense' AND date >= ?`,
                    [userId, budget.category_id, startOfMonth]
                );

                const spent = result?.total || 0;
                if (spent >= (budget.amount * 0.9)) {
                    await createNotification(
                        db,
                        userId,
                        'Budget Alert',
                        `You've used 90% of your ${budget.category_name} budget ($${spent}/${budget.amount}).`,
                        'alert',
                        { budgetId: budget.id }
                    );
                    await db.runAsync('UPDATE budgets SET alert_month = ? WHERE id = ?', [currentMonth, budget.id]);
                }
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    const checkTripAlerts = useCallback(async (userId: string) => {
        if (!preferences.tripAlerts) return;
        try {
            const db = await getDatabase();
            const trips = await db.getAllAsync<any>('SELECT * FROM trips WHERE user_id = ? AND alert_sent = 0 AND budget_amount IS NOT NULL', [userId]);

            for (const trip of trips) {
                const result = await db.getFirstAsync<{ total: number }>(
                    `SELECT SUM(amount) as total FROM transactions WHERE trip_id = ? AND type = 'expense'`,
                    [trip.id]
                );
                const spent = result?.total || 0;

                if (spent >= (trip.budget_amount * 0.9)) {
                    await createNotification(
                        db,
                        userId,
                        'Trip Budget Alert',
                        `You've used 90% of your budget for "${trip.name}" ($${spent}/${trip.budget_amount}).`,
                        'alert',
                        { tripId: trip.id }
                    );
                    await db.runAsync('UPDATE trips SET alert_sent = 1 WHERE id = ?', [trip.id]);
                }
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    const checkSplitReminders = useCallback(async (userId: string) => {
        if (!preferences.splitReminders) return;
        try {
            const db = await getDatabase();
            // Find pending splits owed BY user
            const pendingSplits = await db.getAllAsync<any>(
                `SELECT s.*, t.description as trans_desc, t.date as trans_date 
                 FROM splits s 
                 JOIN transactions t ON s.transaction_id = t.id 
                 WHERE s.user_id = ? AND s.status = 'pending'`,
                [userId]
            );

            // We don't have a 'last_reminded' on splits table yet, so to avoid spamming 
            // we will just check if we have sent a notification for this split recently? 
            // Or simpler: Check if it's been pending for > 3 days and < 4 days (one time alert)

            const now = new Date();
            for (const split of pendingSplits) {
                const transDate = new Date(split.trans_date);
                const diffTime = now.getTime() - transDate.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                // Check if we already have alerted for this splitId using db column
                if (diffDays >= 3 && !split.alert_sent) {
                    await createNotification(
                        db,
                        userId,
                        'Pending Payment',
                        `You have a pending split of $${split.amount} for "${split.trans_desc || 'Expense'}"`,
                        'info',
                        { splitId: split.id }
                    );
                    await db.runAsync('UPDATE splits SET alert_sent = 1 WHERE id = ?', [split.id]);
                }
            }

        } catch (e) {
            console.error(e);
        }
    }, []);

    const checkLowBalanceAlerts = useCallback(async (userId: string) => {
        if (!preferences.lowBalanceAlerts) return;
        try {
            const db = await getDatabase();
            const accounts = await db.getAllAsync<any>('SELECT * FROM accounts WHERE user_id = ? AND is_active = 1', [userId]);

            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];

            for (const acc of accounts) {
                let shouldAlert = false;
                let message = '';

                if ((acc.type === 'bank' || acc.type === 'cash')) {
                    if (acc.balance < 1000) { // Threshold 1000
                        shouldAlert = true;
                        message = `Your balance in ${acc.name} is low ($${acc.balance}).`;
                    }
                } else if (acc.type === 'card' && acc.card_type === 'credit') {
                    // Credit Card: account.balance stores the AVAILABLE limit.
                    // High Outstanding = Low Available Balance.
                    if (acc.credit_limit) {
                        const outstanding = acc.credit_limit - acc.balance;
                        if (acc.balance < (acc.credit_limit * 0.1)) { // < 10% available (i.e. > 90% used)
                            shouldAlert = true;
                            message = `High outstanding dues on ${acc.name}. You've used ${((outstanding / acc.credit_limit) * 100).toFixed(0)}% of your limit.`;
                        }
                    }
                }

                if (shouldAlert) {
                    // Check if we alerted TODAY for this account
                    const lastAlert = acc.last_low_balance_alert;
                    const lastAlertDate = lastAlert ? new Date(lastAlert).toISOString().split('T')[0] : null;

                    if (lastAlertDate !== todayStr) {
                        await createNotification(db, userId, 'Low Balance Alert', message, 'alert', { accountId: acc.id });
                        await db.runAsync('UPDATE accounts SET last_low_balance_alert = ? WHERE id = ?', [now.toISOString(), acc.id]);
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    const checkMonthlySummary = useCallback(async (userId: string) => {
        if (!preferences.monthlySummary) return;
        try {
            const db = await getDatabase();
            const now = new Date();
            // Check if it's the 1st of the month
            if (now.getDate() === 1) {
                // Check if meaningful time has passed today (e.g. don't spam every second)
                // Or check if we already sent summary for LAST month

                const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const previousMonthStr = previousMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
                const previousMonthKey = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`; // YYYY-MM

                // Get user to check last_monthly_summary
                const userObj = await db.getFirstAsync<{ last_monthly_summary: string }>(
                    'SELECT last_monthly_summary FROM users WHERE id = ?',
                    [userId]
                );

                if (userObj?.last_monthly_summary !== previousMonthKey) {
                    // Calculate Total Spend
                    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
                    const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

                    const res = await db.getFirstAsync<{ total: number }>(
                        `SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'expense' AND date >= ? AND date <= ?`,
                        [userId, start, end]
                    );

                    await createNotification(
                        db,
                        userId,
                        'Monthly Summary',
                        `You spent $${res?.total || 0} in ${previousMonthStr}.`,
                        'info',
                        { month: previousMonthStr }
                    );

                    await db.runAsync('UPDATE users SET last_monthly_summary = ? WHERE id = ?', [previousMonthKey, userId]);
                }
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    const checkAllNotifications = useCallback(async (userId: string) => {
        // Run all checks sequentially or parallel
        // We catch errors inside each check so one failure doesn't stop others
        await Promise.all([
            checkRecurringReminders(userId),
            checkBudgetAlerts(userId),
            checkTripAlerts(userId),
            checkSplitReminders(userId),
            checkLowBalanceAlerts(userId),
            checkMonthlySummary(userId)
        ]);

        // Return latest count or list? No, just triggers updates.
        // The consumer should call getNotifications() or getUnreadCount() after this if they want updates.
    }, [
        checkRecurringReminders,
        checkBudgetAlerts,
        checkTripAlerts,
        checkSplitReminders,
        checkLowBalanceAlerts,
        checkMonthlySummary
    ]);

    // Seed test notification (existing) kept for backward compatibility if needed, using generic create
    const seedTestNotification = useCallback(async (userId: string) => {
        try {
            const db = await getDatabase();
            await createNotification(db, userId, 'Welcome!', 'Welcome to QuickSpends groups.', 'info');
        } catch (e) { }
    }, []);

    return {
        getNotifications,
        getUnreadCount,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        sendInvite,
        seedTestNotification,
        checkAllNotifications,
        loading,
        error
    };
};
