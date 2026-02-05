import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format, isToday, isYesterday, startOfMonth, subDays } from "date-fns";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { QSBottomSheet } from "../components/QSBottomSheet";
import { QSCustomRangePicker } from "../components/QSCustomRangePicker";
import { QSHeader } from "../components/QSHeader";
import {
  CategoryDonutChart,
  SpendingBarChart,
} from "../components/analytics/AnalyticsCharts";
import NetWorthCard from "../components/analytics/NetWorthCard";
import SpendingCategoryItem from "../components/analytics/SpendingCategoryItem";
import { useAuth } from "../context/AuthContext";
import {
  BudgetPerformance,
  CashFlowData,
  CategorySpending,
  DebtHealth,
  MerchantSpending,
  NeedsWantsSavingsData,
  NetWorthData,
  SpendingInsights,
  SpendingVelocity,
  UpcomingBill,
  useAnalytics,
} from "../hooks/useAnalytics";
import { useTransactions } from "../hooks/useTransactions";

import CashFlowTrendChart from "../components/analytics/CashFlowTrendChart";
import { DebtHealthCard } from "../components/analytics/DebtHealthCard";
import { MerchantInsightsCard } from "../components/analytics/MerchantInsightsCard";
import { NeedsWantsSavingsChart } from "../components/analytics/NeedsWantsSavingsChart";
import { SpendingVelocityCard } from "../components/analytics/SpendingVelocityCard";
import { UpcomingBillsCard } from "../components/analytics/UpcomingBillsCard";
import { createStyles } from "../styles/QSAnalytics.styles";
import { useTheme } from "../theme/ThemeContext";

