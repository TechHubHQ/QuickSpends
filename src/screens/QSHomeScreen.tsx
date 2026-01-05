import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, FadeInRight, FadeInUp } from "react-native-reanimated";
import { QSGroupCard } from "../components/QSGroupCard";
import { QSHeader } from "../components/QSHeader";
import { QSTransactionIndicators } from "../components/QSTransactionIndicators";
import { useAuth } from "../context/AuthContext";
import { useAccounts } from "../hooks/useAccounts";
import { useBudgets } from "../hooks/useBudgets";
import { useGroups } from "../hooks/useGroups";
import { useTransactions } from "../hooks/useTransactions";
import { Trip, useTrips } from "../hooks/useTrips";
import { createStyles } from "../styles/QSHome.styles";
import { useTheme } from "../theme/ThemeContext";
import { getSafeIconName } from "../utils/iconMapping";

export default function QSHomeScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme.isDark;
    const styles = createStyles(theme);
    const { user } = useAuth();
    const { getAccountsByUser } = useAccounts();
    const { getRecentTransactions, getBalanceTrend } = useTransactions();
    const { getBudgetsWithSpending } = useBudgets();
    const { getTripsByUser } = useTrips();
    const { getGroupsByUser } = useGroups();

    const [isBalanceVisible, setIsBalanceVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'budgets' | 'trips' | 'groups'>('groups');
    const [totalBalance, setTotalBalance] = useState(0);
    const [balanceTrend, setBalanceTrend] = useState({ percentage: 0, trend: 'up' as 'up' | 'down' });
    const [budgets, setBudgets] = useState<any[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [groups, setGroups] = useState<any[]>([]); // Added groups state
    const [accounts, setAccounts] = useState<any[]>([]); // Added accounts state
    const [excludeCreditCards, setExcludeCreditCards] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);

    useEffect(() => {
        if (accounts.length > 0) {
            const balance = accounts.reduce((sum: number, acc: any) => {
                if (excludeCreditCards && (acc.type === 'card' && acc.card_type === 'credit')) {
                    return sum;
                }
                return sum + acc.balance;
            }, 0);
            setTotalBalance(balance);
            // Update trend based on new balance (optional, might need refetching trend if logic requires it, but for now simple update)
            getBalanceTrend(user!.id, balance).then(setBalanceTrend);
        }
    }, [accounts, excludeCreditCards]);

    const fetchData = useCallback(async () => {
        if (!user) return;

        setRefreshing(true);
        try {
            const [accountsData, transactionsData, budgetsData, tripsData, groupsData] = await Promise.all([
                getAccountsByUser(user.id),
                getRecentTransactions(user.id, 5),
                getBudgetsWithSpending(user.id),
                getTripsByUser(user.id),
                getGroupsByUser(user.id)
            ]);

            setAccounts(accountsData); // Store accounts

            // Calculate total balance initial
            const initialBalance = accountsData.reduce((sum: number, acc: any) => {
                if (excludeCreditCards && (acc.type === 'card' && acc.card_type === 'credit')) {
                    return sum;
                }
                return sum + acc.balance;
            }, 0);
            setTotalBalance(initialBalance);

            const trendData = await getBalanceTrend(user.id, initialBalance);
            setBalanceTrend(trendData);

            setTransactions(transactionsData);
            setBudgets(budgetsData);
            setTrips(tripsData);
            setGroups(groupsData);

        } catch (error) {

        } finally {
            setRefreshing(false);
        }
    }, [user, getAccountsByUser, getRecentTransactions, getBudgetsWithSpending, getTripsByUser, excludeCreditCards]);



    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor={theme.colors.primary} />
                }
            >
                <QSHeader />
                {/* Balance Card */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <LinearGradient
                        colors={theme.isDark ? ['#050505', '#27272a'] : ['#FFFFFF', '#F1F5F9']}
                        start={{ x: 1, y: 0 }} // Start top right (Darker)
                        end={{ x: 0, y: 1 }}   // End bottom left (Lighter)
                        style={styles.balanceCard}
                    >
                        <View style={styles.balanceDecoration} />
                        <View style={styles.balanceLabelRow}>
                            <View style={styles.balanceLabel}>
                                <Text style={styles.balanceLabelText}>Total Balance</Text>
                                <TouchableOpacity onPress={() => setIsBalanceVisible(!isBalanceVisible)}>
                                    <MaterialCommunityIcons
                                        name={isBalanceVisible ? "eye" : "eye-off"}
                                        size={18}
                                        color={isDark ? "#9FB3C8" : "#64748B"}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginRight: -8 }}>
                                <TouchableOpacity
                                    onPress={() => setExcludeCreditCards(!excludeCreditCards)}
                                    style={{
                                        paddingHorizontal: 6,
                                        paddingVertical: 4,
                                        backgroundColor: excludeCreditCards ? theme.colors.primary : 'transparent',
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: excludeCreditCards ? theme.colors.primary : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'),
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 4
                                    }}
                                >
                                    <MaterialCommunityIcons
                                        name={excludeCreditCards ? "credit-card-off" : "credit-card-check"}
                                        size={12}
                                        color={excludeCreditCards ? "#FFF" : theme.colors.textSecondary}
                                    />
                                    <Text style={{
                                        fontSize: 10,
                                        fontWeight: '600',
                                        color: excludeCreditCards ? "#FFF" : theme.colors.textSecondary
                                    }}>
                                        No CC
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Text style={styles.balanceAmount}>
                            {isBalanceVisible ? formatCurrency(totalBalance) : "••••••••"}
                        </Text>

                        <View style={styles.balanceActions}>
                            <TouchableOpacity
                                style={styles.addMoneyButton}
                                onPress={() => {
                                    // @ts-ignore
                                    router.push({ pathname: "/add-transaction", params: { initialType: 'income' } });
                                }}
                            >
                                <MaterialCommunityIcons name="plus" size={20} color={theme.colors.onPrimary} />
                                <Text style={styles.addMoneyText}>Add Money</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.transferButton}
                                onPress={() => {
                                    // @ts-ignore
                                    router.push({ pathname: "/add-transaction", params: { initialType: 'transfer' } });
                                }}
                            >
                                <MaterialCommunityIcons name="swap-horizontal" size={20} color={theme.colors.text} />
                                <Text style={styles.transferText}>Transfer</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Switcher Section (Budgets / Trips / Groups) */}
                <View style={styles.sectionHeader}>
                    <View style={styles.switcherContainer}>
                        <TouchableOpacity
                            onPress={() => setActiveTab('groups')}
                            style={[styles.tabButton, activeTab === 'groups' && styles.activeTabButton]}
                        >
                            <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>My Groups</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('budgets')}
                            style={[styles.tabButton, activeTab === 'budgets' && styles.activeTabButton]}
                        >
                            <Text style={[styles.tabText, activeTab === 'budgets' && styles.activeTabText]}>My Budgets</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('trips')}
                            style={[styles.tabButton, activeTab === 'trips' && styles.activeTabButton]}
                        >
                            <Text style={[styles.tabText, activeTab === 'trips' && styles.activeTabText]}>My Trips</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {activeTab === 'groups' && (
                            <TouchableOpacity onPress={() => router.push("/create-group")} style={{ backgroundColor: theme.colors.primary, padding: 4, borderRadius: 12 }}>
                                <MaterialCommunityIcons name="plus" size={20} color={theme.colors.onPrimary} />
                            </TouchableOpacity>
                        )}
                        {activeTab === 'budgets' && (
                            <TouchableOpacity onPress={() => router.push("/budget-creation")} style={{ backgroundColor: theme.colors.primary, padding: 4, borderRadius: 12 }}>
                                <MaterialCommunityIcons name="plus" size={20} color={theme.colors.onPrimary} />
                            </TouchableOpacity>
                        )}
                        {activeTab === 'trips' && (
                            <TouchableOpacity onPress={() => router.push("/create-trip")} style={{ backgroundColor: theme.colors.primary, padding: 4, borderRadius: 12 }}>
                                <MaterialCommunityIcons name="plus" size={20} color={theme.colors.onPrimary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {activeTab === 'groups' ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tripScroll}
                        snapToInterval={208} // w-48 (192) + margin (16)
                        decelerationRate="fast"
                    >
                        {groups.length > 0 ? groups.map((group, index) => (
                            <Animated.View key={group.id} entering={FadeInRight.delay(200 + index * 50).springify()}>
                                <QSGroupCard
                                    group={group}
                                    onPress={() => {
                                        // @ts-ignore
                                        router.push({ pathname: `/group/[id]`, params: { id: group.id } });
                                    }}
                                />
                            </Animated.View>
                        )) : (
                            <View style={[styles.budgetCard, { width: 300, justifyContent: 'center' }]}>
                                <Text style={[styles.budgetName, { textAlign: 'center' }]}>No groups joined yet</Text>
                            </View>
                        )}
                    </ScrollView>
                ) : activeTab === 'budgets' ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.budgetScroll}
                        snapToInterval={216}
                        decelerationRate="fast"
                    >
                        {budgets.length > 0 ? budgets.map((budget, index) => {
                            const percentage = Math.min(Math.round((budget.spent / budget.amount) * 100), 100);
                            const remaining = budget.amount - budget.spent;

                            return (
                                <Animated.View key={budget.id} entering={FadeInRight.delay(200 + index * 50).springify()}>
                                    <TouchableOpacity
                                        style={styles.budgetCard}
                                        onPress={() => {
                                            // @ts-ignore
                                            router.push({ pathname: `/budget-details/[id]`, params: { id: budget.id } });
                                        }}
                                    >
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                            <View style={[styles.budgetIconWrapper, { backgroundColor: budget.category_color + "20" }]}>
                                                <MaterialCommunityIcons name={getSafeIconName(budget.category_icon)} size={20} color={budget.category_color} />
                                            </View>
                                            <View style={styles.budgetPercentageWrapper}>
                                                <Text style={styles.budgetPercentage}>{percentage}%</Text>
                                            </View>
                                        </View>
                                        <View>
                                            <Text style={styles.budgetName}>{budget.category_name}</Text>
                                            <Text style={styles.budgetRemaining}>{formatCurrency(remaining)} remaining</Text>
                                        </View>
                                        <View style={[styles.progressBarBackground, { backgroundColor: budget.category_color + "20" }]}>
                                            <View
                                                style={[
                                                    styles.progressBarFill,
                                                    {
                                                        backgroundColor: percentage > 100 ? theme.colors.error : budget.category_color,
                                                        width: `${Math.min(percentage, 100)}%`
                                                    }
                                                ]}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        }) : (
                            <View style={[styles.budgetCard, { width: 300, justifyContent: 'center' }]}>
                                <Text style={[styles.budgetName, { textAlign: 'center' }]}>No budgets set up yet</Text>
                            </View>
                        )}
                    </ScrollView>
                ) : activeTab === 'trips' ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tripScroll}
                        snapToInterval={296}
                        decelerationRate="fast"
                    >
                        {trips.length > 0 ? trips.map((trip, index) => {
                            const percentage = Math.min(Math.round((trip.totalSpent / trip.budget) * 100), 100);
                            const isActive = trip.status === 'active';

                            return (
                                <Animated.View key={trip.id} entering={FadeInRight.delay(200 + index * 50).springify()}>
                                    <TouchableOpacity
                                        style={[
                                            styles.tripCard,
                                            isActive && styles.tripActiveBorder
                                        ]}
                                        onPress={() => {
                                            // @ts-ignore
                                            router.push({ pathname: `/trip/[id]`, params: { id: trip.id } });
                                        }}
                                    >
                                        <Image
                                            source={trip.image}
                                            style={styles.tripImage}
                                            contentFit="cover"
                                            transition={300}
                                        />
                                        <View style={styles.tripOverlay}>
                                            <View style={styles.tripHeader}>
                                                <View style={styles.tripHeaderLeft}>
                                                    <View style={styles.tripTypeIcon}>
                                                        <MaterialCommunityIcons
                                                            name={trip.type === 'group' ? 'account-group' : 'account'}
                                                            size={14}
                                                            color="#FFFFFF"
                                                        />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.tripName} numberOfLines={2} ellipsizeMode="tail">{trip.name}</Text>
                                                        <Text style={styles.tripDate}>
                                                            {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(trip.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={[
                                                    styles.tripStatusBadge,
                                                    trip.status === 'active' ? styles.activeBadge :
                                                        trip.status === 'upcoming' ? styles.upcomingBadge : styles.completedBadge
                                                ]}>
                                                    <Text style={[
                                                        styles.tripStatusText,
                                                        trip.status === 'active' ? styles.activeStatusText :
                                                            trip.status === 'upcoming' ? styles.upcomingStatusText : styles.completedStatusText
                                                    ]}>
                                                        {trip.status}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.tripFooter}>
                                                <Text style={styles.tripAmount}>{formatCurrency(trip.totalSpent)}</Text>
                                                <View style={styles.tripBudgetInfo}>
                                                    <Text style={styles.tripBudgetText}>
                                                        {formatCurrency(trip.totalSpent)} / {formatCurrency(trip.budget)}
                                                    </Text>
                                                    <View style={styles.tripProgressBar}>
                                                        <View
                                                            style={[
                                                                styles.tripProgressBarFill,
                                                                { width: `${percentage}%` }
                                                            ]}
                                                        />
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        }) : (
                            <View style={[styles.tripCard, { width: 300, justifyContent: 'center' }]}>
                                <Text style={[styles.tripName, { textAlign: 'center', color: theme.colors.text }]}>No trips recorded yet</Text>
                            </View>
                        )}
                    </ScrollView>
                ) : ( // Fallback or empty (but logic covers all 3)
                    null
                )}

                {/* Recent Transactions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Transactions</Text>
                    <TouchableOpacity onPress={() => router.push("/transactions")}>
                        <Text style={styles.seeAllButton}>View All</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.transactionList}>
                    {transactions.length > 0 ? transactions.map((item, index) => (
                        <Animated.View key={item.id} entering={FadeInUp.delay(500 + index * 50).springify()}>
                            <TouchableOpacity
                                style={styles.transactionItem}
                                onPress={() => {
                                    // @ts-ignore - Expo Router types
                                    router.push({
                                        pathname: "/transaction-details",
                                        params: { transaction: JSON.stringify(item) }
                                    });
                                }}
                            >
                                <View style={styles.transactionLeft}>
                                    <View style={styles.transactionIconBox}>
                                        <MaterialCommunityIcons
                                            name={item.type === 'transfer'
                                                ? getSafeIconName(item.category_icon || "swap-horizontal")
                                                : (item.name === 'Opening Balance'
                                                    ? 'wallet-plus'
                                                    : getSafeIconName(item.category_icon || 'receipt'))}
                                            size={24}
                                            color={item.category_color || (item.type === 'transfer' ? "#8B5CF6" : (item.name === 'Opening Balance' ? theme.colors.primary : theme.colors.text))}
                                        />
                                        {item.type === 'transfer' && (
                                            <View style={{
                                                position: 'absolute',
                                                bottom: -2,
                                                right: -2,
                                                backgroundColor: theme.colors.background,
                                                borderRadius: 8,
                                                borderWidth: 1,
                                                borderColor: theme.colors.border,
                                                padding: 1
                                            }}>
                                                <MaterialCommunityIcons name="swap-horizontal" size={10} color={theme.colors.textSecondary} />
                                            </View>
                                        )}
                                    </View>
                                    <View>
                                        <Text style={styles.transactionName}>{item.name}</Text>
                                        <View style={styles.transactionMeta}>
                                            <Text style={styles.transactionTime}>
                                                {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </Text>
                                            <QSTransactionIndicators
                                                isSplit={item.is_split}
                                                tripId={item.trip_id}
                                                groupId={item.group_id}
                                            />
                                        </View>
                                    </View>
                                </View>
                                <Text
                                    style={[
                                        styles.transactionAmount,
                                        { color: item.type === 'income' ? "#48BB78" : (item.type === 'expense' ? "#F56565" : theme.colors.text) }
                                    ]}
                                >
                                    {item.type === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(item.amount))}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )) : (
                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                            <Text style={styles.transactionTime}>No recent transactions</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
