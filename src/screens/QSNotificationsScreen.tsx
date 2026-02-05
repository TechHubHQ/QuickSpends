import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, isToday, isYesterday } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { QSHeader } from '../components/QSHeader';
import { useAuth } from '../context/AuthContext';
import { useGroups } from '../hooks/useGroups';
import { Notification, useNotifications } from '../hooks/useNotifications';
import { useTheme } from '../theme/ThemeContext';
import { Theme } from '../theme/theme';

const DUST_PIECES = [
    { x: 0.1, y: 0.18, size: 8, driftX: -22, driftY: -14, rotate: -26 },
    { x: 0.2, y: 0.28, size: 7, driftX: -18, driftY: -20, rotate: 18 },
    { x: 0.34, y: 0.2, size: 9, driftX: 12, driftY: -24, rotate: 12 },
    { x: 0.48, y: 0.28, size: 7, driftX: 22, driftY: -14, rotate: 24 },
    { x: 0.62, y: 0.22, size: 8, driftX: 28, driftY: -22, rotate: 20 },
    { x: 0.76, y: 0.3, size: 7, driftX: 30, driftY: -10, rotate: -18 },
    { x: 0.22, y: 0.5, size: 9, driftX: -20, driftY: 10, rotate: -12 },
    { x: 0.36, y: 0.58, size: 7, driftX: -12, driftY: 18, rotate: 10 },
    { x: 0.5, y: 0.54, size: 10, driftX: 10, driftY: 16, rotate: -8 },
    { x: 0.64, y: 0.6, size: 7, driftX: 18, driftY: 14, rotate: 16 },
    { x: 0.78, y: 0.64, size: 8, driftX: 26, driftY: 20, rotate: -20 },
    { x: 0.88, y: 0.48, size: 6, driftX: 32, driftY: 8, rotate: 22 },
    { x: 0.16, y: 0.4, size: 6, driftX: -30, driftY: -2, rotate: -30 },
    { x: 0.3, y: 0.72, size: 6, driftX: -14, driftY: 28, rotate: 14 },
    { x: 0.58, y: 0.7, size: 6, driftX: 18, driftY: 26, rotate: -10 },
    { x: 0.7, y: 0.4, size: 7, driftX: 26, driftY: -6, rotate: 12 },
    { x: 0.42, y: 0.78, size: 5, driftX: -4, driftY: 30, rotate: 8 },
    { x: 0.9, y: 0.7, size: 5, driftX: 34, driftY: 24, rotate: -24 },
];

const SNAP_SHARDS = [
    { x: 0.02, y: 0.02, w: 0.22, h: 0.28, driftX: 46, driftY: -10, rotate: -8 },
    { x: 0.24, y: 0.0, w: 0.22, h: 0.3, driftX: 54, driftY: -18, rotate: 10 },
    { x: 0.46, y: 0.04, w: 0.2, h: 0.28, driftX: 62, driftY: -8, rotate: -6 },
    { x: 0.66, y: 0.02, w: 0.2, h: 0.3, driftX: 70, driftY: -12, rotate: 14 },
    { x: 0.84, y: 0.06, w: 0.14, h: 0.24, driftX: 80, driftY: -6, rotate: 18 },
    { x: 0.06, y: 0.32, w: 0.24, h: 0.26, driftX: 42, driftY: 6, rotate: -12 },
    { x: 0.3, y: 0.34, w: 0.22, h: 0.26, driftX: 52, driftY: 10, rotate: 8 },
    { x: 0.52, y: 0.32, w: 0.2, h: 0.28, driftX: 64, driftY: 6, rotate: -10 },
    { x: 0.72, y: 0.34, w: 0.22, h: 0.26, driftX: 76, driftY: 12, rotate: 12 },
    { x: 0.08, y: 0.62, w: 0.24, h: 0.28, driftX: 36, driftY: 20, rotate: -16 },
    { x: 0.34, y: 0.62, w: 0.24, h: 0.28, driftX: 52, driftY: 24, rotate: 10 },
    { x: 0.6, y: 0.62, w: 0.24, h: 0.28, driftX: 68, driftY: 22, rotate: -12 },
    { x: 0.82, y: 0.62, w: 0.16, h: 0.26, driftX: 86, driftY: 26, rotate: 20 },
];

