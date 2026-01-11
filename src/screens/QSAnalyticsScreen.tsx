import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, isToday, isYesterday } from 'date-fns';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { QSHeader } from '../components/QSHeader';
import { CashFlowChart, CategoryDonutChart, SpendingBarChart } from '../components/analytics/AnalyticsCharts';
import { useAuth } from '../context/AuthContext';
import { BudgetPerformance, CashFlowData, CategorySpending, NetWorthData, SpendingInsights, useAnalytics } from '../hooks/useAnalytics';

import { createStyles } from '../styles/QSAnalytics.styles';
import { useTheme } from '../theme/ThemeContext';

export default function QSAnalyticsScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const styles = createStyles(theme);
    const {
        getNetWorth,
        getSpendingByCategory,
        getCashFlow,
        getBudgetPerformance,
        getTripsAnalytics,
        getGroupsAnalytics,
        getSpendingInsights
    } = useAnalytics();

    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'spending' | 'cashflow' | 'budgets'>('spending');
    const [dateRange, setDateRange] = useState<number>(30);
    const [netWorth, setNetWorth] = useState<NetWorthData | null>(null);
    const [spending, setSpending] = useState<CategorySpending[]>([]);
    const [cashFlow, setCashFlow] = useState<CashFlowData[]>([]);
    const [budgets, setBudgets] = useState<BudgetPerformance[]>([]);
    const [trips, setTrips] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [insights, setInsights] = useState<SpendingInsights | null>(null);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setRefreshing(true);
        try {
            const [nw, sp, cf, bd, tr, gr, ins] = await Promise.all([
                getNetWorth(user.id),
                getSpendingByCategory(user.id, dateRange),
                getCashFlow(user.id, dateRange),
                getBudgetPerformance(user.id),
                getTripsAnalytics(user.id),
                getGroupsAnalytics(user.id),
                getSpendingInsights(user.id, dateRange)
            ]);
            setNetWorth(nw);
            setSpending(sp);
            setCashFlow(cf);
            setBudgets(bd);
            setTrips(tr);
            setGroups(gr);
            setInsights(ins);
        } catch (error) {
            console.error("Error fetching analytics data:", error);
        } finally {
            setRefreshing(false);
        }
    }, [
        user,
        dateRange,
        getNetWorth,
        getSpendingByCategory,
        getCashFlow,
        getBudgetPerformance,
        getTripsAnalytics,
        getGroupsAnalytics,
        getSpendingInsights
    ]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const DateFilter = () => {
        if (activeTab === 'budgets') return null; // Logic to hide if not applicable, though kept for now

        return (
            <View style={styles.filterContainer}>
                {[7, 30, 90].map((days) => {
                    const isActive = dateRange === days;
                    return (
                        <TouchableOpacity
                            key={days}
                            onPress={() => setDateRange(days)}
                            style={[
                                styles.filterChip,
                                isActive && styles.activeFilterChip
                            ]}
                        >
                            <Text style={[
                                styles.filterText,
                                isActive && styles.activeFilterText
                            ]}>
                                {days} Days
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    // ... (existing useEffect and helpers)

    return (
        <View style={styles.container}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor={theme.colors.primary} />
                }
            >
                <QSHeader />
                {/* Net Worth Card */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.netWorthCard}>
                    <Text style={styles.netWorthLabel}>Net Worth</Text>
                    <Text style={styles.netWorthAmount}>{netWorth ? formatCurrency(netWorth.netWorth) : '₹0'}</Text>

                    {netWorth && (
                        <View style={styles.trendRow}>
                            <MaterialCommunityIcons
                                name={netWorth.trend === 'up' ? 'trending-up' : netWorth.trend === 'down' ? 'trending-down' : 'minus'}
                                size={20}
                                color={netWorth.trend === 'up' ? theme.colors.success : netWorth.trend === 'down' ? theme.colors.error : theme.colors.textSecondary}
                            />
                            <Text style={[styles.trendText, {
                                color: netWorth.trend === 'up' ? theme.colors.success : netWorth.trend === 'down' ? theme.colors.error : theme.colors.textSecondary
                            }]}>
                                {netWorth.changePercentage.toFixed(1)}% vs last month
                            </Text>
                        </View>
                    )}

                    {netWorth && netWorth.history && netWorth.history.length > 0 && (
                        <View style={{ marginTop: 20, width: '100%', height: 100, overflow: 'hidden' }}>
                            <LineChart
                                data={netWorth.history}
                                height={100}
                                thickness={3}
                                color={theme.colors.primary}
                                hideDataPoints
                                hideRules
                                hideYAxisText
                                hideAxesAndRules
                                curved
                                areaChart
                                startFillColor={theme.colors.primary}
                                endFillColor={theme.colors.card}
                                startOpacity={0.2}
                                endOpacity={0.0}
                                initialSpacing={10}
                                spacing={60}
                                scrollToEnd
                            />
                        </View>
                    )}
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryItem}>
                            <Text style={{ fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600', textTransform: 'uppercase' }}>Assets</Text>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.success }}>
                                {netWorth ? formatCurrency(netWorth.totalAssets) : '₹0'}
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={{ fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600', textTransform: 'uppercase' }}>Liabilities</Text>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.error }}>
                                {netWorth ? formatCurrency(netWorth.totalLiabilities) : '₹0'}
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Date Filter (Global Control) */}
                {activeTab !== 'budgets' && (
                    <Animated.View entering={FadeInDown.delay(200)}>
                        <DateFilter />
                    </Animated.View>
                )}

                {/* Sub-navigation Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'spending' && styles.activeTabItem]}
                        onPress={() => setActiveTab('spending')}
                    >
                        <Text style={[styles.tabLabel, activeTab === 'spending' && styles.activeTabLabel]}>Spending</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'cashflow' && styles.activeTabItem]}
                        onPress={() => setActiveTab('cashflow')}
                    >
                        <Text style={[styles.tabLabel, activeTab === 'cashflow' && styles.activeTabLabel]}>Cash Flow</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'budgets' && styles.activeTabItem]}
                        onPress={() => setActiveTab('budgets')}
                    >
                        <Text style={[styles.tabLabel, activeTab === 'budgets' && styles.activeTabLabel]}>Insight</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Content Sections */}
                {activeTab === 'spending' && (
                    <Animated.View entering={FadeInUp.springify()}>
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Spending Breakdown</Text>
                            <CategoryDonutChart data={spending} theme={theme} />
                        </View>


                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Top Categories</Text>
                            <SpendingBarChart data={spending} theme={theme} />
                        </View>

                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Details</Text>
                            <View style={styles.categoryList}>
                                {spending.map((item, index) => (
                                    <View key={item.category_id} style={styles.categoryItem}>
                                        <View style={styles.categoryLeft}>
                                            <View style={[styles.categoryDot, { backgroundColor: item.category_color }]} />
                                            <Text style={styles.categoryName}>{item.category_name}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={styles.categoryValue}>{formatCurrency(item.total)}</Text>
                                            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>{item.percentage.toFixed(1)}%</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </Animated.View>
                )}

                {
                    activeTab === 'cashflow' && (
                        <Animated.View entering={FadeInUp.springify()}>
                            <View style={styles.sectionCard}>
                                <Text style={styles.sectionTitle}>Cash Flow Trend</Text>
                                <CashFlowChart data={cashFlow} theme={theme} />
                                <View style={{ marginTop: 20 }}>
                                    <Text style={{ fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' }}>
                                        Income vs Expenses over the selected period.
                                    </Text>
                                </View>
                            </View>
                        </Animated.View>
                    )
                }

                {activeTab === 'budgets' && (
                    <View>
                        {insights && (
                            <Animated.View entering={FadeInUp.springify()}>
                                {/* Comparison & Suggestion Card */}
                                <View style={styles.sectionCard}>
                                    <Text style={styles.sectionTitle}>Spending Insights</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: insights.percentageChange <= 0 ? theme.colors.success + '20' : theme.colors.error + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                            <MaterialCommunityIcons
                                                name={insights.percentageChange <= 0 ? "arrow-down-bold" : "arrow-up-bold"}
                                                size={24}
                                                color={insights.percentageChange <= 0 ? theme.colors.success : theme.colors.error}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 16, color: theme.colors.text }}>
                                                {insights.trendMessage}
                                            </Text>
                                        </View>
                                    </View>
                                    {insights.topCategory && (
                                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.colors.backgroundSecondary, padding: 12, borderRadius: 12 }}>
                                            <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={theme.colors.primary} style={{ marginRight: 10, marginTop: 2 }} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 14, color: theme.colors.text, fontWeight: '600', marginBottom: 4 }}>Suggestion</Text>
                                                <Text style={{ fontSize: 13, color: theme.colors.textSecondary, lineHeight: 18 }}>
                                                    {insights.suggestion}
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                </View>

                                {/* Daily Snapshot & Projection */}
                                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16, marginHorizontal: theme.spacing.l }}>
                                    <View style={[styles.sectionCard, { flex: 1, marginBottom: 0, marginHorizontal: 0 }]}>
                                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 }}>Daily Average</Text>
                                        <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.text }}>{formatCurrency(Math.round(insights.dailyAverage))}</Text>
                                    </View>
                                    <View style={[styles.sectionCard, { flex: 1, marginBottom: 0, marginHorizontal: 0 }]}>
                                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 }}>30-Day Projection</Text>
                                        <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.primary }}>{formatCurrency(Math.round(insights.projectedTotal))}</Text>
                                    </View>
                                </View>

                                {/* Big Spender Card */}
                                {insights.largestTransaction && (
                                    <View style={styles.sectionCard}>
                                        <Text style={styles.sectionTitle}>Largest Spend</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.backgroundSecondary, padding: 16, borderRadius: 16 }}>
                                            <View style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 24,
                                                backgroundColor: insights.largestTransaction.category_color + '20',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginRight: 16
                                            }}>
                                                <MaterialCommunityIcons
                                                    name={insights.largestTransaction.category_icon as any}
                                                    size={24}
                                                    color={insights.largestTransaction.category_color}
                                                />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 4 }}>
                                                    {insights.largestTransaction.category_name}
                                                </Text>
                                                <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 2 }}>
                                                    {insights.largestTransaction.name}
                                                </Text>
                                                <Text style={{ fontSize: 12, color: theme.colors.textTertiary }}>
                                                    {isToday(new Date(insights.largestTransaction.date))
                                                        ? 'Today'
                                                        : isYesterday(new Date(insights.largestTransaction.date))
                                                            ? 'Yesterday'
                                                            : !isNaN(new Date(insights.largestTransaction.date).getTime()) 
                                                                ? format(new Date(insights.largestTransaction.date), 'EEE, d MMM')
                                                                : 'Unknown Date'}
                                                </Text>
                                            </View>
                                            <Text style={{ fontSize: 18, fontWeight: '800', color: theme.colors.error }}>
                                                {formatCurrency(insights.largestTransaction.amount)}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </Animated.View>
                        )}

                        <Animated.View entering={FadeInUp.springify()} style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Budget Usage</Text>
                            <View style={styles.budgetList}>
                                {budgets.length > 0 ? budgets.map((budget) => (
                                    <View key={budget.category_id} style={styles.budgetItem}>
                                        <View style={styles.budgetInfo}>
                                            <Text style={styles.budgetCategory}>{budget.category_name}</Text>
                                            <Text style={styles.budgetAmount}>
                                                {formatCurrency(budget.spent_amount)} / {formatCurrency(budget.budget_amount)}
                                            </Text>
                                        </View>
                                        <View style={styles.progressBarBackground}>
                                            <View
                                                style={[
                                                    styles.progressBarFill,
                                                    {
                                                        width: `${Math.min(Number.isFinite(budget.percentage) ? budget.percentage : 0, 100)}%`,
                                                        backgroundColor: budget.percentage > 100 ? theme.colors.error : theme.colors.primary
                                                    }
                                                ]}
                                            />
                                        </View>
                                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary, alignSelf: 'flex-end', fontWeight: '500' }}>
                                            {budget.percentage.toFixed(0)}% used
                                        </Text>
                                    </View>
                                )) : (
                                    <Text style={{ textAlign: 'center', color: theme.colors.textSecondary, marginVertical: 20 }}>
                                        No budgets set up for the current month.
                                    </Text>
                                )}
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Trips & Groups</Text>
                            <View style={styles.budgetList}>
                                {trips.length > 0 ? trips.map((trip) => (
                                    <View key={trip.id} style={styles.budgetItem}>
                                        <View style={styles.budgetInfo}>
                                            <Text style={styles.budgetCategory}>{trip.name}</Text>
                                            <Text style={styles.budgetAmount}>
                                                {formatCurrency(trip.spent)} / {formatCurrency(trip.budget)}
                                            </Text>
                                        </View>
                                        <View style={styles.progressBarBackground}>
                                            <View
                                                style={[
                                                    styles.progressBarFill,
                                                    {
                                                        width: `${Math.min(trip.percentage, 100)}%`,
                                                        backgroundColor: trip.percentage > 100 ? theme.colors.error : theme.colors.secondary
                                                    }
                                                ]}
                                            />
                                        </View>
                                    </View>
                                )) : null}

                                {groups.length > 0 ? groups.map((group) => (
                                    <View key={group.id} style={styles.categoryItem}>
                                        <View style={styles.categoryLeft}>
                                            <View style={[styles.categoryDot, { backgroundColor: group.color }]} />
                                            <Text style={styles.categoryName}>{group.name}</Text>
                                        </View>
                                        <Text style={styles.categoryValue}>{formatCurrency(group.total_spent)}</Text>
                                    </View>
                                )) : null}

                                {trips.length === 0 && groups.length === 0 && (
                                    <Text style={{ textAlign: 'center', color: theme.colors.textSecondary, marginVertical: 20 }}>
                                        No active trips or groups to analyze.
                                    </Text>
                                )}
                            </View>
                        </Animated.View>
                    </View>
                )
                }
            </ScrollView >
        </View >
    );
}
