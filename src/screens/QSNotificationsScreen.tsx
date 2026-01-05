import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, isToday, isYesterday } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    const [activeTab, setActiveTab] = useState<'All' | 'Alerts' | 'Updates'>('All');

    const loadNotifications = async () => {
        if (!user) return;
        const data = await getNotifications(user.id);
        setNotifications(data);
    };

    const handleRefresh = async () => {
        if (!user) return;
        setRefreshing(true);
        await checkAllNotifications(user.id);
        await loadNotifications();
        setRefreshing(false);
    };

    useEffect(() => {
        loadNotifications();
        if (user) checkAllNotifications(user.id).then(loadNotifications);
    }, [user]);

    const filteredNotifications = useMemo(() => {
        if (activeTab === 'All') return notifications;
        if (activeTab === 'Alerts') {
            return notifications.filter(n => n.type === 'alert' || n.type === 'security');
        }
        if (activeTab === 'Updates') {
            return notifications.filter(n => n.type === 'info' || n.type === 'success' || n.type === 'invite');
        }
        return notifications;
    }, [notifications, activeTab]);

    const groupedNotifications = useMemo(() => {
        const groups: { title: string; data: Notification[] }[] = [
            { title: 'Today', data: [] },
            { title: 'Yesterday', data: [] },
            { title: 'Earlier', data: [] }
        ];

        filteredNotifications.forEach(n => {
            const date = new Date(n.createdAt);
            if (isToday(date)) {
                groups[0].data.push(n);
            } else if (isYesterday(date)) {
                groups[1].data.push(n);
            } else {
                groups[2].data.push(n);
            }
        });

        return groups.filter(g => g.data.length > 0);
    }, [filteredNotifications]);

    const handleMarkAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return;
        await markAsRead(id);
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

        if (notification.data) {
            if (notification.data.tripId) {
                router.push({ pathname: '/trip/[id]', params: { id: notification.data.tripId } });
            } else if (notification.data.budgetId) {
                router.push({ pathname: '/budget-details/[id]', params: { id: notification.data.budgetId } });
            } else if (notification.data.accountId) {
                router.push({ pathname: '/account-details/[id]', params: { id: notification.data.accountId } });
            }
        }
    };

    const renderItem = ({ item }: { item: Notification }) => {
        const getIconData = () => {
            switch (item.type) {
                case 'security': return { name: 'security', color: '#EF4444', bgColor: '#EF444415' };
                case 'alert': return { name: 'alert-circle', color: '#F59E0B', bgColor: '#F59E0B15' };
                case 'invite': return { name: 'account-plus', color: theme.colors.primary, bgColor: theme.colors.primary + '15' };
                case 'success': return { name: 'trophy', color: '#10B981', bgColor: '#10B98115' };
                case 'info':
                    if (item.data?.type === 'bill') return { name: 'receipt', color: '#3B82F6', bgColor: '#3B82F615' };
                    if (item.data?.type === 'subscription') return { name: 'card-bulleted', color: '#8B5CF6', bgColor: '#8B5CF615' };
                    return { name: 'information', color: theme.colors.secondary, bgColor: theme.colors.secondary + '15' };
                default: return { name: 'bell', color: theme.colors.text, bgColor: theme.colors.border };
            }
        };

        const icon = getIconData();

        return (
            <View style={styles.itemWrapper}>
                <TouchableOpacity
                    style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
                    activeOpacity={0.7}
                    onPress={() => handleNotificationPress(item)}
                >
                    {!item.isRead && <View style={styles.unreadDot} />}
                    <View style={[styles.iconContainer, { backgroundColor: icon.bgColor }]}>
                        <MaterialCommunityIcons name={icon.name as any} size={24} color={icon.color} />
                    </View>
                    <View style={styles.contentContainer}>
                        <View style={styles.titleRow}>
                            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                            <Text style={styles.time}>{format(new Date(item.createdAt), 'h:mm a')}</Text>
                        </View>
                        <Text style={styles.message} numberOfLines={3}>{item.message}</Text>

                        {/* Contextual Buttons */}
                        {item.type === 'security' && (
                            <View style={styles.contextButtons}>
                                <TouchableOpacity style={[styles.smallButton, styles.denyButton]}>
                                    <Text style={styles.denyButtonText}>Deny</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.smallButton, styles.allowButton]}>
                                    <Text style={styles.allowButtonText}>Yes, it was me</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {item.data?.type === 'bill' && (
                            <TouchableOpacity style={styles.payNowButton}>
                                <Text style={styles.payNowButtonText}>Pay Now</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </TouchableOpacity>

                {/* Action Buttons for Invites */}
                {item.type === 'invite' && !item.isRead && (
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={async () => {
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
                            onPress={async () => {
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
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.headerActionButton} onPress={handleMarkAllRead}>
                            <MaterialCommunityIcons name="check-all" size={24} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerActionButton} onPress={handleClearAll}>
                            <MaterialCommunityIcons name="delete-sweep-outline" size={24} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Filter Tabs */}
            <View style={styles.tabsWrapper}>
                <View style={styles.tabsContainer}>
                    {(['All', 'Alerts', 'Updates'] as const).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
                }
            >
                {groupedNotifications.length === 0 && !loading && (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="bell-sleep-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={styles.emptyText}>No notifications yet</Text>
                    </View>
                )}

                {groupedNotifications.map((group) => (
                    <View key={group.title} style={styles.groupContainer}>
                        <Text style={styles.groupHeader}>{group.title.toUpperCase()}</Text>
                        {group.data.map((item) => (
                            <View key={item.id}>
                                {renderItem({ item })}
                            </View>
                        ))}
                    </View>
                ))}
            </ScrollView>

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
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerActionButton: {
        padding: 6,
    },
    markAllReadContainer: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    markAllReadText: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '700',
    },
    tabsWrapper: {
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.m,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: theme.isDark ? '#1A232E' : '#E2E8F0',
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: theme.isDark ? '#2C3B4E' : '#FFFFFF',
        ...theme.shadows.small,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    activeTabText: {
        color: theme.colors.primary,
    },
    listContent: {
        paddingHorizontal: theme.spacing.m,
        paddingBottom: 100,
    },
    groupContainer: {
        marginBottom: theme.spacing.l,
    },
    groupHeader: {
        fontSize: 12,
        fontWeight: '800',
        color: theme.colors.textSecondary,
        marginBottom: 12,
        letterSpacing: 1,
        marginLeft: 4,
    },
    itemWrapper: {
        marginBottom: 12,
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.isDark ? '#27272a30' : '#E2E8F0',
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'flex-start',
    },
    unreadItem: {
        // Subtle indicator if needed
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.primary,
        position: 'absolute',
        top: 14,
        right: 14,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    contentContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
        paddingRight: 12, // Space for unread dot
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
        flex: 1,
    },
    message: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        lineHeight: 20,
        marginBottom: 8,
    },
    time: {
        fontSize: 12,
        color: theme.colors.textTertiary,
        fontWeight: '500',
        marginLeft: 8,
    },
    contextButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    smallButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    denyButton: {
        backgroundColor: '#EF444415',
    },
    allowButton: {
        backgroundColor: theme.isDark ? '#374151' : '#F3F4F6',
    },
    denyButtonText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '700',
    },
    allowButtonText: {
        color: theme.colors.text,
        fontSize: 12,
        fontWeight: '700',
    },
    payNowButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginTop: 4,
        ...theme.shadows.small,
    },
    payNowButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    actionButton: {
        flex: 1,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
    },
    rejectButton: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    acceptButton: {
        backgroundColor: theme.colors.primary,
    },
    rejectButtonText: {
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    acceptButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        gap: theme.spacing.m,
    },
    emptyText: {
        fontSize: 16,
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
