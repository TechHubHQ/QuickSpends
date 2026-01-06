
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, FadeInRight, FadeInUp } from "react-native-reanimated";
import { Defs, LinearGradient, Path, Stop, Svg } from "react-native-svg";
import { Avatar } from "../components/Avatar";
import { AlertButton, QSAlertModal } from "../components/QSAlertModal";
import { QSHeader } from "../components/QSHeader";
import { QSMemberSheet } from "../components/QSMemberSheet";
import { QSTransactionIndicators } from "../components/QSTransactionIndicators";
import { useAuth } from "../context/AuthContext";
import { useGroups } from "../hooks/useGroups";
import { useNotifications } from "../hooks/useNotifications";
import { useTheme } from "../theme/ThemeContext";
import { getSafeIconName } from "../utils/iconMapping";

interface GroupDetails {
    id: string;
    name: string;
    members: any[];
    transactions: any[];
    stats: {
        totalSpend: number;
        myBalance: number;
        myPaid: number;
        myShare: number;
    };
    created_at: string;
    created_by: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function QSGroupDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { theme } = useTheme();
    const { user } = useAuth();
    const { getGroupDetails, addMembersToGroup, acceptGroupInvite, deleteGroup } = useGroups();
    const { sendInvite } = useNotifications();

    const [group, setGroup] = useState<GroupDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterUserId, setFilterUserId] = useState<string | null>(null);
    const [sortOption, setSortOption] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
    const [showFilters, setShowFilters] = useState(false);
    const [showInviteSheet, setShowInviteSheet] = useState(false);

    // Generic Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message?: string;
        buttons?: AlertButton[];
    }>({
        visible: false,
        title: "",
    });

    const showAlert = (title: string, message?: string, buttons?: AlertButton[]) => {
        setAlertConfig({ visible: true, title, message, buttons });
    };

    const hideAlert = () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
    };


    const fetchDetails = useCallback(async () => {
        if (id && user) {
            let details = await getGroupDetails(id as string, user.id);
            setGroup(details);
            setLoading(false);
        }
    }, [id, user, getGroupDetails]);

    useFocusEffect(
        useCallback(() => {
            fetchDetails();
        }, [fetchDetails])
    );

    const handleMembersAdd = async (newMembers: { name: string, email: string, id?: string }[]) => {
        if (!group || newMembers.length === 0 || !user) return;

        await addMembersToGroup(group.id, newMembers);

        // Send Invites to each new member
        for (const member of newMembers) {
            await sendInvite(user.username, member.email, group.name, group.id);
        }

        await fetchDetails(); // Refresh to show new members
    };

    const handleDeleteGroup = async () => {
        showAlert(
            "Delete Group",
            "Are you sure you want to delete this group? This action cannot be undone and will remove all members and transactions.",
            [
                { text: "Cancel", style: "cancel", onPress: hideAlert },
                { text: "Delete", style: "destructive", onPress: confirmDeleteGroup }
            ]
        );
    };

    const confirmDeleteGroup = async () => {
        if (group && group.id) {
            try {
                await deleteGroup(group.id);
                router.back();
            } catch (error: any) {
                showAlert("Error", error.message);
            }
        }
        hideAlert();
    };

    // Chart Data Generation
    const chartPath = useMemo(() => {
        if (!group) return "";

        // Sort transactions by date ascending for the chart
        const sorted = [...group.transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let points: { x: number, y: number }[] = [];

        if (sorted.length === 0) {
            // No transactions, flat line at 0
            points = [{ x: 0, y: 0 }, { x: 300, y: 0 }];
        } else if (sorted.length === 1) {
            // 1 transaction, flat line at simple y
            // Since we normalize Y, we can just use dummy values to drawing a straight line
            points = [{ x: 0, y: sorted[0].amount }, { x: 300, y: sorted[0].amount }];
        } else {
            // Group by Date for Daily Spending Trend
            const byDate: Record<string, number> = {};

            sorted.forEach(t => {
                const dateKey = new Date(t.date).toISOString().split('T')[0];
                byDate[dateKey] = (byDate[dateKey] || 0) + t.amount;
            });

            const dates = Object.keys(byDate).sort();

            // If less than 2 days, maybe show single point or flat line
            if (dates.length === 0) {
                points = [{ x: 0, y: 0 }, { x: 300, y: 0 }];
            } else if (dates.length === 1) {
                const am = byDate[dates[0]];
                points = [{ x: 0, y: am }, { x: 300, y: am }];
            } else {
                points = dates.map((d, index) => ({
                    x: index,
                    y: byDate[d]
                }));
            }
        }

        if (points.length === 0) return "";

        // Normalize to SVG coordinates (ViewBox 300x100 approx)
        const width = 300;
        const height = 80;

        // Find min/max for scaling
        // X depends on index or time? Using index for even spacing as simple sparkline
        const minX = 0;
        const maxX = points.length > 1 ? points.length - 1 : 1;

        const maxVal = Math.max(...points.map(p => p.y));
        const maxY = maxVal > 0 ? maxVal * 1.2 : 100; // Headroom

        // Helper for Bezier control points
        const getControlPoint = (current: any, previous: any, next: any, reverse: boolean) => {
            const p = previous || current;
            const n = next || current;
            const smoothing = 0.2;
            const o = { x: n.x - p.x, y: n.y - p.y }; // line properties
            const angle = Math.atan2(o.y, o.x) + (reverse ? Math.PI : 0);
            const length = Math.sqrt(Math.pow(o.x, 2) + Math.pow(o.y, 2)) * smoothing;
            return {
                x: current.x + Math.cos(angle) * length,
                y: current.y + Math.sin(angle) * length
            };
        };

        // Scale points to SVG dimensions
        const svgPoints = points.map((p, i) => {
            // If we had time-based X: (p.time - minTime) / (maxTime - minTime) * width
            // Here we use index-based X: (i / maxX) * width
            // But if we have 1 point, maxX is 1?
            // If sorted.length == 1, we manually created 2 points at x=0 and x=300

            const x = sorted.length <= 1 ? p.x : (i / maxX) * width;
            const y = height - (p.y / maxY) * height;
            return { x, y };
        });

        const path = svgPoints.reduce((acc, point, i, a) => {
            if (i === 0) return `M ${point.x},${point.y}`;

            const cps = getControlPoint(a[i - 1], a[i - 2], point, false);
            const cpe = getControlPoint(point, a[i - 1], a[i + 1], true);

            return `${acc} C ${cps.x},${cps.y} ${cpe.x},${cpe.y} ${point.x},${point.y}`;
        }, "");

        return path;

    }, [group]);

    const filteredTransactions = useMemo(() => {
        if (!group) return [];
        let result = [...group.transactions];

        // Filter by User
        if (filterUserId) {
            result = result.filter(t => t.user_id === filterUserId);
        }

        // Sort
        result.sort((a, b) => {
            switch (sortOption) {
                case 'date_asc':
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'date_desc':
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                case 'amount_asc':
                    return a.amount - b.amount;
                case 'amount_desc':
                    return b.amount - a.amount;
                default:
                    return 0;
            }
        });

        return result;
    }, [group, filterUserId, sortOption]);


    const styles = useMemo(() => createStyles(theme), [theme]);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!group) {
        return (
            <View style={styles.container}>
                <Text style={{ color: theme.colors.text }}>Group not found</Text>
            </View>
        );
    }

    const { stats, members, transactions } = group;
    // ... (rest of logic) ...
    const isSettled = Math.abs(stats.myBalance) < 1;
    const isOwed = stats.myBalance > 0;

    let balanceColor = theme.colors.error; // Default to red
    let iconName: keyof typeof MaterialIcons.glyphMap = "trending-down";
    let badgeBg = theme.isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    let badgeBorder = theme.isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.2)';

    if (isSettled) {
        balanceColor = theme.colors.textSecondary; // Dynamic
        iconName = "check-circle";
        badgeBg = theme.isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)';
        badgeBorder = theme.isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.3)';
    } else if (isOwed) {
        balanceColor = theme.colors.success;
        iconName = "trending-up";
        badgeBg = theme.isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(72, 187, 120, 0.1)';
        badgeBorder = theme.isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(72, 187, 120, 0.2)';
    }

    const balanceText = isSettled
        ? "Settled up"
        : (isOwed ? `You are owed ₹${Math.abs(stats.myBalance).toFixed(0)}` : `You owe ₹${Math.abs(stats.myBalance).toFixed(0)}`);


    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <QSHeader
                    title={group.name}
                    showBack={true}
                    onBackPress={() => router.back()}
                    rightIcon="cog"
                    onRightPress={() => { }}
                    style={{ marginBottom: 8 }}
                />

                {/* Hero Stats Card */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroCard}>
                    {/* Background Gradient */}
                    <View style={[StyleSheet.absoluteFill, { borderRadius: 24, overflow: 'hidden' }]}>
                        <ExpoLinearGradient
                            colors={['#137fec', '#1068c4', '#0d54a1']} // Vibrant Blue Gradient
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ flex: 1 }}
                        />
                    </View>

                    <View style={styles.heroContent}>
                        <View>
                            <Text style={[styles.heroSubtitle, { color: 'rgba(255, 255, 255, 0.7)' }]}>Total Group Spend</Text>
                            <Text style={[styles.heroAmount, { color: '#FFFFFF' }]}>{formatCurrency(stats.totalSpend)}</Text>
                            <View style={[styles.balanceBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
                                <MaterialIcons
                                    name={iconName}
                                    size={16}
                                    color={balanceColor}
                                />
                                <Text style={[styles.balanceText, { color: balanceColor }]}>{balanceText}</Text>
                            </View>
                        </View>

                        {/* Chart */}
                        <View style={styles.chartContainer}>
                            <Svg width="100%" height="100%" viewBox="0 0 300 80" preserveAspectRatio="none">
                                <Defs>
                                    <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                        <Stop offset="0" stopColor="#137fec" stopOpacity="0.3" />
                                        <Stop offset="1" stopColor="#137fec" stopOpacity="0" />
                                    </LinearGradient>
                                </Defs>
                                {chartPath ? (
                                    <>
                                        <Path
                                            d={`${chartPath} L 300,80 L 0,80 Z`}
                                            fill="url(#chartGradient)"
                                        />
                                        <Path
                                            d={chartPath}
                                            fill="none"
                                            stroke="#137fec"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                        />
                                    </>
                                ) : (
                                    <Path
                                        d="M0,80 C100,80 150,40 300,40"
                                        fill="none"
                                        stroke="#137fec"
                                        strokeOpacity={0.3}
                                        strokeWidth="3"
                                        strokeDasharray={[5, 5]}
                                    />
                                )}
                            </Svg>
                        </View>
                    </View>
                </Animated.View>

                {/* Quick Actions */}
                <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.quickActions}>
                    <ActionButton icon="add" label="Expense" onPress={() => router.push({ pathname: "/add-transaction", params: { groupId: group.id } })} />
                    <ActionButton icon="call-split" label="Split" onPress={() => router.push({ pathname: `/split-expense/${group.id}` } as any)} />
                    <ActionButton icon="payments" label="Settle Up" onPress={() => router.push({ pathname: `/settle-up/${group.id}` } as any)} />
                    <ActionButton icon="person-add" label="Invite" onPress={() => setShowInviteSheet(true)} />
                </Animated.View>

                {/* Invite Acceptance Banner */}
                {group.members.find(m => m.id === user?.id)?.status === 'invited' && (
                    <View style={{ marginHorizontal: theme.spacing.l, marginBottom: 16, padding: 16, backgroundColor: theme.colors.primary + '15', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text }}>You are invited!</Text>
                            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Join to participate in expenses</Text>
                        </View>
                        <TouchableOpacity
                            style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
                            onPress={async () => {
                                await acceptGroupInvite(group.id);
                                fetchDetails();
                            }}
                        >
                            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Join Group</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Members Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Members ({members.length})</Text>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.memberScrollContent}
                    >
                        {members.map((member, index) => (
                            <Animated.View key={member.id} entering={FadeInRight.delay(300 + index * 50).springify()} style={styles.memberItem}>
                                <View style={styles.avatarContainer}>
                                    <Avatar
                                        seed={member.avatar || member.username}
                                        size={56}
                                        variant="beam"
                                    />
                                    {member.id === user?.id && (
                                        <View style={styles.meBadge}>
                                            <MaterialIcons name="star" size={10} color="#FBBF24" />
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.memberName} numberOfLines={1}>
                                    {member.id === user?.id ? "You" : member.username.split(' ')[0]}
                                </Text>
                                <Text style={[styles.statusText, {
                                    color: member.status === 'invited'
                                        ? theme.colors.warning
                                        : (Math.abs(member.balance) < 1
                                            ? theme.colors.textSecondary
                                            : (member.balance > 0 ? theme.colors.success : theme.colors.error))
                                }]}>
                                    {member.status === 'invited'
                                        ? "Invited"
                                        : (Math.abs(member.balance) < 1
                                            ? "Settled"
                                            : (member.balance > 0 ? `Gets ₹${member.balance.toFixed(0)}` : `Owes ₹${Math.abs(member.balance).toFixed(0)}`))
                                    }
                                </Text>
                            </Animated.View>
                        ))}
                    </ScrollView>
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: '600' }}>
                                {showFilters ? 'Hide Filters' : 'Filter & Sort'}
                            </Text>
                            <MaterialIcons name={showFilters ? "expand-less" : "tune"} size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Expandable Filter Panel */}
                    {showFilters && (
                        <View style={styles.filterPanel}>

                            {/* Sort Section */}
                            <Text style={styles.filterLabel}>Sort By</Text>
                            <View style={styles.filterWrap}>
                                <TouchableOpacity style={[styles.filterChip, sortOption === 'date_desc' && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]} onPress={() => setSortOption('date_desc')}>
                                    <Text style={[styles.filterText, { color: sortOption === 'date_desc' ? '#FFF' : theme.colors.text }]}>Newest First</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.filterChip, sortOption === 'date_asc' && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]} onPress={() => setSortOption('date_asc')}>
                                    <Text style={[styles.filterText, { color: sortOption === 'date_asc' ? '#FFF' : theme.colors.text }]}>Oldest First</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.filterChip, sortOption === 'amount_desc' && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]} onPress={() => setSortOption('amount_desc')}>
                                    <Text style={[styles.filterText, { color: sortOption === 'amount_desc' ? '#FFF' : theme.colors.text }]}>Highest Amount</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.filterChip, sortOption === 'amount_asc' && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]} onPress={() => setSortOption('amount_asc')}>
                                    <Text style={[styles.filterText, { color: sortOption === 'amount_asc' ? '#FFF' : theme.colors.text }]}>Lowest Amount</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 12 }} />

                            {/* User Section */}
                            <Text style={styles.filterLabel}>Filter By User</Text>
                            <View style={styles.filterWrap}>
                                <TouchableOpacity
                                    style={[styles.filterChip, filterUserId === null && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}
                                    onPress={() => setFilterUserId(null)}
                                >
                                    <Text style={[styles.filterText, { color: filterUserId === null ? '#FFF' : theme.colors.text }]}>All Users</Text>
                                </TouchableOpacity>
                                {group?.members.map(m => (
                                    <TouchableOpacity
                                        key={m.id}
                                        style={[styles.filterChip, filterUserId === m.id && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}
                                        onPress={() => setFilterUserId(filterUserId === m.id ? null : m.id)}
                                    >
                                        <Text style={[styles.filterText, { color: filterUserId === m.id ? '#FFF' : theme.colors.text }]}>
                                            {m.id === user?.id ? "You" : m.username.split(' ')[0]}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    <View style={styles.activityContainer}>
                        {filteredTransactions.length > 0 ? filteredTransactions.map((t, i) => (
                            <Animated.View
                                key={t.id}
                                entering={FadeInUp.delay(500 + i * 50).springify()}
                            >
                                <TouchableOpacity
                                    style={[
                                        styles.activityItem,
                                        { borderBottomWidth: i === filteredTransactions.length - 1 ? 0 : 1 }
                                    ]}
                                    onPress={() => router.push({ pathname: "/transaction-details", params: { transaction: JSON.stringify(t) } })}
                                >
                                    <View style={[styles.categoryIcon, { backgroundColor: (t.category_color || theme.colors.primary) + '20' }]}>
                                        <MaterialCommunityIcons
                                            name={getSafeIconName(t.category_icon)}
                                            size={20}
                                            color={t.category_color || theme.colors.primary}
                                        />
                                    </View>
                                    <View style={styles.activityContent}>
                                        <Text style={styles.activityTitle}>{t.name}</Text>
                                        <View style={styles.activityMeta}>
                                            <Text style={styles.activitySubtitle}>
                                                {t.user_id === user?.id ? "You" : t.payer_name} paid • {t.category_name}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                                        <Text style={styles.activityAmount}>₹{t.amount.toFixed(0)}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <QSTransactionIndicators
                                                isSplit={t.is_split}
                                                tripId={t.trip_id}
                                                groupId={t.group_id}
                                                savingsId={t.savings_id}
                                                loanId={t.loan_id}
                                                hideGroup
                                            />
                                            <Text style={styles.activityDate}>{new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        )) : (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: theme.colors.textSecondary }}>No transactions found</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Delete Group Button (Admin Only) */}
                {group.created_by === user?.id && (
                    <TouchableOpacity
                        style={{
                            marginHorizontal: theme.spacing.l,
                            marginTop: 8,
                            padding: 16,
                            backgroundColor: theme.colors.error + '15',
                            borderRadius: 16,
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: theme.colors.error + '30'
                        }}
                        onPress={handleDeleteGroup}
                    >
                        <Text style={{ color: theme.colors.error, fontWeight: '700' }}>Delete Group</Text>
                    </TouchableOpacity>
                )}

            </ScrollView>

            <QSMemberSheet
                visible={showInviteSheet}
                onClose={() => setShowInviteSheet(false)}
                onMembersSelected={handleMembersAdd}
                existingMembers={group?.members.map(m => m.username) || []}
            />

            <QSAlertModal
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={hideAlert}
                buttons={alertConfig.buttons}
            />
        </View >
    );
}

const ActionButton = ({ icon, label, onPress }: { icon: any, label: string, onPress: () => void }) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    return (
        <TouchableOpacity style={styles.actionButtonWrapper} onPress={onPress}>
            <View style={styles.actionButton}>
                <MaterialIcons name={icon} size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionLabel}>{label}</Text>
        </TouchableOpacity>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    heroCard: {
        height: 220,
        borderRadius: 24,
        position: 'relative',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
        marginHorizontal: theme.spacing.l,
        marginTop: 16,
        marginBottom: 24,
    },
    heroContent: {
        flex: 1,
        padding: 24,
        flexDirection: 'column',
        justifyContent: 'space-between'
    },
    heroSubtitle: {
        color: '#94a3b8', // Keep neutral on dark card
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    heroAmount: {
        color: '#ffffff',
        fontSize: 40,
        fontWeight: '700',
        lineHeight: 40,
        marginBottom: 8,
    },
    balanceBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    balanceText: {
        fontSize: 12,
        fontWeight: '700',
    },
    chartContainer: {
        height: 80,
        width: '100%',
        marginTop: 8,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: theme.spacing.l,
        marginBottom: 24,
    },
    actionButtonWrapper: {
        alignItems: 'center',
        gap: 8,
    },
    actionButton: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.card,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    actionLabel: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: '500',
    },
    section: {
        gap: 12,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.l,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
    },
    memberScrollContent: {
        gap: 16,
        paddingHorizontal: theme.spacing.l,
    },
    memberItem: {
        alignItems: 'center',
        width: 60,
        gap: 4,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: theme.colors.background,
    },
    meBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.colors.card,
        borderRadius: 10,
        padding: 4,
        borderWidth: 2,
        borderColor: theme.colors.background,
    },
    memberName: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        color: theme.colors.text,
    },
    statusText: {
        textAlign: 'center',
        fontSize: 10,
        fontWeight: '600',
    },
    filterPanel: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.card,
        padding: 16,
        marginBottom: 16,
        marginHorizontal: theme.spacing.l,
    },
    filterWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: theme.colors.textSecondary,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text,
    },
    activityContainer: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.card,
        overflow: 'hidden',
        marginHorizontal: theme.spacing.l,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 16,
        borderBottomColor: theme.colors.border,
    },
    categoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityContent: {
        flex: 1,
        gap: 2,
    },
    activityTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text,
    },
    activityMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    activitySubtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    activityAmount: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text,
    },
    activityDate: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
});
