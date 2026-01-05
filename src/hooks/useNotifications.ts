import { useCallback, useState } from 'react';
import { notificationRules } from '../config/notificationRules';
import { useAuth } from '../context/AuthContext';
import { useNotificationPreferences } from '../context/NotificationPreferencesContext';
import { supabase } from '../lib/supabase';

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
            const { data: result, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (result || []).map(n => ({
                id: n.id,
                userId: n.user_id,
                type: n.type as any,
                title: n.title,
                message: n.message,
                data: n.data, // Supabase stores JSON as object
                isRead: n.is_read,
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
            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            return count || 0;
        } catch (err) {
            return 0;
        }
    }, []);

    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);
            return true;
        } catch (err: any) {
            return false;
        }
    }, []);

    const markAllAsRead = useCallback(async (userId: string) => {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', userId);
            return true;
        } catch (err: any) {
            return false;
        }
    }, []);

    const clearAllNotifications = useCallback(async (userId: string) => {
        try {
            await supabase
                .from('notifications')
                .delete()
                .eq('user_id', userId);
            return true;
        } catch (err: any) {
            return false;
        }
    }, []);

    const sendInvite = useCallback(async (fromUserName: string, toPhoneNumber: string, groupName: string, groupId: string) => {
        setLoading(true);
        try {
            // 1. Find the user by phone number (profile)
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('phone', toPhoneNumber)
                .maybeSingle();

            if (!profile) {
                return { success: true, message: `Invite sent to ${toPhoneNumber}` };
            }

            if (currentUser && profile.id === currentUser.id) {
                return { success: false, message: "You cannot invite yourself." };
            }

            // 2. Create notification for that user
            await supabase
                .from('notifications')
                .insert({
                    user_id: profile.id,
                    type: 'invite',
                    title: 'Group Invitation',
                    message: `${fromUserName} invited you to join "${groupName}"`,
                    data: { groupId, groupName, fromUserName },
                    is_read: false
                });

            return { success: true, message: "Invitation sent successfully!" };

        } catch (err: any) {
            return { success: false, message: err.message };
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    const checkAllNotifications = useCallback(async (userId: string) => {
        try {
            const createNotificationForUser = async (title: string, message: string, type: string, data: any = {}) => {
                await supabase
                    .from('notifications')
                    .insert({
                        user_id: userId,
                        type,
                        title,
                        message,
                        data,
                        is_read: false
                    });
            };

            // Execute all enabled rules
            const activeRules = notificationRules.filter(rule => preferences[rule.preferenceKey]);

            await Promise.all(
                activeRules.map(async (rule) => {
                    try {
                        await rule.check({
                            supabase,
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
