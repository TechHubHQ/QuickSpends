import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { QSHeader } from '../components/QSHeader';
import { useAuth } from '../context/AuthContext';
import { useGroups } from '../hooks/useGroups';
import { Notification, useNotifications } from '../hooks/useNotifications';
import { useTheme } from '../theme/ThemeContext';
import { Theme } from '../theme/theme';

const QSNotificationsScreen = () => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const { user } = useAuth();
    const router = useRouter();
    const { acceptGroupInvite, rejectGroupInvite } = useGroups();
    const {
        getNotifications,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        checkAllNotifications,
        loading
    } = useNotifications();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadNotifications = async () => {
        if (!user) return;
        const data = await getNotifications(user.id);
        setNotifications(data);
    };

    const handleRefresh = async () => {
        if (!user) return;
        setRefreshing(true);
        // Trigger checks to ensure we have latest alerts
        await checkAllNotifications(user.id);
        await loadNotifications();
        setRefreshing(false);
    };

    useEffect(() => {
        loadNotifications();
        // Also run checks on mount to be proactive
        if (user) checkAllNotifications(user.id).then(loadNotifications);
    }, [user]);

    const handleMarkAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return;
        await markAsRead(id);
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const handleMarkAllRead = async () => {
        if (!user) return;
        await markAllAsRead(user.id);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const handleClearAll = async () => {
        if (!user) return;
        await clearAllNotifications(user.id);
        setNotifications([]);
    };

    const handleNotificationPress = async (notification: Notification) => {
        handleMarkAsRead(notification.id, notification.isRead);

        // Handle navigation based on data
        if (notification.data) {
            if (notification.data.tripId) {
                router.push({ pathname: '/trip/[id]', params: { id: notification.data.tripId } });
            } else if (notification.data.budgetId) {
                // Navigate to budget details (if route exists) or budget list
                router.push({ pathname: '/budget-details/[id]', params: { id: notification.data.budgetId } });
            } else if (notification.data.accountId) {
                router.push({ pathname: '/account-details/[id]', params: { id: notification.data.accountId } });
            }
        }
    };

    const renderItem = ({ item }: { item: Notification }) => {
        const getIconName = () => {
            switch (item.type) {
                case 'invite': return 'account-plus';
                case 'alert': return 'alert-circle';
                case 'info': return 'information';
                default: return 'bell';
            }
        };

        const getIconColor = () => {
            switch (item.type) {
                case 'invite': return theme.colors.primary;
                case 'alert': return '#EF4444';
                case 'info': return theme.colors.secondary;
                default: return theme.colors.text;
            }
        };

        return (
            <View style={styles.itemWrapper}>
                <TouchableOpacity
                    style={[styles.notificationItem]}
                    activeOpacity={0.7}
                    onPress={() => handleNotificationPress(item)}
                >
                    <View style={[styles.iconContainer, { backgroundColor: getIconColor() + '15' }]}>
                        <MaterialCommunityIcons name={getIconName()} size={22} color={getIconColor()} />
                    </View>
                    <View style={styles.contentContainer}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.message} numberOfLines={3}>{item.message}</Text>
                        <Text style={styles.time}>{format(new Date(item.createdAt), 'MMM d, h:mm a')}</Text>
                    </View>
                    {!item.isRead && <View style={styles.unreadDot} />}
                </TouchableOpacity>

                {/* Action Buttons for Invites */}
                {item.type === 'invite' && !item.isRead && (
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            activeOpacity={0.7}
                            onPress={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (item.data?.groupId) {
                                    await rejectGroupInvite(item.data.groupId);
                                    await handleMarkAsRead(item.id, false);
                                }
                            }}
                        >
                            <Text style={styles.rejectButtonText}>Reject</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.acceptButton]}
                            activeOpacity={0.7}
                            onPress={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (item.data?.groupId) {
                                    await acceptGroupInvite(item.data.groupId);
                                    await handleMarkAsRead(item.id, false);
                                    router.push({ pathname: '/group/[id]', params: { id: item.data.groupId } } as any);
                                }
                            }}
                        >
                            <Text style={styles.acceptButtonText}>Accept</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <QSHeader
                title="Notifications"
                showBack
                onBackPress={() => router.back()}
                rightElement={
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity onPress={handleMarkAllRead}>
                            <MaterialCommunityIcons name="check-all" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleClearAll}>
                            <MaterialCommunityIcons name="delete-outline" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>
                }
            />

            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="bell-sleep-outline" size={64} color={theme.colors.textSecondary} />
                            <Text style={styles.emptyText}>No notifications yet</Text>
                        </View>
                    ) : null
                }
            />
            {loading && !refreshing && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            )}
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    listContent: {
        padding: theme.spacing.m,
        paddingBottom: 100,
    },
    itemWrapper: {
        marginBottom: theme.spacing.m,
        backgroundColor: theme.colors.card,
        borderRadius: 20,
        ...theme.shadows.medium,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: theme.spacing.m,
        alignItems: 'flex-start',
    },
    unreadItem: {
        backgroundColor: theme.colors.card,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.primary,
        position: 'absolute',
        top: 16,
        right: 16,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.m,
    },
    contentContainer: {
        flex: 1,
        paddingRight: 16, // Space for unread dot
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 4,
        lineHeight: 22,
    },
    message: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 8,
        lineHeight: 20,
    },
    time: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        opacity: 0.6,
        fontWeight: '500',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: theme.spacing.m,
        paddingBottom: theme.spacing.m,
        paddingTop: 0,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        gap: 8,
    },
    rejectButton: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.error + '50',
    },
    acceptButton: {
        backgroundColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    rejectButtonText: {
        color: theme.colors.error,
        fontWeight: '600',
        fontSize: 15,
    },
    acceptButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        gap: theme.spacing.m,
    },
    emptyText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    },
    loader: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default QSNotificationsScreen;