export default function QSAnalyticsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const styles = createStyles(theme);

  const {
    getNetWorth,
    getSpendingByCategory,
    getCashFlow,
    getBudgetPerformance,
    getSpendingInsights,
    getNeedsWantsSavings,
    getMerchantSpending,
    getSpendingVelocity,
    getUpcomingBills,
    getDebtHealth,
  } = useAnalytics();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "spending" | "cashflow" | "budgets"
  >("spending");
  const [dateRange, setDateRange] = useState<{
    type: "days" | "thisMonth" | "custom";
    days?: number;
    startDate?: Date;
    endDate?: Date;
  }>({ type: "days", days: 7 });
  const [netWorth, setNetWorth] = useState<NetWorthData | null>(null);
  const [spending, setSpending] = useState<CategorySpending[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlowData[]>([]);
  const [budgets, setBudgets] = useState<BudgetPerformance[]>([]);
  const [insights, setInsights] = useState<SpendingInsights | null>(null);
  const [needsWantsData, setNeedsWantsData] =
    useState<NeedsWantsSavingsData | null>(null);

  // New premium analytics state
  const [merchantSpending, setMerchantSpending] = useState<MerchantSpending[]>(
    [],
  );
  const [spendingVelocity, setSpendingVelocity] =
    useState<SpendingVelocity | null>(null);
  const [upcomingBills, setUpcomingBills] = useState<UpcomingBill[]>([]);
  const [debtHealth, setDebtHealth] = useState<DebtHealth | null>(null);

  // Category transactions modal state
  const { getTransactionsByCategory, getTransactionsByMerchant } =
    useTransactions();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [categoryTransactions, setCategoryTransactions] = useState<any[]>([]);
  const [loadingCategoryTxns, setLoadingCategoryTxns] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [showCustomRangePicker, setShowCustomRangePicker] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  // Merchant transactions modal state
  const [showMerchantModal, setShowMerchantModal] = useState(false);
  const [selectedMerchant, setSelectedMerchant] =
    useState<MerchantSpending | null>(null);
  const [merchantTransactions, setMerchantTransactions] = useState<any[]>([]);
  const [loadingMerchantTxns, setLoadingMerchantTxns] = useState(false);
  const [merchantSearchQuery, setMerchantSearchQuery] = useState("");

  // Flow transactions modal state
  const { getTransactionsByFlow } = useTransactions();
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<{
    date: string;
    type: "income" | "expense";
    amount: number;
    label: string;
  } | null>(null);
  const [flowTransactions, setFlowTransactions] = useState<any[]>([]);
  const [loadingFlowTxns, setLoadingFlowTxns] = useState(false);
  const [flowSearchQuery, setFlowSearchQuery] = useState("");

  // NWS transactions modal state
  const [showNWSModal, setShowNWSModal] = useState(false);
  const [nwsModalTitle, setNWSModalTitle] = useState("");
  const [nwsTransactions, setNwsTransactions] = useState<any[]>([]);
  const [nwsSearchQuery, setNwsSearchQuery] = useState("");

  const handleSegmentPress = (
    type: "needs" | "wants" | "savings",
    title: string,
  ) => {
    if (!needsWantsData) return;
    setNWSModalTitle(title);
    setNwsSearchQuery("");
    if (type === "needs")
      setNwsTransactions(needsWantsData.needsTransactions || []);
    else if (type === "wants")
      setNwsTransactions(needsWantsData.wantsTransactions || []);
    else if (type === "savings")
      setNwsTransactions(needsWantsData.savingsTransactions || []);
    setShowNWSModal(true);
  };

  const fetchCategoryTransactions = async (categoryId: string) => {
    if (!user) return;
    setLoadingCategoryTxns(true);
    try {
      const start =
        dateRange.type === "custom" && dateRange.startDate
          ? dateRange.startDate.toISOString()
          : dateRange.type === "thisMonth"
            ? startOfMonth(new Date()).toISOString()
            : subDays(
                new Date(),
                Math.max(1, dateRange.days || 30) - 1,
              ).toISOString();
      const txns = await getTransactionsByCategory(user.id, categoryId, start);
      setCategoryTransactions(txns);
    } catch (err) {
      console.error("Error fetching category transactions:", err);
      setCategoryTransactions([]);
    } finally {
      setLoadingCategoryTxns(false);
    }
  };

  const fetchMerchantTransactions = async (merchantName: string) => {
    if (!user) return;
    setLoadingMerchantTxns(true);
    try {
      const start =
        dateRange.type === "custom" && dateRange.startDate
          ? dateRange.startDate.toISOString()
          : dateRange.type === "thisMonth"
            ? startOfMonth(new Date()).toISOString()
            : subDays(
                new Date(),
                Math.max(1, dateRange.days || 30) - 1,
              ).toISOString();
      const txns = await getTransactionsByMerchant(
        user.id,
        merchantName,
        start,
      );
      setMerchantTransactions(txns);
    } catch (err) {
      console.error("Error fetching merchant transactions:", err);
      setMerchantTransactions([]);
    } finally {
      setLoadingMerchantTxns(false);
    }
  };

  const fetchFlowTransactions = async (
    date: string,
    type: "income" | "expense",
  ) => {
    if (!user) return;
    setLoadingFlowTxns(true);
    try {
      const txns = await getTransactionsByFlow(user.id, date, type);
      setFlowTransactions(txns);
    } catch (err) {
      console.error("Error fetching flow transactions:", err);
      setFlowTransactions([]);
    } finally {
      setLoadingFlowTxns(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const [nw, sp, cf, bd, ins, nws, merchants, velocity, bills, debt] =
        await Promise.all([
          getNetWorth(user.id, dateRange),
          getSpendingByCategory(user.id, dateRange),
          getCashFlow(user.id, dateRange),
          getBudgetPerformance(user.id),
          getSpendingInsights(user.id, dateRange),
          getNeedsWantsSavings(user.id, dateRange),
          getMerchantSpending(user.id, dateRange),
          getSpendingVelocity(user.id),
          getUpcomingBills(user.id),
          getDebtHealth(user.id),
        ]);
      setNetWorth(nw);
      setSpending(sp);
      setCashFlow(cf);
      setBudgets(bd);
      setInsights(ins);
      setNeedsWantsData(nws as NeedsWantsSavingsData);
      setMerchantSpending(merchants);
      setSpendingVelocity(velocity);
      setUpcomingBills(bills);
      setDebtHealth(debt);
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
    getSpendingInsights,
    getNeedsWantsSavings,
    getMerchantSpending,
    getSpendingVelocity,
    getUpcomingBills,
    getDebtHealth,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const DateFilter = () => {
    // if (activeTab === "budgets") return null; // Enabled for Insights now

    const filterOptions = [
      { label: "7 Days", type: "days", days: 7 },
      { label: "30 Days", type: "days", days: 30 },
      { label: "90 Days", type: "days", days: 90 },
      { label: "This Month", type: "thisMonth" },
      { label: "Custom", type: "custom" },
    ];

    const getActiveLabel = () => {
      if (dateRange.type === "days") {
        return `${dateRange.days || 0} Days`;
      }
      if (dateRange.type === "thisMonth") {
        return "This Month";
      }
      if (
        dateRange.type === "custom" &&
        dateRange.startDate &&
        dateRange.endDate
      ) {
        return `${format(dateRange.startDate, "MMM d")} - ${format(
          dateRange.endDate,
          "MMM d",
        )}`;
      }
      return "Custom";
    };

    return (
      <View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterSheet(true)}
        >
          <View style={styles.filterButtonContent}>
            <MaterialCommunityIcons
              name="filter-variant"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.filterButtonLabel}>Filter</Text>
            <Text style={styles.filterButtonDivider}>•</Text>
            <Text style={styles.filterButtonValue}>{getActiveLabel()}</Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-down"
            size={18}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>

        <QSBottomSheet
          visible={showFilterSheet}
          onClose={() => setShowFilterSheet(false)}
          title="Filter"
          showSearch={false}
          showDoneButton={false}
          variant="bottom"
        >
          <View style={{ gap: 10 }}>
            {filterOptions.map((opt, idx) => {
              const isActive =
                (opt.type === "days" &&
                  dateRange.type === "days" &&
                  dateRange.days === opt.days) ||
                (opt.type === "thisMonth" &&
                  dateRange.type === "thisMonth") ||
                (opt.type === "custom" && dateRange.type === "custom");

              return (
                <Pressable
                  key={idx}
                  onPress={() => {
                    if (opt.type === "custom") {
                      setShowFilterSheet(false);
                      setShowCustomRangePicker(true);
                      return;
                    }
                    setDateRange({ type: opt.type as any, days: opt.days });
                    setShowFilterSheet(false);
                  }}
                  style={({ pressed }) => [
                    styles.filterOption,
                    isActive && styles.filterOptionActive,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      isActive && styles.filterOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isActive && (
                    <MaterialCommunityIcons
                      name="check"
                      size={18}
                      color={theme.colors.primary}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </QSBottomSheet>
        {dateRange.type === "custom" &&
          dateRange.startDate &&
          dateRange.endDate && (
            <View style={{ alignItems: "center", marginTop: 8 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: theme.colors.textSecondary,
                  fontWeight: "500",
                }}
              >
                Range: {format(dateRange.startDate, "MMM dd, yyyy")} -{" "}
                {format(dateRange.endDate, "MMM dd, yyyy")}
              </Text>
            </View>
          )}
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchData}
            tintColor={theme.colors.primary}
          />
        }
      >
        <QSHeader />
        {/* Net Worth Card */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <NetWorthCard data={netWorth} loading={refreshing} />
        </Animated.View>

        {/* Date Filter (Global Control) */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <DateFilter />
        </Animated.View>

        {showCustomRangePicker && (
          <QSCustomRangePicker
            visible={showCustomRangePicker}
            onClose={() => setShowCustomRangePicker(false)}
            initialStartDate={dateRange.startDate}
            initialEndDate={dateRange.endDate}
            onApply={(start, end) => {
              setDateRange({
                type: "custom",
                startDate: start,
                endDate: end,
              });
            }}
          />
        )}

        {/* Sub-navigation Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "spending" && styles.activeTabItem,
            ]}
            onPress={() => setActiveTab("spending")}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === "spending" && styles.activeTabLabel,
              ]}
            >
              Spending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "cashflow" && styles.activeTabItem,
            ]}
            onPress={() => setActiveTab("cashflow")}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === "cashflow" && styles.activeTabLabel,
              ]}
            >
              Cash Flow
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "budgets" && styles.activeTabItem,
            ]}
            onPress={() => setActiveTab("budgets")}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === "budgets" && styles.activeTabLabel,
              ]}
            >
              Insights
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Content Sections */}
        {activeTab === "spending" && (
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
                {(() => {
                  const maxSpend = spending.reduce(
                    (sum, s) => sum + s.total,
                    0,
                  );
                  return spending.map((item, index) => (
                    <SpendingCategoryItem
                      key={item.category_id}
                      item={item}
                      maxSpend={maxSpend}
                      index={index}
                      theme={theme}
                      formatCurrency={formatCurrency}
                      onPress={() => {
                        setSelectedCategory(item);
                        setShowCategoryModal(true);
                        fetchCategoryTransactions(item.category_id);
                      }}
                    />
                  ));
                })()}
              </View>
            </View>
          </Animated.View>
        )}

        {activeTab === "cashflow" && (
          <Animated.View entering={FadeInUp.springify()}>
            {/* Cash Flow Trend Chart */}
            <CashFlowTrendChart data={cashFlow} loading={refreshing} />

            {/* Cash Flow Summary */}
            {cashFlow.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Summary</Text>

                {(() => {
                  const totalIncome = cashFlow.reduce(
                    (sum, item) => sum + item.income,
                    0,
                  );
                  const totalExpense = cashFlow.reduce(
                    (sum, item) => sum + item.expense,
                    0,
                  );
                  const netCashFlow = totalIncome - totalExpense;

                  const highestIncomeDay = [...cashFlow].sort(
                    (a, b) => b.income - a.income,
                  )[0];
                  const highestExpenseDay = [...cashFlow].sort(
                    (a, b) => b.expense - a.expense,
                  )[0];

                  const avgDailyNet = netCashFlow / (cashFlow.length || 1);

                  return (
                    <View>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 20,
                        }}
                      >
                        <View style={{ flex: 1, alignItems: "center" }}>
                          <Text
                            style={{
                              fontSize: 12,
                              color: theme.colors.textSecondary,
                              marginBottom: 4,
                            }}
                          >
                            Total Income
                          </Text>
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: "700",
                              color: theme.colors.success,
                            }}
                          >
                            {formatCurrency(totalIncome)}
                          </Text>
                        </View>
                        <View
                          style={{
                            width: 1,
                            backgroundColor: theme.colors.border,
                            height: "80%",
                            alignSelf: "center",
                          }}
                        />
                        <View style={{ flex: 1, alignItems: "center" }}>
                          <Text
                            style={{
                              fontSize: 12,
                              color: theme.colors.textSecondary,
                              marginBottom: 4,
                            }}
                          >
                            Total Expense
                          </Text>
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: "700",
                              color: theme.colors.error,
                            }}
                          >
                            {formatCurrency(totalExpense)}
                          </Text>
                        </View>
                        <View
                          style={{
                            width: 1,
                            backgroundColor: theme.colors.border,
                            height: "80%",
                            alignSelf: "center",
                          }}
                        />
                        <View style={{ flex: 1, alignItems: "center" }}>
                          <Text
                            style={{
                              fontSize: 12,
                              color: theme.colors.textSecondary,
                              marginBottom: 4,
                            }}
                          >
                            Net Flow
                          </Text>
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: "700",
                              color:
                                netCashFlow >= 0
                                  ? theme.colors.primary
                                  : theme.colors.error,
                            }}
                          >
                            {formatCurrency(netCashFlow)}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={{
                          backgroundColor: theme.colors.backgroundSecondary,
                          padding: 16,
                          borderRadius: 12,
                          gap: 12,
                        }}
                      >
                        <Pressable
                          onPress={() => {
                            setSelectedFlow({
                              date: highestIncomeDay.fullDate,
                              type: "income",
                              amount: highestIncomeDay.income,
                              label: "Highest Income",
                            });
                            setShowFlowModal(true);
                            fetchFlowTransactions(
                              highestIncomeDay.fullDate,
                              "income",
                            );
                          }}
                          style={({ pressed }) => ({
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            opacity: pressed ? 0.7 : 1,
                          })}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <MaterialCommunityIcons
                              name="arrow-up-circle-outline"
                              size={20}
                              color={theme.colors.success}
                              style={{ marginRight: 8 }}
                            />
                            <Text
                              style={{ color: theme.colors.text, fontSize: 14 }}
                            >
                              Highest Income
                            </Text>
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <View
                              style={{ alignItems: "flex-end", marginRight: 8 }}
                            >
                              <Text
                                style={{
                                  color: theme.colors.text,
                                  fontWeight: "600",
                                }}
                              >
                                {formatCurrency(highestIncomeDay.income)}
                              </Text>
                              <Text
                                style={{
                                  color: theme.colors.textSecondary,
                                  fontSize: 11,
                                }}
                              >
                                {highestIncomeDay.date}
                              </Text>
                            </View>
                            <MaterialCommunityIcons
                              name="chevron-right"
                              size={16}
                              color={theme.colors.textTertiary}
                            />
                          </View>
                        </Pressable>

                        <View
                          style={{
                            height: 1,
                            backgroundColor: theme.colors.border + "50",
                          }}
                        />

                        <Pressable
                          onPress={() => {
                            setSelectedFlow({
                              date: highestExpenseDay.fullDate,
                              type: "expense",
                              amount: highestExpenseDay.expense,
                              label: "Highest Expense",
                            });
                            setShowFlowModal(true);
                            fetchFlowTransactions(
                              highestExpenseDay.fullDate,
                              "expense",
                            );
                          }}
                          style={({ pressed }) => ({
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            opacity: pressed ? 0.7 : 1,
                          })}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <MaterialCommunityIcons
                              name="arrow-down-circle-outline"
                              size={20}
                              color={theme.colors.error}
                              style={{ marginRight: 8 }}
                            />
                            <Text
                              style={{ color: theme.colors.text, fontSize: 14 }}
                            >
                              Highest Expense
                            </Text>
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <View
                              style={{ alignItems: "flex-end", marginRight: 8 }}
                            >
                              <Text
                                style={{
                                  color: theme.colors.text,
                                  fontWeight: "600",
                                }}
                              >
                                {formatCurrency(highestExpenseDay.expense)}
                              </Text>
                              <Text
                                style={{
                                  color: theme.colors.textSecondary,
                                  fontSize: 11,
                                }}
                              >
                                {highestExpenseDay.date}
                              </Text>
                            </View>
                            <MaterialCommunityIcons
                              name="chevron-right"
                              size={16}
                              color={theme.colors.textTertiary}
                            />
                          </View>
                        </Pressable>

                        <View
                          style={{
                            height: 1,
                            backgroundColor: theme.colors.border + "50",
                          }}
                        />

                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <MaterialCommunityIcons
                              name="trending-up"
                              size={20}
                              color={theme.colors.primary}
                              style={{ marginRight: 8 }}
                            />
                            <Text
                              style={{ color: theme.colors.text, fontSize: 14 }}
                            >
                              Avg. Daily Net
                            </Text>
                          </View>
                          <Text
                            style={{
                              color: theme.colors.text,
                              fontWeight: "600",
                            }}
                          >
                            {formatCurrency(Math.round(avgDailyNet))}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}
              </View>
            )}
          </Animated.View>
        )}

        {activeTab === "budgets" && (
          <View>
            {insights && (
              <Animated.View entering={FadeInUp.springify()}>
                {/* Needs vs Wants vs Savings */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Breakdown</Text>
                  <NeedsWantsSavingsChart
                    data={needsWantsData}
                    theme={theme}
                    onSegmentPress={handleSegmentPress}
                  />
                </View>

                {/* Comparison & Suggestion Card */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Spending Insights</Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor:
                          insights.percentageChange <= 0
                            ? theme.colors.success + "20"
                            : theme.colors.error + "20",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      <MaterialCommunityIcons
                        name={
                          insights.percentageChange <= 0
                            ? "arrow-down-bold"
                            : "arrow-up-bold"
                        }
                        size={24}
                        color={
                          insights.percentageChange <= 0
                            ? theme.colors.success
                            : theme.colors.error
                        }
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, color: theme.colors.text }}>
                        {insights.trendMessage}
                      </Text>
                    </View>
                  </View>
                  {insights.topCategory && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        backgroundColor: theme.colors.backgroundSecondary,
                        padding: 12,
                        borderRadius: 12,
                      }}
                    >
                      <MaterialCommunityIcons
                        name="lightbulb-on-outline"
                        size={20}
                        color={theme.colors.primary}
                        style={{ marginRight: 10, marginTop: 2 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            color: theme.colors.text,
                            fontWeight: "600",
                            marginBottom: 4,
                          }}
                        >
                          Suggestion
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: theme.colors.textSecondary,
                            lineHeight: 18,
                          }}
                        >
                          {insights.suggestion}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Daily Snapshot & Projection */}
                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    marginBottom: 16,
                    marginHorizontal: theme.spacing.l,
                  }}
                >
                  <View
                    style={[
                      styles.sectionCard,
                      { flex: 1, marginBottom: 0, marginHorizontal: 0 },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.colors.textSecondary,
                        marginBottom: 4,
                      }}
                    >
                      Daily Average
                    </Text>
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "700",
                        color: theme.colors.text,
                      }}
                    >
                      {formatCurrency(Math.round(insights.dailyAverage))}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.sectionCard,
                      { flex: 1, marginBottom: 0, marginHorizontal: 0 },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.colors.textSecondary,
                        marginBottom: 4,
                      }}
                    >
                      30-Day Projection
                    </Text>
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "700",
                        color: theme.colors.primary,
                      }}
                    >
                      {formatCurrency(Math.round(insights.projectedTotal))}
                    </Text>
                  </View>
                </View>

                {/* Big Spender Card */}
                {insights.largestTransaction && (
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Largest Spend</Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: theme.colors.backgroundSecondary,
                        padding: 16,
                        borderRadius: 16,
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor:
                            insights.largestTransaction.category_color + "20",
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 16,
                        }}
                      >
                        <MaterialCommunityIcons
                          name={
                            insights.largestTransaction.category_icon as any
                          }
                          size={24}
                          color={insights.largestTransaction.category_color}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "700",
                            color: theme.colors.text,
                            marginBottom: 4,
                          }}
                        >
                          {insights.largestTransaction.category_name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: theme.colors.textSecondary,
                            marginBottom: 2,
                          }}
                        >
                          {insights.largestTransaction.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: theme.colors.textTertiary,
                          }}
                        >
                          {isToday(new Date(insights.largestTransaction.date))
                            ? "Today"
                            : isYesterday(
                                  new Date(insights.largestTransaction.date),
                                )
                              ? "Yesterday"
                              : !isNaN(
                                    new Date(
                                      insights.largestTransaction.date,
                                    ).getTime(),
                                  )
                                ? format(
                                    new Date(insights.largestTransaction.date),
                                    "EEE, d MMM",
                                  )
                                : "Unknown Date"}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "800",
                          color: theme.colors.error,
                        }}
                      >
                        {formatCurrency(insights.largestTransaction.amount)}
                      </Text>
                    </View>
                  </View>
                )}
              </Animated.View>
            )}

            <Animated.View
              entering={FadeInUp.springify()}
              style={styles.sectionCard}
            >
              <Text style={styles.sectionTitle}>Budget Usage</Text>
              <View style={styles.budgetList}>
                {budgets.length > 0 ? (
                  budgets.map((budget) => (
                    <View key={budget.category_id} style={styles.budgetItem}>
                      <View style={styles.budgetInfo}>
                        <Text style={styles.budgetCategory}>
                          {budget.category_name}
                        </Text>
                        <Text style={styles.budgetAmount}>
                          {formatCurrency(budget.spent_amount)} /{" "}
                          {formatCurrency(budget.budget_amount)}
                        </Text>
                      </View>
                      <View style={styles.progressBarBackground}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${Math.min(Number.isFinite(budget.percentage) ? budget.percentage : 0, 100)}%`,
                              backgroundColor:
                                budget.percentage > 100
                                  ? theme.colors.error
                                  : theme.colors.primary,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          color: theme.colors.textSecondary,
                          alignSelf: "flex-end",
                          fontWeight: "500",
                        }}
                      >
                        {budget.percentage.toFixed(0)}% used
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text
                    style={{
                      textAlign: "center",
                      color: theme.colors.textSecondary,
                      marginVertical: 20,
                    }}
                  >
                    No budgets set up for the current month.
                  </Text>
                )}
              </View>
            </Animated.View>

            {/* Spending Velocity Card */}
            <Animated.View entering={FadeInUp.delay(100).springify()}>
              <SpendingVelocityCard
                data={spendingVelocity}
                loading={refreshing}
                theme={theme}
                formatCurrency={formatCurrency}
              />
            </Animated.View>

            {/* Top Merchants Card */}
            <Animated.View entering={FadeInUp.delay(200).springify()}>
              <MerchantInsightsCard
                data={merchantSpending}
                loading={refreshing}
                theme={theme}
                formatCurrency={formatCurrency}
                onAmountPress={(merchant) => {
                  setSelectedMerchant(merchant);
                  setMerchantSearchQuery("");
                  setShowMerchantModal(true);
                  fetchMerchantTransactions(merchant.merchant_name);
                }}
                onMerchantPress={(merchant) => {
                  setSelectedMerchant(merchant);
                  setMerchantSearchQuery("");
                  setShowMerchantModal(true);
                  fetchMerchantTransactions(merchant.merchant_name);
                }}
              />
            </Animated.View>

            {/* Upcoming Bills Card */}
            <Animated.View entering={FadeInUp.delay(300).springify()}>
              <UpcomingBillsCard
                data={upcomingBills}
                loading={refreshing}
                theme={theme}
                formatCurrency={formatCurrency}
              />
            </Animated.View>

            {/* Debt Health Card */}
            <Animated.View entering={FadeInUp.delay(400).springify()}>
              <DebtHealthCard
                data={debtHealth}
                loading={refreshing}
                theme={theme}
                formatCurrency={formatCurrency}
              />
            </Animated.View>
          </View>
        )}

        {/* Category Transactions Modal */}
        <QSBottomSheet
          visible={showCategoryModal}
          onClose={() => {
            setShowCategoryModal(false);
            setCategoryTransactions([]);
            setSelectedCategory(null);
            setCategorySearchQuery("");
          }}
          title={
            selectedCategory
              ? `Transactions — ${selectedCategory.category_name || selectedCategory.name}`
              : "Transactions"
          }
          showCloseButton={false}
          showSearch
          searchPlaceholder="Search transactions..."
          searchValue={categorySearchQuery}
          onSearchChange={setCategorySearchQuery}
          showDoneButton
          onDone={() => setShowCategoryModal(false)}
        >
          <View style={{ gap: 12 }}>
            {loadingCategoryTxns ? (
              <Text
                style={{
                  textAlign: "center",
                  color: theme.colors.textSecondary,
                }}
              >
                Loading...
              </Text>
            ) : categoryTransactions.length === 0 ? (
              <Text
                style={{
                  textAlign: "center",
                  color: theme.colors.textSecondary,
                }}
              >
                No transactions for this category.
              </Text>
            ) : (
              <View style={styles.transactionList}>
                {categoryTransactions
                  .filter((tx) => {
                    if (!categorySearchQuery) return true;
                    const q = categorySearchQuery.toLowerCase();
                    return (
                      (tx.name || "").toLowerCase().includes(q) ||
                      (tx.account_name || "").toLowerCase().includes(q) ||
                      (tx.amount || "").toString().includes(q)
                    );
                  })
                  .map((tx) => (
                    <Pressable
                      key={tx.id}
                      onPress={() => {
                        /* noop or future detail */
                      }}
                      style={({ pressed }) => [
                        styles.transactionItem,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <View
                        style={[
                          styles.transactionIcon,
                          {
                            backgroundColor:
                              (selectedCategory?.category_color ||
                                theme.colors.primary) + "15",
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={
                            (selectedCategory?.category_icon as any) ||
                            "swap-horizontal"
                          }
                          size={20}
                          color={
                            selectedCategory?.category_color ||
                            theme.colors.primary
                          }
                        />
                      </View>

                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionTitle} numberOfLines={1}>
                          {tx.name || tx.category_name || "Transaction"}
                        </Text>
                        <Text style={styles.transactionSubtitle}>
                          {format(new Date(tx.date), "MMM d, yyyy • h:mm a")}
                        </Text>
                        {tx.account_name && (
                          <Text style={styles.transactionAccount}>
                            {tx.account_name}
                          </Text>
                        )}
                      </View>

                      <View style={styles.amountContainer}>
                        <Text
                          style={[
                            styles.transactionAmount,
                            {
                              color:
                                tx.type === "income"
                                  ? theme.colors.success
                                  : theme.colors.text,
                            },
                          ]}
                        >
                          {tx.type === "expense" ? "-" : "+"}
                          {formatCurrency(Math.abs(tx.amount))}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
              </View>
            )}
          </View>
        </QSBottomSheet>

        {/* Merchant Transactions Modal */}
        <QSBottomSheet
          visible={showMerchantModal}
          onClose={() => {
            setShowMerchantModal(false);
            setMerchantTransactions([]);
            setSelectedMerchant(null);
            setMerchantSearchQuery("");
          }}
          title={
            selectedMerchant
              ? `Transactions — ${selectedMerchant.merchant_name}`
              : "Transactions"
          }
          showCloseButton={false}
          showSearch
          searchPlaceholder="Search transactions..."
          searchValue={merchantSearchQuery}
          onSearchChange={setMerchantSearchQuery}
          showDoneButton
          onDone={() => setShowMerchantModal(false)}
        >
          <View style={{ gap: 12 }}>
            {loadingMerchantTxns ? (
              <Text
                style={{
                  textAlign: "center",
                  color: theme.colors.textSecondary,
                }}
              >
                Loading...
              </Text>
            ) : merchantTransactions.length === 0 ? (
              <Text
                style={{
                  textAlign: "center",
                  color: theme.colors.textSecondary,
                }}
              >
                No transactions for this merchant.
              </Text>
            ) : (
              <View style={styles.transactionList}>
                {merchantTransactions
                  .filter((tx) => {
                    if (!merchantSearchQuery) return true;
                    const q = merchantSearchQuery.toLowerCase();
                    return (
                      (tx.name || "").toLowerCase().includes(q) ||
                      (tx.account_name || "").toLowerCase().includes(q) ||
                      (tx.category_name || "").toLowerCase().includes(q) ||
                      (tx.amount || "").toString().includes(q)
                    );
                  })
                  .map((tx) => (
                    <Pressable
                      key={tx.id}
                      style={({ pressed }) => [
                        styles.transactionItem,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <View
                        style={[
                          styles.transactionIcon,
                          {
                            backgroundColor:
                              (tx.category_color || theme.colors.primary) +
                              "15",
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={(tx.category_icon as any) || "swap-horizontal"}
                          size={20}
                          color={tx.category_color || theme.colors.primary}
                        />
                      </View>

                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionTitle} numberOfLines={1}>
                          {tx.name || tx.category_name || "Transaction"}
                        </Text>
                        <Text style={styles.transactionSubtitle}>
                          {format(new Date(tx.date), "MMM d, yyyy • h:mm a")}
                        </Text>
                        {tx.account_name && (
                          <Text style={styles.transactionAccount}>
                            {tx.account_name}
                          </Text>
                        )}
                      </View>

                      <View style={styles.amountContainer}>
                        <Text
                          style={{
                            color:
                              tx.type === "income"
                                ? theme.colors.success
                                : theme.colors.text,
                            fontWeight: "700",
                          }}
                        >
                          {tx.type === "expense" ? "-" : "+"}
                          {formatCurrency(Math.abs(tx.amount))}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
              </View>
            )}
          </View>
        </QSBottomSheet>

        {/* Flow Transactions Modal */}
        <QSBottomSheet
          visible={showFlowModal}
          onClose={() => {
            setShowFlowModal(false);
            setFlowTransactions([]);
            setSelectedFlow(null);
            setFlowSearchQuery("");
          }}
          title={
            selectedFlow
              ? `${selectedFlow.label} — ${format(new Date(selectedFlow.date), "MMM d, yyyy")}`
              : "Transactions"
          }
          showCloseButton={false}
          showSearch
          searchPlaceholder="Search transactions..."
          searchValue={flowSearchQuery}
          onSearchChange={setFlowSearchQuery}
          showDoneButton
          onDone={() => setShowFlowModal(false)}
        >
          <View style={{ gap: 12 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor:
                  (selectedFlow?.type === "income"
                    ? theme.colors.success
                    : theme.colors.error) + "10",
                padding: 12,
                borderRadius: 12,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                Total for this day:
              </Text>
              <Text
                style={{
                  color:
                    selectedFlow?.type === "income"
                      ? theme.colors.success
                      : theme.colors.error,
                  fontWeight: "700",
                  fontSize: 16,
                }}
              >
                {selectedFlow ? formatCurrency(selectedFlow.amount) : "₹0"}
              </Text>
            </View>

            {loadingFlowTxns ? (
              <Text
                style={{
                  textAlign: "center",
                  color: theme.colors.textSecondary,
                  paddingVertical: 20,
                }}
              >
                Loading...
              </Text>
            ) : flowTransactions.length === 0 ? (
              <Text
                style={{
                  textAlign: "center",
                  color: theme.colors.textSecondary,
                  paddingVertical: 20,
                }}
              >
                No transactions found for this day.
              </Text>
            ) : (
              <View style={styles.transactionList}>
                {flowTransactions
                  .filter((tx) => {
                    if (!flowSearchQuery) return true;
                    const q = flowSearchQuery.toLowerCase();
                    return (
                      (tx.name || "").toLowerCase().includes(q) ||
                      (tx.account_name || "").toLowerCase().includes(q) ||
                      (tx.category_name || "").toLowerCase().includes(q) ||
                      (tx.amount || "").toString().includes(q)
                    );
                  })
                  .map((tx) => (
                    <Pressable
                      key={tx.id}
                      style={({ pressed }) => [
                        styles.transactionItem,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <View
                        style={[
                          styles.transactionIcon,
                          {
                            backgroundColor:
                              (tx.category_color || theme.colors.primary) +
                              "15",
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={(tx.category_icon as any) || "swap-horizontal"}
                          size={20}
                          color={tx.category_color || theme.colors.primary}
                        />
                      </View>

                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionTitle} numberOfLines={1}>
                          {tx.name || tx.category_name || "Transaction"}
                        </Text>
                        <Text style={styles.transactionSubtitle}>
                          {tx.category_name || "Uncategorized"}
                        </Text>
                        {tx.account_name && (
                          <Text style={styles.transactionAccount}>
                            {tx.account_name}
                          </Text>
                        )}
                      </View>

                      <View style={styles.amountContainer}>
                        <Text
                          style={[
                            styles.transactionAmount,
                            {
                              color:
                                tx.type === "income"
                                  ? theme.colors.success
                                  : theme.colors.text,
                            },
                          ]}
                        >
                          {tx.type === "expense" ? "-" : "+"}
                          {formatCurrency(Math.abs(tx.amount))}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
              </View>
            )}
          </View>
        </QSBottomSheet>

        {/* NWS Transactions Modal */}
        <QSBottomSheet
          visible={showNWSModal}
          onClose={() => {
            setShowNWSModal(false);
            setNwsTransactions([]);
            setNwsSearchQuery("");
          }}
          title={nwsModalTitle}
          showCloseButton={false}
          showSearch
          searchPlaceholder="Search transactions..."
          searchValue={nwsSearchQuery}
          onSearchChange={setNwsSearchQuery}
          showDoneButton
          onDone={() => setShowNWSModal(false)}
        >
          <View style={{ gap: 12 }}>
            {nwsTransactions.length === 0 ? (
              <Text
                style={{
                  textAlign: "center",
                  color: theme.colors.textSecondary,
                  paddingVertical: 20,
                }}
              >
                No transactions found for this category.
              </Text>
            ) : (
              <View style={styles.transactionList}>
                {nwsTransactions
                  .filter((tx) => {
                    if (!nwsSearchQuery) return true;
                    const q = nwsSearchQuery.toLowerCase();
                    return (
                      (tx.name || "").toLowerCase().includes(q) ||
                      (tx.category_name || "").toLowerCase().includes(q) ||
                      (tx.amount || "").toString().includes(q)
                    );
                  })
                  .map((tx) => (
                    <Pressable
                      key={tx.id}
                      style={({ pressed }) => [
                        styles.transactionItem,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <View
                        style={[
                          styles.transactionIcon,
                          {
                            backgroundColor:
                              (tx.category_color || theme.colors.primary) +
                              "15",
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={(tx.category_icon as any) || "swap-horizontal"}
                          size={20}
                          color={tx.category_color || theme.colors.primary}
                        />
                      </View>

                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionTitle} numberOfLines={1}>
                          {tx.name || tx.category_name || "Transaction"}
                        </Text>
                        <Text style={styles.transactionSubtitle}>
                          {format(new Date(tx.date), "MMM d, yyyy")}
                        </Text>
                      </View>

                      <View style={styles.amountContainer}>
                        <Text
                          style={[
                            styles.transactionAmount,
                            {
                              color:
                                tx.type === "income"
                                  ? theme.colors.success
                                  : tx.type === "expense"
                                    ? theme.colors.error
                                    : theme.colors.text,
                            },
                          ]}
                        >
                          {tx.type === "expense"
                            ? "-"
                            : tx.type === "income"
                              ? "+"
                              : ""}
                          {formatCurrency(Math.abs(tx.amount))}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
              </View>
            )}
          </View>
        </QSBottomSheet>
      </ScrollView>
    </View>
  );
}
