import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInUp,
} from "react-native-reanimated";
import { QSHeader } from "../components/QSHeader";
import { QSInfoSheet } from "../components/QSInfoSheet";
import { QSTransactionIndicators } from "../components/QSTransactionIndicators";
import { useAuth } from "../context/AuthContext";
import { useAccounts } from "../hooks/useAccounts";
import { useBudgets } from "../hooks/useBudgets";
import { useLoans } from "../hooks/useLoans";
import { useSavings } from "../hooks/useSavings";
import { useTransactions } from "../hooks/useTransactions";
import { Trip, useTrips } from "../hooks/useTrips";
import { useUpcomingBills } from "../hooks/useUpcomingBills";
import { useCategories } from "../hooks/useCategories";
import { useMonthlyPlans } from "../hooks/useMonthlyPlans";
import { useTags } from "../hooks/useTags";
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
  const { getSavingsGoals } = useSavings();
  const { getLoans } = useLoans();
  const { bills, fetchBills } = useUpcomingBills();
  const { categories } = useCategories();
  const { getAllTagsWithSpending } = useTags();
  const { getOrCreatePlan, getPlanItems } = useMonthlyPlans();

  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalanceInfo, setShowBalanceInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "budgets" | "trips" | "bills" | "savings" | "loans" | "events"
  >("budgets");
  const [totalBalance, setTotalBalance] = useState(0);
  const [balanceTrend, setBalanceTrend] = useState({
    percentage: 0,
    trend: "up" as "up" | "down",
  });
  const [budgets, setBudgets] = useState<any[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]); // Added accounts state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [savings, setSavings] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [activeEvents, setActiveEvents] = useState<any[]>([]);
  const [planSummary, setPlanSummary] = useState<{
    totalIncome: number;
    totalExpenses: number;
    surplus: number;
    pendingBills: number;
    billCount: number;
  } | null>(null);
  const sortedBills = React.useMemo(() => {
    return [...bills].sort((a, b) => {
      if (a.is_active !== b.is_active) {
        return a.is_active ? -1 : 1;
      }
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }, [bills]);

  const billPreviewCards = React.useMemo(() => {
    const now = Date.now();
    return sortedBills.slice(0, 6).map((bill) => {
      const dueDateMs = new Date(bill.due_date).getTime();
      return {
        bill,
        isCompleted: !bill.is_active,
        isOverdue: bill.is_active && dueDateMs < now,
        daysUntilDue: Math.ceil((dueDateMs - now) / (1000 * 60 * 60 * 24)),
      };
    });
  }, [sortedBills]);

  useEffect(() => {
    if (accounts.length > 0) {
      let availableBalance = 0;

      accounts.forEach((acc: any) => {
        // Skip linked accounts (children of shared cards) to avoid double counting
        if (acc.linked_account_id) return;

        // Only include liquid assets: Bank, Cash, Debit Card
        const isLiquid =
          acc.type === "bank" ||
          acc.type === "cash" ||
          (acc.type === "card" && acc.card_type === "debit");
        if (isLiquid) {
          availableBalance += acc.balance;
        }
      });

      setTotalBalance(availableBalance);

      if (user?.id) {
        getBalanceTrend(user.id, availableBalance).then(setBalanceTrend);
      }
    }
  }, [accounts, user, getBalanceTrend]);

  const fetchData = useCallback(async () => {
    if (!user) return;

    setRefreshing(true);
    try {
      const [
        accountsData,
        transactionsData,
        budgetsData,
        tripsData,
        savingsData,
        loansData,
      ] = await Promise.all([
        getAccountsByUser(user.id),
        getRecentTransactions(user.id, 5),
        getBudgetsWithSpending(user.id),
        getTripsByUser(user.id),
        getSavingsGoals(user.id),
        getLoans(user.id),
      ]);

      await fetchBills();

      // Fetch monthly plan summary
      if (user) {
        const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
        const plan = await getOrCreatePlan(user.id, monthKey);
        if (plan) {
          const items = await getPlanItems(plan.id);
          const income = items.filter((i) => i.type === "income").reduce((s, i) => s + i.amount, 0);
          const expenses = items.filter((i) => i.type === "expense").reduce((s, i) => s + i.amount, 0);
          const pendingBills = items.filter(
            (i) => i.type === "expense" && i.status === "pending" && (i.source_type === "bill" || i.source_type === "loan"),
          );
          setPlanSummary({
            totalIncome: income,
            totalExpenses: expenses,
            surplus: income - expenses,
            pendingBills: pendingBills.reduce((s, i) => s + i.amount, 0),
            billCount: pendingBills.length,
          });
        }
      }

      setAccounts(accountsData);
      setLoans(loansData);

      // Calculate initial balance using Liquid Assets logic
      let availableBalance = 0;

      accountsData.forEach((acc: any) => {
        // Skip linked accounts (children of shared cards) to avoid double counting
        if (acc.linked_account_id) return;

        // Only include liquid assets: Bank, Cash, Debit Card
        const isLiquid =
          acc.type === "bank" ||
          acc.type === "cash" ||
          (acc.type === "card" && acc.card_type === "debit");

        if (isLiquid) {
          availableBalance += acc.balance;
        }
      });

      setTotalBalance(availableBalance);

      const trendData = await getBalanceTrend(user.id, availableBalance);
      setBalanceTrend(trendData);

      setTransactions(transactionsData);
      setBudgets(budgetsData);
      setTrips(tripsData);
      setSavings(savingsData);
      setLoans(loansData);

      // Fetch active events (events with future dates and budgets)
      const allTagSpending = await getAllTagsWithSpending(user.id);
      const events = allTagSpending
        .filter((t: any) => t.is_event && t.event_date)
        .sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
      setActiveEvents(events);
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  }, [
    user,
    getAccountsByUser,
    getRecentTransactions,
    getBudgetsWithSpending,
    getTripsByUser,
    getSavingsGoals,
    getLoans,
    getBalanceTrend,
    fetchBills,
    getOrCreatePlan,
    getPlanItems,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getBillCategory = useCallback(
    (bill: any) => {
      const subCategory = bill.sub_category_id
        ? categories.find((category) => category.id === bill.sub_category_id)
        : undefined;
      if (subCategory) return subCategory;
      return bill.category_id
        ? categories.find((item) => item.id === bill.category_id)
        : undefined;
    },
    [categories],
  );

  const getBillIconName = useCallback(
    (bill: any) => {
      const category = getBillCategory(bill);
      const fallbackIcon =
        bill.bill_type === "transfer" ? "bank-transfer" : "file-document-outline";
      return getSafeIconName(category?.icon || fallbackIcon);
    },
    [getBillCategory],
  );

  const getBillAccentColor = useCallback(
    (bill: any) => {
      const category = getBillCategory(bill);
      if (category?.color) return category.color;
      if (!bill.is_active) return theme.colors.textTertiary;
      return bill.bill_type === "transfer"
        ? theme.colors.info
        : theme.colors.primary;
    },
    [getBillCategory, theme.colors.info, theme.colors.primary, theme.colors.textTertiary],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

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
        {/* Balance Card */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <LinearGradient
            colors={
              theme.isDark ? ["#050505", "#27272a"] : ["#FFFFFF", "#F1F5F9"]
            }
            start={{ x: 1, y: 0 }} // Start top right (Darker)
            end={{ x: 0, y: 1 }} // End bottom left (Lighter)
            style={styles.balanceCard}
          >
            <View style={styles.balanceDecoration} />
            <View style={styles.balanceLabelRow}>
              <View style={styles.balanceLabel}>
                <Text style={styles.balanceLabelText}>Total Balance</Text>
                <Pressable
                  onPress={() => setIsBalanceVisible(!isBalanceVisible)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <MaterialCommunityIcons
                    name={isBalanceVisible ? "eye" : "eye-off"}
                    size={18}
                    color={isDark ? "#9FB3C8" : "#64748B"}
                  />
                </Pressable>
                <Pressable
                  onPress={() => setShowBalanceInfo(true)}
                  style={({ pressed }) => [{ marginLeft: 4 }, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={16}
                    color={isDark ? "#9FB3C8" : "#64748B"}
                  />
                </Pressable>
              </View>
            </View>

            <Text style={styles.balanceAmount}>
              {isBalanceVisible ? formatCurrency(totalBalance) : "••••••••"}
            </Text>

            <View style={styles.balanceActions}>
              <Pressable
                style={({ pressed }) => [styles.addMoneyButton, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => {
                  // @ts-ignore
                  router.push({
                    pathname: "/add-transaction",
                    params: { initialType: "income" },
                  });
                }}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={20}
                  color={theme.colors.onPrimary}
                />
                <Text style={styles.addMoneyText}>Add Money</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.transferButton, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => {
                  // @ts-ignore
                  router.push({
                    pathname: "/add-transaction",
                    params: { initialType: "transfer" },
                  });
                }}
              >
                <MaterialCommunityIcons
                  name="swap-horizontal"
                  size={20}
                  color={theme.colors.text}
                />
                <Text style={styles.transferText}>Transfer</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Monthly Plan Summary Card */}
        {planSummary && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Pressable
              onPress={() => router.push("/monthly-planner")}
              style={({ pressed }) => ({
                opacity: pressed ? 0.85 : 1,
                marginHorizontal: theme.spacing.m,
                marginBottom: theme.spacing.s,
                padding: theme.spacing.m,
                borderRadius: theme.borderRadius.l,
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: `${theme.colors.primary}25`,
                ...theme.shadows.small,
              })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: theme.spacing.s }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: `${theme.colors.primary}18`,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <MaterialCommunityIcons name="calendar-month" size={20} color={theme.colors.primary} />
                  </View>
                  <View>
                    <Text style={{ fontSize: theme.typography.bodySmall.fontSize, fontWeight: "600", color: theme.colors.text }}>
                      This Month
                    </Text>
                    <Text style={{ fontSize: theme.typography.caption.fontSize, color: theme.colors.textSecondary }}>
                      {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ fontSize: theme.typography.caption.fontSize, color: theme.colors.primary, fontWeight: "600" }}>
                    View Plan
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={16} color={theme.colors.primary} />
                </View>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: theme.spacing.xs }}>
                <Text style={{ fontSize: theme.typography.bodySmall.fontSize, color: theme.colors.textSecondary }}>Income</Text>
                <Text style={{ fontSize: theme.typography.bodySmall.fontSize, fontWeight: "600", color: "#22C55E" }}>
                  +{formatCurrency(planSummary.totalIncome)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: theme.spacing.xs }}>
                <Text style={{ fontSize: theme.typography.bodySmall.fontSize, color: theme.colors.textSecondary }}>Expenses</Text>
                <Text style={{ fontSize: theme.typography.bodySmall.fontSize, fontWeight: "600", color: theme.colors.error }}>
                  -{formatCurrency(planSummary.totalExpenses)}
                </Text>
              </View>

              <View style={{ height: 1, backgroundColor: `${theme.colors.textTertiary}30`, marginVertical: theme.spacing.s }} />

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: theme.typography.body.fontSize, fontWeight: "700", color: planSummary.surplus >= 0 ? "#22C55E" : theme.colors.error }}>
                  {planSummary.surplus >= 0 ? "+" : ""}{formatCurrency(planSummary.surplus)}
                </Text>
                <Text style={{ fontSize: theme.typography.caption.fontSize, color: theme.colors.textSecondary }}>
                  {planSummary.surplus >= 0 ? "Surplus" : "Deficit"}
                </Text>
              </View>

              {planSummary.billCount > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: theme.spacing.s, paddingTop: theme.spacing.s, borderTopWidth: 1, borderTopColor: `${theme.colors.textTertiary}20` }}>
                  <MaterialCommunityIcons name="calendar-clock" size={14} color={theme.colors.warning} />
                  <Text style={{ fontSize: theme.typography.caption.fontSize, color: theme.colors.textSecondary }}>
                    {planSummary.billCount} bills to settle • {formatCurrency(planSummary.pendingBills)}
                  </Text>
                </View>
              )}
            </Pressable>
          </Animated.View>
        )}

        {/* Switcher Section (Budgets / Trips / Savings / Bills / Loans / Events) */}
        <View style={[styles.sectionHeader, { paddingRight: 0 }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.switcherContainer}
            decelerationRate="fast"
          >
            <Pressable
              onPress={() => setActiveTab("budgets")}
              style={({ pressed }) => [
                styles.tabButton,
                activeTab === "budgets" && styles.activeTabButton,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "budgets" && styles.activeTabText,
                ]}
              >
                Budgets
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("trips")}
              style={({ pressed }) => [
                styles.tabButton,
                activeTab === "trips" && styles.activeTabButton,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "trips" && styles.activeTabText,
                ]}
              >
                Trips
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("savings")}
              style={({ pressed }) => [
                styles.tabButton,
                activeTab === "savings" && styles.activeTabButton,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "savings" && styles.activeTabText,
                ]}
              >
                Savings
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("bills")}
              style={({ pressed }) => [
                styles.tabButton,
                activeTab === "bills" && styles.activeTabButton,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "bills" && styles.activeTabText,
                ]}
              >
                Bills
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("loans")}
              style={({ pressed }) => [
                styles.tabButton,
                activeTab === "loans" && styles.activeTabButton,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "loans" && styles.activeTabText,
                ]}
              >
                Loans
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("events")}
              style={({ pressed }) => [
                styles.tabButton,
                activeTab === "events" && styles.activeTabButton,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "events" && styles.activeTabText,
                ]}
              >
                Events
              </Text>
            </Pressable>
          </ScrollView>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingRight: theme.spacing.l,
            }}
          >
            {activeTab === "budgets" && (
              <Pressable
                onPress={() => router.push("/budget-creation")}
                style={({ pressed }) => [
                  {
                    backgroundColor: theme.colors.primary,
                    padding: 4,
                    borderRadius: 12,
                  },
                  { opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <MaterialCommunityIcons
                  name="plus-circle-outline"
                  size={20}
                  color={theme.colors.onPrimary}
                />
              </Pressable>
            )}
            {activeTab === "trips" && (
              <Pressable
                onPress={() => router.push("/create-trip")}
                style={({ pressed }) => [
                  {
                    backgroundColor: theme.colors.primary,
                    padding: 4,
                    borderRadius: 12,
                  },
                  { opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <MaterialCommunityIcons
                  name="plus-circle-outline"
                  size={20}
                  color={theme.colors.onPrimary}
                />
              </Pressable>
            )}
            {activeTab === "savings" && (
              <Pressable
                onPress={() => router.push("/add-saving")}
                style={({ pressed }) => [
                  {
                    backgroundColor: theme.colors.primary,
                    padding: 4,
                    borderRadius: 12,
                  },
                  { opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <MaterialCommunityIcons
                  name="plus-circle-outline"
                  size={20}
                  color={theme.colors.onPrimary}
                />
              </Pressable>
            )}
            {activeTab === "bills" && (
              <Pressable
                onPress={() => router.push("/add-upcoming-bill")}
                style={({ pressed }) => [
                  {
                    backgroundColor: theme.colors.primary,
                    padding: 4,
                    borderRadius: 12,
                  },
                  { opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <MaterialCommunityIcons
                  name="plus-circle-outline"
                  size={20}
                  color={theme.colors.onPrimary}
                />
              </Pressable>
            )}
            {activeTab === "loans" && (
              <Pressable
                onPress={() => router.push("/add-loan")}
                style={({ pressed }) => [
                  {
                    backgroundColor: theme.colors.primary,
                    padding: 4,
                    borderRadius: 12,
                  },
                  { opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <MaterialCommunityIcons
                  name="plus-circle-outline"
                  size={20}
                  color={theme.colors.onPrimary}
                />
              </Pressable>
            )}
            {activeTab === "events" && (
              <Pressable
                onPress={() => {
                  // @ts-ignore
                  router.push('/tags-management');
                }}
                style={({ pressed }) => [
                  {
                    backgroundColor: theme.colors.primary,
                    padding: 4,
                    borderRadius: 12,
                  },
                  { opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <MaterialCommunityIcons
                  name="tag-plus-outline"
                  size={20}
                  color={theme.colors.onPrimary}
                />
              </Pressable>
            )}
          </View>
        </View>

        {activeTab === "budgets" ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.budgetScroll}
            snapToInterval={216}
            decelerationRate="fast"
          >
            {budgets.length > 0 ? (
              budgets.map((budget, index) => {
                const percentage = Math.min(
                  Math.round((budget.spent / budget.amount) * 100),
                  100,
                );
                const remaining = budget.amount - budget.spent;

                return (
                  <Animated.View
                    key={budget.id}
                    entering={FadeInRight.delay(200 + index * 50).springify()}
                  >
                    <Pressable
                      style={({ pressed }) => [styles.budgetCard, { opacity: pressed ? 0.7 : 1 }]}
                      onPress={() => {
                        // @ts-ignore
                        router.push({
                          pathname: `/budget-details/[id]`,
                          params: { id: budget.id },
                        });
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <View
                          style={[
                            styles.budgetIconWrapper,
                            { backgroundColor: budget.category_color + "20" },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={getSafeIconName(budget.category_icon)}
                            size={20}
                            color={budget.category_color}
                          />
                        </View>
                        <View style={styles.budgetPercentageWrapper}>
                          <Text style={styles.budgetPercentage}>
                            {percentage}%
                          </Text>
                        </View>
                      </View>
                      <View>
                        <Text style={styles.budgetName}>
                          {budget.category_name}
                        </Text>
                        <Text style={styles.budgetRemaining}>
                          {formatCurrency(remaining)} remaining
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.progressBarBackground,
                          { backgroundColor: budget.category_color + "20" },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              backgroundColor:
                                percentage > 100
                                  ? theme.colors.error
                                  : budget.category_color,
                              width: `${Math.min(percentage, 100)}%`,
                            },
                          ]}
                        />
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })
            ) : (
              <View
                style={[
                  styles.budgetCard,
                  { width: 300, justifyContent: "center" },
                ]}
              >
                <Text style={[styles.budgetName, { textAlign: "center" }]}>
                  No budgets set up yet
                </Text>
              </View>
            )}
          </ScrollView>
        ) : activeTab === "trips" ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tripScroll}
            snapToInterval={296}
            decelerationRate="fast"
          >
            {trips.length > 0 ? (
              trips.map((trip, index) => {
                const percentage = Math.min(
                  Math.round((trip.totalSpent / trip.budget) * 100),
                  100,
                );
                const isActive = trip.status === "active";

                return (
                  <Animated.View
                    key={trip.id}
                    entering={FadeInRight.delay(200 + index * 50).springify()}
                  >
                    <Pressable
                      style={({ pressed }) => [
                        styles.tripCard,
                        isActive && styles.tripActiveBorder,
                        { opacity: pressed ? 0.7 : 1 }
                      ]}
                      onPress={() => {
                        // @ts-ignore
                        router.push({
                          pathname: `/trip/[id]`,
                          params: { id: trip.id },
                        });
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
                                name="account"
                                size={14}
                                color="#FFFFFF"
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={styles.tripName}
                                numberOfLines={2}
                                ellipsizeMode="tail"
                              >
                                {trip.name}
                              </Text>
                              <Text style={styles.tripDate}>
                                {new Date(trip.startDate).toLocaleDateString(
                                  undefined,
                                  { month: "short", day: "numeric" },
                                )}{" "}
                                -{" "}
                                {new Date(trip.endDate).toLocaleDateString(
                                  undefined,
                                  { month: "short", day: "numeric" },
                                )}
                              </Text>
                            </View>
                          </View>
                          <View
                            style={[
                              styles.tripStatusBadge,
                              trip.status === "active"
                                ? styles.activeBadge
                                : trip.status === "upcoming"
                                  ? styles.upcomingBadge
                                  : styles.completedBadge,
                            ]}
                          >
                            <Text
                              style={[
                                styles.tripStatusText,
                                trip.status === "active"
                                  ? styles.activeStatusText
                                  : trip.status === "upcoming"
                                    ? styles.upcomingStatusText
                                    : styles.completedStatusText,
                              ]}
                            >
                              {trip.status}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.tripFooter}>
                          <Text style={styles.tripAmount}>
                            {formatCurrency(trip.totalSpent)}
                          </Text>
                          <View style={styles.tripBudgetInfo}>
                            <Text style={styles.tripBudgetText}>
                              {formatCurrency(trip.totalSpent)} /{" "}
                              {formatCurrency(trip.budget)}
                            </Text>
                            <View style={styles.tripProgressBar}>
                              <View
                                style={[
                                  styles.tripProgressBarFill,
                                  { width: `${percentage}%` },
                                ]}
                              />
                            </View>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })
            ) : (
              <View
                style={[
                  styles.tripCard,
                  { width: 300, justifyContent: "center" },
                ]}
              >
                <Text
                  style={[
                    styles.tripName,
                    { textAlign: "center", color: theme.colors.text },
                  ]}
                >
                  No trips recorded yet
                </Text>
              </View>
            )}
          </ScrollView>
        ) : activeTab === "savings" ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.budgetScroll}
            snapToInterval={216}
            decelerationRate="fast"
          >
            {savings.length > 0 ? (
              savings.map((goal, index) => {
                const percentage =
                  goal.target_amount > 0
                    ? Math.min(
                      Math.round(
                        (goal.current_amount / goal.target_amount) * 100,
                      ),
                      100,
                    )
                    : 0;

                return (
                  <Animated.View
                    key={goal.id}
                    entering={FadeInRight.delay(200 + index * 50).springify()}
                  >
                    <Pressable
                      style={({ pressed }) => [styles.budgetCard, { opacity: pressed ? 0.7 : 1 }]}
                      onPress={() =>
                        router.push({
                          pathname: "/saving-details/[id]",
                          params: { id: goal.id },
                        })
                      }
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <View
                          style={[
                            styles.budgetIconWrapper,
                            {
                              backgroundColor:
                                (goal.category_color || theme.colors.primary) +
                                "20",
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={getSafeIconName(
                              goal.category_icon || "piggy-bank",
                            )}
                            size={20}
                            color={goal.category_color || theme.colors.primary}
                          />
                        </View>
                        <View style={styles.budgetPercentageWrapper}>
                          <Text style={styles.budgetPercentage}>
                            {percentage}%
                          </Text>
                        </View>
                      </View>
                      <View>
                        <Text style={styles.budgetName}>{goal.name}</Text>
                        <Text style={styles.budgetRemaining}>
                          ₹{goal.current_amount.toLocaleString()} saved
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.progressBarBackground,
                          {
                            backgroundColor:
                              (goal.category_color || theme.colors.primary) +
                              "20",
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              backgroundColor:
                                goal.category_color || theme.colors.primary,
                              width: `${percentage}%`,
                            },
                          ]}
                        />
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })
            ) : (
              <View
                style={[
                  styles.budgetCard,
                  { width: 300, justifyContent: "center" },
                ]}
              >
                <Text style={[styles.budgetName, { textAlign: "center" }]}>
                  No savings goals yet
                </Text>
              </View>
            )}
          </ScrollView>
        ) : activeTab === "bills" ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.budgetScroll}
            snapToInterval={216}
            decelerationRate="fast"
          >
            {billPreviewCards.length > 0 ? (
              billPreviewCards.map(
                ({ bill, isCompleted, isOverdue, daysUntilDue }, index) => {
                  const accentColor = getBillAccentColor(bill);
                  const badgeText = isCompleted
                    ? "COMPLETED"
                    : isOverdue
                      ? "OVERDUE"
                      : daysUntilDue === 0
                        ? "TODAY"
                        : daysUntilDue === 1
                          ? "TOMORROW"
                          : daysUntilDue <= 30
                            ? `${daysUntilDue}D`
                            : "UPCOMING";

                  return (
                    <Animated.View
                      key={bill.id}
                      entering={FadeInRight.delay(200 + index * 50).springify()}
                    >
                      <Pressable
                        style={({ pressed }) => [
                          styles.budgetCard,
                          {
                            opacity: pressed ? 0.7 : isCompleted ? 0.78 : 1,
                            backgroundColor: accentColor + (isCompleted ? "10" : "14"),
                            borderWidth: 1,
                            borderColor: accentColor + "30",
                            borderLeftWidth: 4,
                            borderLeftColor: accentColor,
                          },
                        ]}
                        onPress={() => router.push(`/bill-details/${bill.id}`)}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <View
                            style={[
                              styles.budgetIconWrapper,
                              { backgroundColor: accentColor + "20" },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={getBillIconName(bill)}
                              size={20}
                              color={accentColor}
                            />
                          </View>
                          <View style={styles.budgetPercentageWrapper}>
                            <Text
                              style={[
                                styles.budgetPercentage,
                                { color: accentColor, fontSize: 10 },
                              ]}
                            >
                              {badgeText}
                            </Text>
                          </View>
                        </View>

                        <View>
                          <Text style={styles.budgetName} numberOfLines={1}>
                            {bill.name}
                          </Text>
                          <Text style={styles.budgetRemaining}>
                            ₹{bill.amount.toLocaleString()}
                          </Text>
                        </View>

                        <View style={{ marginTop: 8 }}>
                          <Text
                            style={[
                              styles.budgetRemaining,
                              {
                                color: isCompleted
                                  ? theme.colors.textTertiary
                                  : isOverdue
                                    ? theme.colors.error
                                    : theme.colors.textSecondary,
                                fontSize: 12,
                              },
                            ]}
                          >
                            {isCompleted ? "Completed" : "Due"}:{" "}
                            {new Date(bill.due_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </Text>
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                },
              )
            ) : (
              <View
                style={[
                  styles.budgetCard,
                  { width: 300, justifyContent: "center" },
                ]}
              >
                <Text style={[styles.budgetName, { textAlign: "center" }]}>
                  No bills found
                </Text>
              </View>
            )}
          </ScrollView>
        ) : activeTab === "loans" ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.budgetScroll}
            snapToInterval={216}
            decelerationRate="fast"
          >
            {loans.length > 0 ? (
              loans.map((loan, index) => {
                const isLent = loan.type === "lent";
                const percentage = Math.min(
                  Math.round((loan.remaining_amount / loan.total_amount) * 100),
                  100,
                );

                return (
                  <Animated.View
                    key={loan.id}
                    entering={FadeInRight.delay(200 + index * 50).springify()}
                  >
                    <Pressable
                      style={({ pressed }) => [styles.budgetCard, { opacity: pressed ? 0.7 : 1 }]}
                      onPress={() =>
                        router.push({
                          pathname: "/loan-details/[id]",
                          params: { id: loan.id },
                        })
                      }
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <View
                          style={[
                            styles.budgetIconWrapper,
                            {
                              backgroundColor:
                                (isLent ? "#10B981" : "#EF4444") + "20",
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={isLent ? "hand-coin" : "hand-peace"}
                            size={20}
                            color={isLent ? "#10B981" : "#EF4444"}
                          />
                        </View>
                        <View style={styles.budgetPercentageWrapper}>
                          <Text
                            style={[
                              styles.budgetPercentage,
                              { color: isLent ? "#10B981" : "#EF4444" },
                            ]}
                          >
                            {isLent ? "Lent" : "Borrowed"}
                          </Text>
                        </View>
                      </View>
                      <View>
                        <Text style={styles.budgetName}>
                          {loan.person_name}
                        </Text>
                        <Text style={styles.budgetRemaining}>
                          ₹{loan.remaining_amount.toLocaleString()} left
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.progressBarBackground,
                          {
                            backgroundColor:
                              (isLent ? "#10B981" : "#EF4444") + "20",
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              backgroundColor: isLent ? "#10B981" : "#EF4444",
                              width: `${percentage}%`,
                            },
                          ]}
                        />
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })
            ) : (
              <View
                style={[
                  styles.budgetCard,
                  { width: 300, justifyContent: "center" },
                ]}
              >
                <Text style={[styles.budgetName, { textAlign: "center" }]}>
                  No active loans
                </Text>
              </View>
            )}
          </ScrollView>
        ) : activeTab === "events" ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventsScroll}
            snapToInterval={180}
            decelerationRate="fast"
          >
            {activeEvents.length > 0 ? (
              activeEvents
                .filter((e: any) => new Date(e.event_date).getTime() > Date.now() - 86400000)
                .map((event: any, index: number) => {
                  const progressPercent = event.budget > 0 ? Math.min((event.spent / event.budget) * 100, 100) : 0;
                  const daysLeft = Math.ceil((new Date(event.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const eventImage = (() => {
                    switch (event.event_type) {
                      case 'birthday': return '🎂';
                      case 'marriage': return '💒';
                      case 'anniversary': return '💍';
                      case 'festival': return '🎉';
                      case 'travel': return '✈️';
                      default: return '📌';
                    }
                  })();
                  const eventBg = (() => {
                    switch (event.event_type) {
                      case 'birthday': return '#FF6B6B';
                      case 'marriage': return '#A29BFE';
                      case 'anniversary': return '#FDCB6E';
                      case 'festival': return '#55EFC4';
                      case 'travel': return '#74B9FF';
                      default: return '#6366F1';
                    }
                  })();

                  return (
                    <Animated.View key={event.id} entering={FadeInRight.delay(200 + index * 50).springify()}>
                      <Pressable
                        style={({ pressed }) => [styles.eventCard, { backgroundColor: eventBg, opacity: pressed ? 0.85 : 1 }]}
                        // @ts-ignore
                        onPress={() => router.push({ pathname: `/tag-details/[id]`, params: { id: event.id } })}
                      >
                        <Text style={{ fontSize: 32, marginBottom: 8 }}>{eventImage}</Text>
                        <Text style={styles.eventCardName} numberOfLines={1}>{event.name}</Text>
                        <Text style={styles.eventCardDate}>
                          {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Today!' : 'Past'}
                        </Text>
                        {event.budget > 0 && (
                          <View style={styles.eventMiniProgress}>
                            <View style={[styles.eventMiniProgressFill, { width: `${Math.min(progressPercent, 100)}%` }]} />
                          </View>
                        )}
                        <Text style={styles.eventCardBudget}>
                          ₹{event.spent.toLocaleString('en-IN')}{event.budget ? ` / ₹${event.budget.toLocaleString('en-IN')}` : ''}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  );
                })
            ) : (
              <View style={[styles.budgetCard, { width: 220, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📌</Text>
                <Text style={[styles.budgetName, { textAlign: 'center' }]}>No active events</Text>
                <Text style={[styles.budgetRemaining, { textAlign: 'center', marginTop: 4 }]}>Tap + to create one</Text>
              </View>
            )}
          </ScrollView>
        ) : // Fallback or empty (but logic covers all 6)
          null}

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Pressable
            onPress={() => router.push("/transactions")}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={styles.seeAllButton}>View All</Text>
          </Pressable>
        </View>

        <View style={styles.transactionList}>
          {transactions.length > 0 ? (
            transactions.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInUp.delay(500 + index * 50).springify()}
              >
                <Pressable
                  style={({ pressed }) => [styles.transactionItem, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => {
                    // @ts-ignore - Expo Router types
                    router.push({
                      pathname: "/transaction-details",
                      params: { transaction: JSON.stringify(item) },
                    });
                  }}
                >
                  <View style={styles.transactionLeft}>
                    <View style={styles.transactionIconBox}>
                      <MaterialCommunityIcons
                        name={
                          item.type === "transfer"
                            ? getSafeIconName(
                              item.category_icon || "swap-horizontal",
                            )
                            : item.name === "Opening Balance"
                              ? "wallet-plus"
                              : getSafeIconName(item.category_icon || "receipt")
                        }
                        size={24}
                        color={
                          item.category_color ||
                          (item.type === "transfer"
                            ? "#8B5CF6"
                            : item.name === "Opening Balance"
                              ? theme.colors.primary
                              : theme.colors.text)
                        }
                      />
                      {item.type === "transfer" && (
                        <View
                          style={{
                            position: "absolute",
                            bottom: -2,
                            right: -2,
                            backgroundColor: theme.colors.background,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            padding: 1,
                          }}
                        >
                          <MaterialCommunityIcons
                            name="swap-horizontal"
                            size={10}
                            color={theme.colors.textSecondary}
                          />
                        </View>
                      )}
                    </View>
                    <View>
                      <Text style={styles.transactionName}>{item.name}</Text>
                      <View style={styles.transactionMeta}>
                        <Text style={styles.transactionTime}>
                          {new Date(item.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                        <QSTransactionIndicators
                          tripId={item.trip_id}
                          savingsId={item.savings_id}
                          loanId={item.loan_id}
                        />
                      </View>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      {
                        color:
                          item.type === "income"
                            ? "#48BB78"
                            : item.type === "expense"
                              ? "#F56565"
                              : theme.colors.text,
                      },
                    ]}
                  >
                    {item.type === "expense" ? "-" : "+"}
                    {formatCurrency(Math.abs(item.amount))}
                  </Text>
                </Pressable>
              </Animated.View>
            ))
          ) : (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <Text style={styles.transactionTime}>No recent transactions</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <QSInfoSheet
        visible={showBalanceInfo}
        onClose={() => setShowBalanceInfo(false)}
        title="Total Balance Ratio"
      >
        <View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: theme.colors.text,
              marginBottom: 4,
            }}
          >
            Available Liquid Funds
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.textSecondary,
              lineHeight: 20,
            }}
          >
            This balance represents your immediately available funds for
            spending.
          </Text>
          <View
            style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: theme.colors.card,
              borderRadius: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <MaterialCommunityIcons
                name="check-circle"
                size={16}
                color={theme.colors.success}
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: theme.colors.text, fontWeight: "500" }}>
                Includes: Bank Accounts, Cash, Debit Cards
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons
                name="minus-circle"
                size={16}
                color={theme.colors.error}
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: theme.colors.text, fontWeight: "500" }}>
                Excludes: Credit Cards, Loans
              </Text>
            </View>
          </View>
        </View>
      </QSInfoSheet>
    </View>
  );
}
