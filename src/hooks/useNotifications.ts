import { useCallback, useState } from 'react';
import { notificationRules } from '../config/notificationRules';
import { useAuth } from '../context/AuthContext';
import { useNotificationPreferences } from '../context/NotificationPreferencesContext';
import { generateUUID, getDatabase } from '../lib/database';

export interface Notification {
    id: string;
    userId: string;
    type: 'invite' | 'alert' | 'info' | 'success' | 'security';
    category?: 'all' | 'alerts' | 'updates';
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
    }, [currentUser]);

    const checkAllNotifications = useCallback(async (userId: string) => {
        try {
            const db = await getDatabase();

            const createNotificationForUser = async (title: string, message: string, type: string, data: any = {}) => {
                const id = generateUUID();
                await db.runAsync(
                    `INSERT INTO notifications (id, user_id, type, title, message, data, is_read, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [id, userId, type, title, message, JSON.stringify(data), 0, new Date().toISOString()]
                );
            };

            // Execute all enabled rules
            const activeRules = notificationRules.filter(rule => preferences[rule.preferenceKey]);

            await Promise.all(
                activeRules.map(async (rule) => {
                    try {
                        await rule.check({
                            db,
                            userId,
                            preferences,
                            createNotification: createNotificationForUser
                        });
                    } catch (e) {
                        console.error(`Error executing notification rule ${rule.id}:`, e);
                    }
                })
            );

        } catch (e) {
            console.error('Error running notification checks:', e);
        }
    }, [preferences]);

    return {
        getNotifications,
        getUnreadCount,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        sendInvite,
        checkAllNotifications,
        loading,
        error
    };
};
