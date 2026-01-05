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
import { useLoans } from "../hooks/useLoans";
import { useSavings } from "../hooks/useSavings";
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
    const { getSavingsGoals } = useSavings();
    const { getLoans } = useLoans();

    const [isBalanceVisible, setIsBalanceVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'budgets' | 'trips' | 'groups' | 'savings' | 'loans'>('groups');
    const [totalBalance, setTotalBalance] = useState(0);
    const [balanceTrend, setBalanceTrend] = useState({ percentage: 0, trend: 'up' as 'up' | 'down' });
    const [budgets, setBudgets] = useState<any[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [groups, setGroups] = useState<any[]>([]); // Added groups state
    const [accounts, setAccounts] = useState<any[]>([]); // Added accounts state
    const [excludeCreditCards, setExcludeCreditCards] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [savings, setSavings] = useState<any[]>([]);
    const [loans, setLoans] = useState<any[]>([]);

    useEffect(() => {
        if (accounts.length > 0 || loans.length > 0) {
            let assets = 0;
            let liabilities = 0;

            accounts.forEach((acc: any) => {
                const isCredit = acc.type === 'card' && acc.card_type === 'credit';
                if (isCredit) {
                    if (!excludeCreditCards) {
                        const debt = (acc.credit_limit || 0) - acc.balance;
                        liabilities += Math.max(0, debt);
                    }
                } else {
                    assets += acc.balance;
                }
            });

            loans.forEach((loan: any) => {
                if (loan.status === 'active') {
                    if (loan.type === 'lent') assets += loan.remaining_amount;
                    else liabilities += loan.remaining_amount;
                }
            });

            const balance = assets - liabilities;
            setTotalBalance(balance);
            getBalanceTrend(user!.id, balance).then(setBalanceTrend);
        }
    }, [accounts, loans, excludeCreditCards, user, getBalanceTrend]);

    const fetchData = useCallback(async () => {
        if (!user) return;

        setRefreshing(true);
        try {
            const [accountsData, transactionsData, budgetsData, tripsData, groupsData, savingsData, loansData] = await Promise.all([
                getAccountsByUser(user.id),
                getRecentTransactions(user.id, 5),
                getBudgetsWithSpending(user.id),
                getTripsByUser(user.id),
                getGroupsByUser(user.id),
                getSavingsGoals(user.id),
                getLoans(user.id)
            ]);

            setAccounts(accountsData);
            setLoans(loansData);

            // Calculate initial balance using Asset - Liability logic
            let assets = 0;
            let liabilities = 0;

            accountsData.forEach((acc: any) => {
                const isCredit = acc.type === 'card' && acc.card_type === 'credit';
                if (isCredit) {
                    if (!excludeCreditCards) {
                        const debt = (acc.credit_limit || 0) - acc.balance;
                        liabilities += Math.max(0, debt);
                    }
                } else {
                    assets += acc.balance;
                }
            });

            loansData.forEach((loan: any) => {
                if (loan.status === 'active') {
                    if (loan.type === 'lent') assets += loan.remaining_amount;
                    else liabilities += loan.remaining_amount;
                }
            });

            const initialBalance = assets - liabilities;
            setTotalBalance(initialBalance);

            const trendData = await getBalanceTrend(user.id, initialBalance);
            setBalanceTrend(trendData);

            setTransactions(transactionsData);
            setBudgets(budgetsData);
            setTrips(tripsData);
            setGroups(groupsData);
            setSavings(savingsData);
            setLoans(loansData);

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
                <View style={[styles.sectionHeader, { paddingRight: 0 }]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.switcherContainer}
                        decelerationRate="fast"
                    >
                        <TouchableOpacity
                            onPress={() => setActiveTab('groups')}
                            style={[styles.tabButton, activeTab === 'groups' && styles.activeTabButton]}
                        >
                            <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>Groups</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('budgets')}
                            style={[styles.tabButton, activeTab === 'budgets' && styles.activeTabButton]}
                        >
                            <Text style={[styles.tabText, activeTab === 'budgets' && styles.activeTabText]}>Budgets</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('trips')}
                            style={[styles.tabButton, activeTab === 'trips' && styles.activeTabButton]}
                        >
                            <Text style={[styles.tabText, activeTab === 'trips' && styles.activeTabText]}>Trips</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('savings')}
                            style={[styles.tabButton, activeTab === 'savings' && styles.activeTabButton]}
                        >
                            <Text style={[styles.tabText, activeTab === 'savings' && styles.activeTabText]}>Savings</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('loans')}
                            style={[styles.tabButton, activeTab === 'loans' && styles.activeTabButton]}
                        >
                            <Text style={[styles.tabText, activeTab === 'loans' && styles.activeTabText]}>Loans</Text>
                        </TouchableOpacity>
                    </ScrollView>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: theme.spacing.l }}>
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
                        {activeTab === 'savings' && (
                            <TouchableOpacity onPress={() => router.push("/add-saving")} style={{ backgroundColor: theme.colors.primary, padding: 4, borderRadius: 12 }}>
                                <MaterialCommunityIcons name="plus" size={20} color={theme.colors.onPrimary} />
                            </TouchableOpacity>
                        )}
                        {activeTab === 'loans' && (
                            <TouchableOpacity onPress={() => router.push("/add-loan")} style={{ backgroundColor: theme.colors.primary, padding: 4, borderRadius: 12 }}>
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
                ) : activeTab === 'savings' ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.budgetScroll}
                        snapToInterval={216}
                        decelerationRate="fast"
                    >
                        {savings.length > 0 ? savings.map((goal, index) => {
                            const percentage = goal.target_amount > 0 ? Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100) : 0;

                            return (
                                <Animated.View key={goal.id} entering={FadeInRight.delay(200 + index * 50).springify()}>
                                    <TouchableOpacity
                                        style={styles.budgetCard}
                                        onPress={() => router.push({ pathname: "/saving-details/[id]", params: { id: goal.id } })}
                                    >
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                            <View style={[styles.budgetIconWrapper, { backgroundColor: (goal.category_color || theme.colors.primary) + "20" }]}>
                                                <MaterialCommunityIcons name={getSafeIconName(goal.category_icon || "piggy-bank")} size={20} color={goal.category_color || theme.colors.primary} />
                                            </View>
                                            <View style={styles.budgetPercentageWrapper}>
                                                <Text style={styles.budgetPercentage}>{percentage}%</Text>
                                            </View>
                                        </View>
                                        <View>
                                            <Text style={styles.budgetName}>{goal.name}</Text>
                                            <Text style={styles.budgetRemaining}>₹{goal.current_amount.toLocaleString()} saved</Text>
                                        </View>
                                        <View style={[styles.progressBarBackground, { backgroundColor: (goal.category_color || theme.colors.primary) + "20" }]}>
                                            <View
                                                style={[
                                                    styles.progressBarFill,
                                                    {
                                                        backgroundColor: goal.category_color || theme.colors.primary,
                                                        width: `${percentage}%`
                                                    }
                                                ]}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        }) : (
                            <View style={[styles.budgetCard, { width: 300, justifyContent: 'center' }]}>
                                <Text style={[styles.budgetName, { textAlign: 'center' }]}>No savings goals yet</Text>
                            </View>
                        )}
                    </ScrollView>
                ) : activeTab === 'loans' ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.budgetScroll}
                        snapToInterval={216}
                        decelerationRate="fast"
                    >
                        {loans.length > 0 ? loans.map((loan, index) => {
                            const isLent = loan.type === 'lent';
                            const percentage = Math.min(Math.round((loan.remaining_amount / loan.total_amount) * 100), 100);

                            return (
                                <Animated.View key={loan.id} entering={FadeInRight.delay(200 + index * 50).springify()}>
                                    <TouchableOpacity
                                        style={styles.budgetCard}
                                        onPress={() => router.push({ pathname: "/loan-details/[id]", params: { id: loan.id } })}
                                    >
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                            <View style={[styles.budgetIconWrapper, { backgroundColor: (isLent ? '#10B981' : '#EF4444') + "20" }]}>
                                                <MaterialCommunityIcons name={isLent ? "hand-coin" : "hand-peace"} size={20} color={isLent ? '#10B981' : '#EF4444'} />
                                            </View>
                                            <View style={styles.budgetPercentageWrapper}>
                                                <Text style={[styles.budgetPercentage, { color: isLent ? '#10B981' : '#EF4444' }]}>{isLent ? 'Lent' : 'Borrowed'}</Text>
                                            </View>
                                        </View>
                                        <View>
                                            <Text style={styles.budgetName}>{loan.person_name}</Text>
                                            <Text style={styles.budgetRemaining}>₹{loan.remaining_amount.toLocaleString()} left</Text>
                                        </View>
                                        <View style={[styles.progressBarBackground, { backgroundColor: (isLent ? '#10B981' : '#EF4444') + "20" }]}>
                                            <View
                                                style={[
                                                    styles.progressBarFill,
                                                    {
                                                        backgroundColor: isLent ? '#10B981' : '#EF4444',
                                                        width: `${percentage}%`
                                                    }
                                                ]}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        }) : (
                            <View style={[styles.budgetCard, { width: 300, justifyContent: 'center' }]}>
                                <Text style={[styles.budgetName, { textAlign: 'center' }]}>No active loans</Text>
                            </View>
                        )}
                    </ScrollView>
                ) : ( // Fallback or empty (but logic covers all 5)
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
                                                savingsId={item.savings_id}
                                                loanId={item.loan_id}
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
