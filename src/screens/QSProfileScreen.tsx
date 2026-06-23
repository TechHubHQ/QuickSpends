import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
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
import Animated, { FadeInRight, FadeInUp } from "react-native-reanimated";
import { QSHeader } from "../components/QSHeader";
import { useAuth } from "../context/AuthContext";
import { useAccounts } from "../hooks/useAccounts";
import { useLoans } from "../hooks/useLoans";
import { useMonthlyPlans } from "../hooks/useMonthlyPlans";
import { useSavings } from "../hooks/useSavings";
import { useUpcomingBills } from "../hooks/useUpcomingBills";
import { createStyles } from "../styles/QSProfile.styles";
import { useTheme } from "../theme/ThemeContext";
import { getSafeIconName } from "../utils/iconMapping";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function QSProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme.isDark;
  const styles = createStyles(theme);
  const { user } = useAuth();
  const { getAccountsByUser } = useAccounts();
  const { getSavingsGoals } = useSavings();
  const { getLoans } = useLoans();
  const { bills, fetchBills } = useUpcomingBills();
  const { getOrCreatePlan, getPlanItems } = useMonthlyPlans();

  const [refreshing, setRefreshing] = useState(false);
  const [savings, setSavings] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [totalNetWorth, setTotalNetWorth] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [planSummary, setPlanSummary] = useState<{
    totalIncome: number;
    totalExpenses: number;
    surplus: number;
    pendingBills: number;
    billCount: number;
  } | null>(null);

  const sortedBills = React.useMemo(() => {
    return [...bills].sort((a, b) => {
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
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

  const fetchData = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const [accountsData, savingsData, loansData] = await Promise.all([
        getAccountsByUser(user.id),
        getSavingsGoals(user.id),
        getLoans(user.id),
      ]);

      await fetchBills();

      setSavings(savingsData);
      setLoans(loansData);

      let assets = 0;
      let liabilities = 0;
      accountsData.forEach((acc: any) => {
        if (acc.linked_account_id) return;
        if (acc.type === "credit" || (acc.type === "card" && acc.card_type === "credit")) {
          liabilities += Math.abs(acc.balance);
        } else {
          assets += acc.balance;
        }
      });
      setTotalAssets(assets);
      setTotalLiabilities(liabilities);
      setTotalNetWorth(assets - liabilities);

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
    } finally {
      setRefreshing(false);
    }
  }, [user, getAccountsByUser, getSavingsGoals, getLoans, fetchBills, getOrCreatePlan, getPlanItems]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

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
        <QSHeader title="Portfolio" />

        {/* Monthly Plan Summary Card */}
        {planSummary && (
          <Animated.View entering={FadeInUp.delay(100).springify()}>
            <Pressable
              onPress={() => router.push("/monthly-planner")}
              style={({ pressed }) => [styles.planCard, { opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={styles.planCardHeader}>
                <View style={styles.planCardTitleRow}>
                  <View style={styles.planIconBox}>
                    <MaterialCommunityIcons name="calendar-month" size={20} color={theme.colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.planTitle}>This Month</Text>
                    <Text style={styles.planSubtitle}>
                      {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </Text>
                  </View>
                </View>
                <View style={styles.planViewLink}>
                  <Text style={styles.planViewText}>View Plan</Text>
                  <MaterialCommunityIcons name="chevron-right" size={16} color={theme.colors.primary} />
                </View>
              </View>
              <View style={styles.planRow}>
                <Text style={styles.planRowLabel}>Income</Text>
                <Text style={[styles.planRowValue, { color: "#22C55E" }]}>+{formatCurrency(planSummary.totalIncome)}</Text>
              </View>
              <View style={styles.planRow}>
                <Text style={styles.planRowLabel}>Expenses</Text>
                <Text style={[styles.planRowValue, { color: theme.colors.error }]}>-{formatCurrency(planSummary.totalExpenses)}</Text>
              </View>
              <View style={styles.planDivider} />
              <View style={styles.planSurplusRow}>
                <Text style={[styles.planSurplusAmount, { color: planSummary.surplus >= 0 ? "#22C55E" : theme.colors.error }]}>
                  {planSummary.surplus >= 0 ? "+" : ""}{formatCurrency(planSummary.surplus)}
                </Text>
                <Text style={styles.planSurplusLabel}>{planSummary.surplus >= 0 ? "Surplus" : "Deficit"}</Text>
              </View>
              {planSummary.billCount > 0 && (
                <View style={styles.planBillsRow}>
                  <MaterialCommunityIcons name="calendar-clock" size={14} color={theme.colors.warning} />
                  <Text style={styles.planBillsText}>
                    {planSummary.billCount} bills to settle • {formatCurrency(planSummary.pendingBills)}
                  </Text>
                </View>
              )}
            </Pressable>
          </Animated.View>
        )}

        {/* Net Worth Summary */}
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <View style={styles.netWorthCard}>
            <Text style={styles.netWorthTitle}>Net Worth</Text>
            <Text style={[styles.netWorthAmount, { color: totalNetWorth >= 0 ? "#22C55E" : theme.colors.error }]}>
              {formatCurrency(totalNetWorth)}
            </Text>
            <View style={styles.netWorthRow}>
              <View style={styles.netWorthItem}>
                <MaterialCommunityIcons name="arrow-up-circle" size={16} color="#22C55E" />
                <Text style={styles.netWorthItemText}>Assets: {formatCurrency(totalAssets)}</Text>
              </View>
              <View style={styles.netWorthItem}>
                <MaterialCommunityIcons name="arrow-down-circle" size={16} color={theme.colors.error} />
                <Text style={styles.netWorthItemText}>Liabilities: {formatCurrency(totalLiabilities)}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Savings Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Savings Goals</Text>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Pressable onPress={() => router.push("/portfolio/savings")} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Text style={styles.sectionAction}>View All</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/add-saving")} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <MaterialCommunityIcons name="plus-circle-outline" size={22} color={theme.colors.primary} />
            </Pressable>
          </View>
        </View>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardScroll}
          snapToInterval={216} decelerationRate="fast"
        >
          {savings.length > 0 ? (
            savings.map((goal, index) => {
              const percentage = goal.target_amount > 0
                ? Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100) : 0;
              return (
                <Animated.View key={goal.id} entering={FadeInRight.delay(200 + index * 50).springify()}>
                  <Pressable
                    style={({ pressed }) => [styles.card, { opacity: pressed ? 0.7 : 1 }]}
                    onPress={() => router.push({ pathname: "/saving-details/[id]", params: { id: goal.id } })}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={[styles.cardIconWrapper, { backgroundColor: `${goal.category_color || theme.colors.primary}20` }]}>
                        <MaterialCommunityIcons
                          name={getSafeIconName(goal.category_icon || "piggy-bank")}
                          size={20} color={goal.category_color || theme.colors.primary}
                        />
                      </View>
                      <View style={styles.cardBadge}>
                        <Text style={styles.cardBadgeText}>{percentage}%</Text>
                      </View>
                    </View>
                    <View>
                      <Text style={styles.cardName}>{goal.name}</Text>
                      <Text style={styles.cardSubtext}>₹{goal.current_amount.toLocaleString()} saved</Text>
                    </View>
                    <View style={[styles.cardProgressBg, { backgroundColor: `${goal.category_color || theme.colors.primary}20` }]}>
                      <View style={[styles.cardProgressFill, { backgroundColor: goal.category_color || theme.colors.primary, width: `${percentage}%` }]} />
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="piggy-bank-outline" size={28} color={theme.colors.textTertiary} />
              <Text style={styles.emptyText}>No savings goals</Text>
            </View>
          )}
        </ScrollView>

        {/* Loans Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Loans</Text>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Pressable onPress={() => router.push("/portfolio/loans")} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Text style={styles.sectionAction}>View All</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/add-loan")} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <MaterialCommunityIcons name="plus-circle-outline" size={22} color={theme.colors.primary} />
            </Pressable>
          </View>
        </View>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardScroll}
          snapToInterval={216} decelerationRate="fast"
        >
          {loans.length > 0 ? (
            loans.map((loan, index) => {
              const isLent = loan.type === "lent";
              const percentage = Math.min(Math.round((loan.remaining_amount / loan.total_amount) * 100), 100);
              const color = isLent ? "#10B981" : "#EF4444";
              return (
                <Animated.View key={loan.id} entering={FadeInRight.delay(200 + index * 50).springify()}>
                  <Pressable
                    style={({ pressed }) => [styles.card, { opacity: pressed ? 0.7 : 1 }]}
                    onPress={() => router.push({ pathname: "/loan-details/[id]", params: { id: loan.id } })}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={[styles.cardIconWrapper, { backgroundColor: `${color}20` }]}>
                        <MaterialCommunityIcons name={isLent ? "hand-coin" : "hand-peace"} size={20} color={color} />
                      </View>
                      <View style={styles.cardBadge}>
                        <Text style={[styles.cardBadgeText, { color }]}>{isLent ? "Lent" : "Borrowed"}</Text>
                      </View>
                    </View>
                    <View>
                      <Text style={styles.cardName}>{loan.person_name}</Text>
                      <Text style={styles.cardSubtext}>₹{loan.remaining_amount.toLocaleString()} left</Text>
                    </View>
                    <View style={[styles.cardProgressBg, { backgroundColor: `${color}20` }]}>
                      <View style={[styles.cardProgressFill, { backgroundColor: color, width: `${percentage}%` }]} />
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="hand-coin-outline" size={28} color={theme.colors.textTertiary} />
              <Text style={styles.emptyText}>No active loans</Text>
            </View>
          )}
        </ScrollView>

        {/* Upcoming Bills Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Bills</Text>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Pressable onPress={() => router.push("/portfolio/upcoming-bills")} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Text style={styles.sectionAction}>View All</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/add-upcoming-bill")} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <MaterialCommunityIcons name="plus-circle-outline" size={22} color={theme.colors.primary} />
            </Pressable>
          </View>
        </View>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardScroll}
          snapToInterval={216} decelerationRate="fast"
        >
          {billPreviewCards.length > 0 ? (
            billPreviewCards.map(({ bill, isCompleted, isOverdue, daysUntilDue }, index) => {
              const badgeText = isCompleted ? "COMPLETED" : isOverdue ? "OVERDUE" : daysUntilDue === 0 ? "TODAY" : daysUntilDue === 1 ? "TOMORROW" : daysUntilDue <= 30 ? `${daysUntilDue}D` : "UPCOMING";
              return (
                <Animated.View key={bill.id} entering={FadeInRight.delay(200 + index * 50).springify()}>
                  <Pressable
                    style={({ pressed }) => [styles.card, {
                      opacity: pressed ? 0.7 : isCompleted ? 0.78 : 1,
                      backgroundColor: `${theme.colors.warning}10`,
                      borderWidth: 1, borderColor: `${theme.colors.warning}30`,
                      borderLeftWidth: 4, borderLeftColor: isOverdue ? theme.colors.error : isCompleted ? theme.colors.textTertiary : theme.colors.warning,
                    }]}
                    onPress={() => router.push(`/bill-details/${bill.id}`)}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={[styles.cardIconWrapper, { backgroundColor: `${isOverdue ? theme.colors.error : theme.colors.warning}20` }]}>
                        <MaterialCommunityIcons name="file-document-outline" size={20} color={isOverdue ? theme.colors.error : theme.colors.warning} />
                      </View>
                      <View style={styles.cardBadge}>
                        <Text style={[styles.cardBadgeText, { color: isOverdue ? theme.colors.error : theme.colors.warning, fontSize: 10 }]}>{badgeText}</Text>
                      </View>
                    </View>
                    <View>
                      <Text style={styles.cardName} numberOfLines={1}>{bill.name}</Text>
                      <Text style={styles.cardSubtext}>₹{bill.amount.toLocaleString()}</Text>
                    </View>
                    <Text style={[styles.cardSubtext, { color: isCompleted ? theme.colors.textTertiary : isOverdue ? theme.colors.error : theme.colors.textSecondary, fontSize: 12 }]}>
                      {isCompleted ? "Completed" : "Due"}: {new Date(bill.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="calendar-clock-outline" size={28} color={theme.colors.textTertiary} />
              <Text style={styles.emptyText}>No upcoming bills</Text>
            </View>
          )}
        </ScrollView>

        {/* Accounts Link */}
        <Pressable
          style={({ pressed }) => [styles.linkCard, { opacity: pressed ? 0.7 : 1, marginTop: theme.spacing.l }]}
          onPress={() => router.push("/accounts")}
        >
          <View style={styles.linkCardLeft}>
            <View style={styles.linkCardIcon}>
              <MaterialCommunityIcons name="bank" size={22} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.linkCardText}>Accounts</Text>
              <Text style={styles.linkCardSubtext}>Manage bank, cash & card accounts</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textTertiary} />
        </Pressable>

        {/* Recurring Transactions Link */}
        <Pressable
          style={({ pressed }) => [styles.linkCard, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.push("/recurring-transactions")}
        >
          <View style={styles.linkCardLeft}>
            <View style={styles.linkCardIcon}>
              <MaterialCommunityIcons name="calendar-refresh-outline" size={22} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.linkCardText}>Recurring Transactions</Text>
              <Text style={styles.linkCardSubtext}>View scheduled payments & income</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textTertiary} />
        </Pressable>
      </ScrollView>
    </View>
  );
}