const MOCK_NOTIFICATION: Notification = {
    id: 'mock-local-1',
    userId: 'mock-user',
    type: 'info',
    title: 'Test notification',
    message: 'This is a mock notification for swipe testing.',
    data: { type: 'mock' },
    isRead: false,
    createdAt: new Date().toISOString()
};

type NotificationRowProps = {
    item: Notification;
    theme: Theme;
    styles: ReturnType<typeof createStyles>;
    bulkReadKey: number;
    bulkDeleteKey: number;
    bulkIndex: number;
    onPress: (notification: Notification) => void;
    onMarkRead: (id: string, isRead: boolean) => Promise<void> | void;
    onDeleteRemote: (id: string) => Promise<void> | void;
    onRemoveLocal: (id: string) => void;
    onRejectInvite: (notification: Notification) => Promise<void>;
    onAcceptInvite: (notification: Notification) => Promise<void>;
};

const NotificationRow = ({
    item,
    theme,
    styles,
    bulkReadKey,
    bulkDeleteKey,
    bulkIndex,
    onPress,
    onMarkRead,
    onDeleteRemote,
    onRemoveLocal,
    onRejectInvite,
    onAcceptInvite
}: NotificationRowProps) => {
    const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);
    const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
    const [showDust, setShowDust] = useState(false);
    const [showSnap, setShowSnap] = useState(false);
    const isDeletingRef = useRef(false);

    const rowOpacity = useRef(new Animated.Value(1)).current;
    const rowScale = useRef(new Animated.Value(1)).current;
    const rowTranslateY = useRef(new Animated.Value(0)).current;
    const rowTranslateX = useRef(new Animated.Value(0)).current;
    const rowRotate = useRef(new Animated.Value(0)).current;
    const rowHeight = useRef(new Animated.Value(0)).current;
    const readPulse = useRef(new Animated.Value(0)).current;
    const snapProgress = useRef(new Animated.Value(0)).current;
    const pieceAnimations = useMemo(() => DUST_PIECES.map(() => new Animated.Value(0)), []);

        const dustScale = layout ? Math.max(1.3, Math.min(2.0, layout.width / 240)) : 1.7;
        const dustDriftBoost = 3.2;
        const dustSizeBoost = 1.8;
    const dustColor = theme.isDark ? 'rgba(248,250,252,0.8)' : 'rgba(30,41,59,0.55)';

    const handleLayout = (event: any) => {
        if (isDeletingRef.current) return;
        const { width, height } = event.nativeEvent.layout;
        if (!layout || layout.width !== width || layout.height !== height) {
            setLayout({ width, height });
        }
        if (!measuredHeight || Math.abs(measuredHeight - height) > 0.5) {
            setMeasuredHeight(height);
            rowHeight.setValue(height);
        }
    };

    const playReadAnimation = (delayMs = 0) => {
        readPulse.stopAnimation();
        readPulse.setValue(0);
        Animated.sequence([
            Animated.delay(delayMs),
            Animated.timing(readPulse, {
                toValue: 1,
                duration: 260,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false
            }),
            Animated.timing(readPulse, {
                toValue: 0,
                duration: 420,
                easing: Easing.inOut(Easing.cubic),
                useNativeDriver: false
            }),
        ]).start();
    };

    const handleReadAction = () => {
        if (!item.isRead) {
            playReadAnimation();
        }
        onMarkRead(item.id, item.isRead);
    };

    const handlePress = () => {
        if (!item.isRead) {
            playReadAnimation();
        }
        onPress(item);
    };

    const startDeleteAnimation = (options?: { skipRemote?: boolean; delayMs?: number }) => {
        const delayMs = options?.delayMs ?? 0;
        if (isDeletingRef.current) return;
        isDeletingRef.current = true;

        if (!options?.skipRemote) {
            onDeleteRemote(item.id);
        }

        const dustAnimations = pieceAnimations.map((anim, index) =>
            Animated.timing(anim, {
                toValue: 1,
                duration: 1200 + index * 24,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true
            })
        );

        const snapAnim = Animated.timing(snapProgress, {
            toValue: 1,
            duration: 980,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
        });

        const fadeOut = Animated.timing(rowOpacity, {
            toValue: 0,
            duration: 900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
            delay: 160
        });

        const scaleDown = Animated.timing(rowScale, {
            toValue: 0.58,
            duration: 900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
            delay: 160
        });

        const driftUp = Animated.timing(rowTranslateY, {
            toValue: -64,
            duration: 900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
            delay: 160
        });

        const driftSide = Animated.timing(rowTranslateX, {
            toValue: -44,
            duration: 720,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
            delay: 160
        });

        const rotateOut = Animated.timing(rowRotate, {
            toValue: 1,
            duration: 820,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
            delay: 160
        });

        const collapse = Animated.timing(rowHeight, {
            toValue: 0,
            duration: 520,
            delay: 720,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: false
        });

        setTimeout(() => {
            setShowDust(true);
            setShowSnap(true);
            snapProgress.setValue(0);
            Animated.parallel([
                Animated.stagger(30, dustAnimations),
                snapAnim,
                fadeOut,
                scaleDown,
                driftUp,
                driftSide,
                rotateOut,
                collapse
            ]).start(() => {
                onRemoveLocal(item.id);
            });
        }, delayMs);
    };

    const handleSwipeAction = (direction: 'left' | 'right', swipeable?: Swipeable) => {
        if (direction === 'left') {
            handleReadAction();
            swipeable?.close();
            return;
        }
        startDeleteAnimation();
    };

    const RowBody = ({ interactive }: { interactive: boolean }) => (
        <View pointerEvents={interactive ? 'auto' : 'none'}>
            <TouchableOpacity
                style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
                activeOpacity={interactive ? 0.7 : 1}
                onPress={interactive ? handlePress : undefined}
            >
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.readPulse,
                        {
                            opacity: readPulse.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: [0, 0.7, 0]
                            }),
                            transform: [
                                {
                                    scale: readPulse.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [1, 1.12]
                                    })
                                }
                            ]
                        }
                    ]}
                />
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
                        onPress={interactive ? () => onRejectInvite(item) : undefined}
                    >
                        <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={interactive ? () => onAcceptInvite(item) : undefined}
                    >
                        <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    useEffect(() => {
        if (bulkReadKey > 0) {
            playReadAnimation(bulkIndex * 28);
        }
    }, [bulkReadKey, bulkIndex]);

    useEffect(() => {
        if (bulkDeleteKey > 0) {
            startDeleteAnimation({ skipRemote: true, delayMs: bulkIndex * 40 });
        }
    }, [bulkDeleteKey, bulkIndex]);

    const icon = useMemo(() => {
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
    }, [item, theme]);

    return (
        <Animated.View
            style={[
                styles.itemWrapper,
                {
                    opacity: rowOpacity,
                    transform: [
                        { translateY: rowTranslateY },
                        { translateX: rowTranslateX },
                        {
                            rotateZ: rowRotate.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '-16deg']
                            })
                        },
                        { scale: rowScale }
                    ],
                    height: measuredHeight ? rowHeight : undefined
                }
            ]}
            onLayout={handleLayout}
        >
            {showSnap && layout && (
                <View style={styles.snapLayer} pointerEvents="none">
                    {SNAP_SHARDS.map((shard, index) => {
                        const sliceWidth = layout.width * shard.w;
                        const sliceHeight = layout.height * shard.h;
                        const sliceLeft = layout.width * shard.x;
                        const sliceTop = layout.height * shard.y;
                        const translateX = snapProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, shard.driftX * dustScale]
                        });
                        const translateY = snapProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, shard.driftY * dustScale]
                        });
                        const rotate = snapProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', `${shard.rotate}deg`]
                        });
                        const opacity = snapProgress.interpolate({
                            inputRange: [0, 0.7, 1],
                            outputRange: [1, 0.8, 0]
                        });
                        const scale = snapProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 0.25]
                        });

                        return (
                            <Animated.View
                                key={`snap-${index}`}
                                style={[
                                    styles.snapShard,
                                    {
                                        width: sliceWidth,
                                        height: sliceHeight,
                                        left: sliceLeft,
                                        top: sliceTop,
                                        opacity,
                                        transform: [{ translateX }, { translateY }, { rotate }, { scale }]
                                    }
                                ]}
                            >
                                <View style={{ position: 'absolute', left: -sliceLeft, top: -sliceTop, width: layout.width, height: layout.height }}>
                                    <View style={styles.snapCard}>
                                        <RowBody interactive={false} />
                                    </View>
                                </View>
                            </Animated.View>
                        );
                    })}
                </View>
            )}
            {showDust && layout && (
                <View style={styles.dustLayer} pointerEvents="none">
                    {DUST_PIECES.map((piece, index) => {
                        const progress = pieceAnimations[index];
                        const translateX = progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, piece.driftX * dustScale * dustDriftBoost]
                        });
                        const translateY = progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, piece.driftY * dustScale * dustDriftBoost]
                        });
                        const rotate = progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', `${piece.rotate}deg`]
                        });
                        const opacity = progress.interpolate({
                            inputRange: [0, 0.6, 1],
                            outputRange: [1, 0.8, 0]
                        });
                        const scale = progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 0.2]
                        });
                        const size = piece.size * dustScale * dustSizeBoost;
                        const left = layout.width * piece.x - size / 2;
                        const top = layout.height * piece.y - size / 2;

                        return (
                            <Animated.View
                                key={`dust-${index}`}
                                style={[
                                    styles.dustPiece,
                                    {
                                        backgroundColor: dustColor,
                                        width: size,
                                        height: size,
                                        left,
                                        top,
                                        opacity,
                                        transform: [{ translateX }, { translateY }, { rotate }, { scale }]
                                    }
                                ]}
                            />
                        );
                    })}
                </View>
            )}

            <Swipeable
                enabled={!showDust && !showSnap}
                containerStyle={styles.swipeableContainer}
                leftThreshold={28}
                rightThreshold={28}
                dragOffsetFromLeftEdge={10}
                dragOffsetFromRightEdge={10}
                friction={1.4}
                overshootLeft={false}
                overshootRight={false}
                renderLeftActions={() => (
                    <View style={[styles.swipeAction, styles.swipeActionRead]}>
                        <MaterialCommunityIcons name="check" size={22} color="#FFFFFF" />
                        <Text style={styles.swipeActionText}>{item.isRead ? 'Read' : 'Mark Read'}</Text>
                    </View>
                )}
                renderRightActions={() => (
                    <View style={[styles.swipeAction, styles.swipeActionDelete]}>
                        <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FFFFFF" />
                        <Text style={styles.swipeActionText}>Delete</Text>
                    </View>
                )}
                onSwipeableWillOpen={(direction) => {
                    handleSwipeAction(direction);
                }}
                onSwipeableOpen={(direction, swipeable) => {
                    handleSwipeAction(direction, swipeable);
                }}
            >
                <RowBody interactive />
            </Swipeable>
        </Animated.View>
    );
};

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
        deleteNotification,
        clearAllNotifications,
        checkAllNotifications,
        loading
    } = useNotifications();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'All' | 'Alerts' | 'Updates'>('All');
    const [bulkReadKey, setBulkReadKey] = useState(0);
    const [bulkDeleteKey, setBulkDeleteKey] = useState(0);
    const bulkDeleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const loadNotifications = async () => {
        if (!user) return;
        const data = await getNotifications(user.id);
        const merged = __DEV__ ? [MOCK_NOTIFICATION, ...data] : data;
        setNotifications(merged);
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

    useEffect(() => {
        return () => {
            if (bulkDeleteTimeoutRef.current) {
                clearTimeout(bulkDeleteTimeoutRef.current);
            }
        };
    }, []);

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
        if (id.startsWith('mock-')) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            return;
        }
        await markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const handleMarkAllRead = async () => {
        if (!user) return;
        setBulkReadKey(prev => prev + 1);
        await markAllAsRead(user.id);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const removeNotificationFromState = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleDeleteNotificationRemote = async (id: string) => {
        if (id.startsWith('mock-')) return;
        await deleteNotification(id);
    };

    const handleClearAll = async () => {
        if (!user) return;
        if (notifications.length > 0) {
            setBulkDeleteKey(prev => prev + 1);
            const clearDelay = Math.min(6000, 2200 + notifications.length * 80);
            if (bulkDeleteTimeoutRef.current) {
                clearTimeout(bulkDeleteTimeoutRef.current);
            }
            bulkDeleteTimeoutRef.current = setTimeout(() => {
                setNotifications([]);
            }, clearDelay);
        }
        await clearAllNotifications(user.id);
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

    const handleRejectInvite = async (notification: Notification) => {
        if (notification.data?.groupId) {
            await rejectGroupInvite(notification.data.groupId);
            await handleMarkAsRead(notification.id, false);
        }
    };

    const handleAcceptInvite = async (notification: Notification) => {
        if (notification.data?.groupId) {
            await acceptGroupInvite(notification.data.groupId);
            await handleMarkAsRead(notification.id, false);
            router.push({ pathname: '/group/[id]', params: { id: notification.data.groupId } } as any);
        }
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

                {(() => {
                    let bulkIndex = 0;
                    return groupedNotifications.map((group) => (
                        <View key={group.title} style={styles.groupContainer}>
                            <Text style={styles.groupHeader}>{group.title.toUpperCase()}</Text>
                            {group.data.map((item) => {
                                const currentIndex = bulkIndex++;
                                return (
                                    <NotificationRow
                                        key={item.id}
                                        item={item}
                                        theme={theme}
                                        styles={styles}
                                        bulkReadKey={bulkReadKey}
                                        bulkDeleteKey={bulkDeleteKey}
                                        bulkIndex={currentIndex}
                                        onPress={handleNotificationPress}
                                        onMarkRead={handleMarkAsRead}
                                        onDeleteRemote={handleDeleteNotificationRemote}
                                        onRemoveLocal={removeNotificationFromState}
                                        onRejectInvite={handleRejectInvite}
                                        onAcceptInvite={handleAcceptInvite}
                                    />
                                );
                            })}
                        </View>
                    ));
                })()}
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
        position: 'relative',
        overflow: 'visible',
    },
    swipeableContainer: {
        flex: 1,
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.isDark ? '#27272a30' : '#E2E8F0',
    },
    dustLayer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 4,
    },
    dustPiece: {
        position: 'absolute',
        borderRadius: 999,
    },
    snapLayer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 3,
    },
    snapShard: {
        position: 'absolute',
        overflow: 'hidden',
        borderRadius: 10,
    },
    snapCard: {
        flex: 1,
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.isDark ? '#27272a30' : '#E2E8F0',
    },
    swipeAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: 112,
        height: '100%',
    },
    swipeActionRead: {
        backgroundColor: theme.colors.primary,
    },
    swipeActionDelete: {
        backgroundColor: '#EF4444',
    },
    swipeActionText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    readPulse: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: theme.colors.primary,
        borderRadius: 16,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'flex-start',
        position: 'relative',
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
