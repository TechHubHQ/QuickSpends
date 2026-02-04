import { MaterialCommunityIcons } from "@expo/vector-icons";
import { subDays } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  SectionList,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { QSAccountPicker } from "../components/QSAccountPicker";
import { QSCustomRangePicker } from "../components/QSCustomRangePicker";
import { QSHeader } from "../components/QSHeader";
import { QSSelectSheet } from "../components/QSSelectSheet";
import { QSTransactionIndicators } from "../components/QSTransactionIndicators";
import { useAuth } from "../context/AuthContext";
import { useAccounts } from "../hooks/useAccounts";
import { useCategories } from "../hooks/useCategories";
import { useTransactions } from "../hooks/useTransactions";
import { createStyles } from "../styles/QSTransactions.styles";
import { useTheme } from "../theme/ThemeContext";
import { getSafeIconName } from "../utils/iconMapping";

type FilterType = "Date" | "Account" | "Type" | "Payment";

export default function QSTransactionsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { user } = useAuth();
  const {
    accountId: initialAccountId,
    categoryId: initialCategoryId,
    dateDays,
  } = useLocalSearchParams<{
    accountId?: string;
    categoryId?: string;
    dateDays?: string;
  }>();

  const { getRecentTransactions, getMonthlyStats } = useTransactions();

  const [categoryFilter, setCategoryFilter] = useState<string | null>(
    initialCategoryId || null,
  );
  const { getAccountsByUser } = useAccounts();
  const { getCategories } = useCategories();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState({
    currentTotal: 0,
    previousTotal: 0,
    percentageChange: 0,
    trend: "up",
  });

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");

  const [dateFilter, setDateFilter] = useState("All Time");
  const [accountFilter, setAccountFilter] = useState<string | null>(
    initialAccountId || null,
  );
  const [typeFilter, setTypeFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All"); // Cash vs Digital

  // Stats Filter State
  const [statsPeriod, setStatsPeriod] = useState<
    "today" | "month" | "all" | "custom"
  >("month");
  const [statsRange, setStatsRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(),
  });

  // Sheet Visibility
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showTypeSheet, setShowTypeSheet] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showCustomRangePicker, setShowCustomRangePicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchData();
      }
    }, [user, initialAccountId]),
  );

  useEffect(() => {
    // Apply incoming analytics filters (category & dateDays)
    if (initialCategoryId) {
      setCategoryFilter(initialCategoryId as string);
    }
    if (dateDays) {
      const days = Number(dateDays);
      if (days === 7) {
        setDateFilter("Last 7 Days");
      } else if (days === 30) {
        setDateFilter("Last 30 Days");
      } else if (!isNaN(days) && days > 0) {
        setDateFilter("Custom");
        setStatsPeriod("custom");
        setStatsRange({ start: subDays(new Date(), days), end: new Date() });
      }
    }
  }, [initialCategoryId, dateDays]);

  const fetchData = async () => {
    if (!user) return;
    const [txns, accs, cats, monthlyStats] = await Promise.all([
      getRecentTransactions(user.id, 500), // Increased limit for all-time view
      getAccountsByUser(user.id),
      getCategories(),
      getMonthlyStats(user.id),
    ]);

    // Map account details
    const accountsMap = new Map(accs.map((a: any) => [a.id, a]));
    const enrichedTxns = txns.map((t: any) => ({
      ...t,
      account: accountsMap.get(t.account_id) || {
        name: "Unknown",
        type: "bank",
      },
    }));

    setTransactions(enrichedTxns);
    setAccounts(accs);
    setCategories(cats);
    // We still keep the default monthly stats from hook for "vs last month" comparison
    // if we are in monthly mode, otherwise we'll calculate them locally.
    setStats(monthlyStats);
  };

  // Calculate Dynamic Stats based on Stats Period
  const dynamicStats = useMemo(() => {
    const now = new Date();
    let startDate = statsRange.start;
    let endDate = statsRange.end;
    let prevStartDate = new Date(0);
    let prevEndDate = new Date(0);
    let comparisonLabel = "last month";

    if (statsPeriod === "month" && transactions.length > 0) {
      return {
        ...stats,
        comparisonLabel: "last month",
        showComparison: true,
      };
    }

    if (statsPeriod === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
      );
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 1);
      prevEndDate = new Date(endDate);
      prevEndDate.setDate(prevEndDate.getDate() - 1);
      comparisonLabel = "yesterday";
    } else if (statsPeriod === "all") {
      startDate = new Date(0);
      endDate = new Date();
      // For All Time, we don't have a "previous" all time,
      // so let's compare total Expense vs total Income.
      const totalExpense = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        currentTotal: totalExpense,
        previousTotal: totalIncome,
        percentageChange:
          totalIncome > 0
            ? (Math.abs(totalExpense - totalIncome) / totalIncome) * 100
            : 0,
        trend: totalExpense > totalIncome ? "up" : "down",
        comparisonLabel: "total income",
        showComparison: true,
      };
    } else if (statsPeriod === "custom") {
      startDate = statsRange.start;
      endDate = statsRange.end;
      const diff = endDate.getTime() - startDate.getTime();
      prevStartDate = new Date(startDate.getTime() - diff - 86400000); // Subtract diff + 1 day padding
      prevEndDate = new Date(startDate.getTime() - 86400000);
      comparisonLabel = "previous period";
    }

    const calcTotal = (start: Date, end: Date) =>
      transactions
        .filter((t) => t.type === "expense")
        .filter((t) => {
          const d = new Date(t.date);
          return d >= start && d <= end;
        })
        .reduce((sum, t) => sum + t.amount, 0);

    const currentTotal = calcTotal(startDate, endDate);
    const previousTotal = calcTotal(prevStartDate, prevEndDate);

    let percentageChange = 0;
    if (previousTotal > 0) {
      percentageChange = ((currentTotal - previousTotal) / previousTotal) * 100;
    } else if (currentTotal > 0) {
      percentageChange = 100;
    }

    return {
      currentTotal,
      previousTotal,
      percentageChange: Math.abs(percentageChange),
      trend: currentTotal >= previousTotal ? "up" : "down",
      comparisonLabel,
      showComparison: true,
    };
  }, [statsPeriod, statsRange, transactions, stats]);

  const getStatsLabel = () => {
    switch (statsPeriod) {
      case "today":
        return "Total Spent Today";
      case "all":
        return "Total Spent (All Time)";
      case "custom":
        return `Spent (${statsRange.start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${statsRange.end.toLocaleDateString(undefined, { month: "short", day: "numeric" })})`;
      default:
        return "Total Spent this month";
    }
  };

  const getAccountName = (id: string | null) => {
    if (!id) return "Account";
    const acc = accounts.find((a) => a.id === id);
    return acc ? acc.name : "Account";
  };

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    let result = transactions;

    // 1. AccountId filter
    if (accountFilter) {
      result = result.filter((t) => t.account_id === accountFilter);
    }

    // 1b. Category filter (from Analytics quick link)
    if (categoryFilter) {
      result = result.filter((t) => t.category_id === categoryFilter);
    }

    // 2. Type Filter
    if (typeFilter !== "All") {
      result = result.filter((t) => t.type === typeFilter.toLowerCase());
    }

    // 3. Payment Method Filter (Cash vs Digital)
    if (paymentFilter !== "All") {
      if (paymentFilter === "Cash") {
        result = result.filter((t) => t.account.type === "cash");
      } else {
        result = result.filter((t) => t.account.type !== "cash");
      }
    }

    // 4. Date Filter
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfLast7Days = new Date(now);
    startOfLast7Days.setDate(now.getDate() - 7);
    const startOfLast30Days = new Date(now);
    startOfLast30Days.setDate(now.getDate() - 30);

    if (dateFilter === "Today") {
      result = result.filter((t) => new Date(t.date) >= startOfToday);
    } else if (dateFilter === "Yesterday") {
      result = result.filter((t) => {
        const d = new Date(t.date);
        return d >= startOfYesterday && d < startOfToday;
      });
    } else if (dateFilter === "Last 7 Days") {
      result = result.filter((t) => new Date(t.date) >= startOfLast7Days);
    } else if (dateFilter === "Last 30 Days") {
      result = result.filter((t) => new Date(t.date) >= startOfLast30Days);
    } else if (dateFilter === "Custom") {
      // Use statsRange for custom filtering
      result = result.filter((t) => {
        const d = new Date(t.date);
        return d >= statsRange.start && d <= statsRange.end;
      });
    }

    // 5. Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          (t.amount || "").toString().includes(query),
      );
    }

    return result;
  }, [
    transactions,
    searchQuery,
    accountFilter,
    typeFilter,
    paymentFilter,
    dateFilter,
    categoryFilter,
    statsRange,
  ]);

  // Grouping
  const sectionedTransactions = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();

    filteredTransactions.forEach((t) => {
      const tDate = new Date(t.date);
      let title = tDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      if (isSameDay(tDate, today)) title = "Today";
      else if (isSameDay(tDate, yesterday)) title = "Yesterday";
      else
        title = tDate.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });

      if (!groups[title]) groups[title] = [];
      groups[title].push(t);
    });

    return Object.keys(groups).map((title) => ({
      title,
      data: groups[title],
    }));
  }, [filteredTransactions]);

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View
      entering={FadeInUp.delay(300 + (index % 10) * 50).springify()}
    >
      <Pressable
        style={({ pressed }) => [
          styles.transactionItem,
          { opacity: pressed ? 0.7 : 1 },
        ]}
        onPress={() =>
          router.push({
            pathname: "/transaction-details",
            params: { transaction: JSON.stringify(item) },
          })
        }
      >
        <View style={styles.transactionLeft}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor:
                  (item.category_color || theme.colors.primary) + "20",
              },
            ]}
          >
            <MaterialCommunityIcons
              name={
                item.type === "transfer"
                  ? getSafeIconName(item.category_icon || "swap-horizontal")
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
                    : theme.colors.primary)
              }
            />
            {item.type === "transfer" && (
              <View
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  backgroundColor: theme.colors.card,
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
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginTop: 2,
              }}
            >
              <Text style={styles.itemSubtitle} numberOfLines={1}>
                {new Date(item.date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
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
            { color: item.type === "income" ? "#48BB78" : theme.colors.text },
          ]}
        >
          {item.type === "expense" ? "-" : "+"}
          {Math.abs(item.amount).toFixed(2)}
        </Text>
      </Pressable>
    </Animated.View>
  );

  const renderChip = (
    label: string,
    isActive: boolean,
    onPress: () => void,
  ) => (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        isActive && styles.activeChip,
        { opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, isActive && styles.activeChipText]}>
        {label}
      </Text>
      <MaterialCommunityIcons
        name="chevron-down"
        size={18}
        color={isActive ? "#FFFFFF" : theme.colors.textSecondary}
      />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

      {/* Header moved to ListHeaderComponent */}

      <SectionList
        sections={sectionedTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
          </View>
        )}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <QSHeader
              title="History"
              showBack
              onBackPress={() => router.back()}
              rightIcon="cog-outline"
              onRightPress={() => router.push("/settings")}
            />
            {/* Search */}
            <View style={styles.searchContainer}>
              <View style={styles.searchWrapper}>
                <View style={styles.searchIconContainer}>
                  <MaterialCommunityIcons
                    name="magnify"
                    size={24}
                    color={theme.colors.textTertiary}
                  />
                </View>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search transactions..."
                  placeholderTextColor={theme.colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                gap: 8,
                paddingHorizontal: 16,
                marginBottom: 12,
              }}
            >
              {(["today", "month", "all", "custom"] as const).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => {
                    if (p === "custom") {
                      setShowCustomRangePicker(true);
                    } else {
                      setStatsPeriod(p);
                    }
                  }}
                  style={({ pressed }) => [
                    {
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                      backgroundColor:
                        statsPeriod === p
                          ? theme.colors.primary
                          : theme.colors.card,
                      borderWidth: 1,
                      borderColor:
                        statsPeriod === p
                          ? theme.colors.primary
                          : theme.colors.border,
                    },
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color:
                        statsPeriod === p ? "#FFF" : theme.colors.textSecondary,
                      textTransform: "capitalize",
                    }}
                  >
                    {p}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Stats Card */}
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <LinearGradient
                colors={
                  theme.isDark ? ["#1e293b", "#0f172a"] : ["#4F46E5", "#7C3AED"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statsCard}
              >
                <Text style={styles.statsLabel}>{getStatsLabel()}</Text>
                <View style={styles.statsRow}>
                  <Text style={styles.statsAmount}>
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 0,
                    }).format(dynamicStats.currentTotal)}
                  </Text>
                  {dynamicStats.showComparison && (
                    <View
                      style={[
                        styles.statsTrendBadge,
                        {
                          backgroundColor:
                            dynamicStats.trend === "up"
                              ? "rgba(239, 68, 68, 0.2)" // Red background for increase (Bad)
                              : "rgba(34, 197, 94, 0.2)", // Green background for decrease (Good)
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={
                          dynamicStats.trend === "up"
                            ? "trending-up"
                            : "trending-down"
                        }
                        size={16}
                        color={
                          dynamicStats.trend === "up" ? "#EF4444" : "#22C55E"
                        } // Red/Green text
                      />
                      <Text
                        style={[
                          styles.statsTrendText,
                          {
                            color:
                              dynamicStats.trend === "up"
                                ? "#EF4444"
                                : "#22C55E",
                          },
                        ]}
                      >
                        {dynamicStats.percentageChange.toFixed(1)}%
                      </Text>
                    </View>
                  )}
                </View>
                {dynamicStats.showComparison && (
                  <Text style={styles.statsComparison}>
                    vs{" "}
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 0,
                    }).format(dynamicStats.previousTotal)}{" "}
                    {dynamicStats.comparisonLabel}
                  </Text>
                )}
              </LinearGradient>
            </Animated.View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContent}
              style={styles.chipsContainer}
            >
              {/* Date Filter */}
              {renderChip(dateFilter, dateFilter !== "All Time", () =>
                setShowDateSheet(true),
              )}

              {/* Account Filter */}
              {renderChip(getAccountName(accountFilter), !!accountFilter, () =>
                setShowAccountPicker(true),
              )}

              {/* Type Filter */}
              {renderChip(
                typeFilter === "All" ? "Type" : typeFilter,
                typeFilter !== "All",
                () => setShowTypeSheet(true),
              )}
            </ScrollView>
          </View>
        }
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: theme.colors.textSecondary }}>
              No transactions found
            </Text>
          </View>
        }
      />

      {/* Sheets */}
      <QSSelectSheet
        visible={showDateSheet}
        onClose={() => setShowDateSheet(false)}
        title="Select Period"
        selectedValue={dateFilter}
        onSelect={setDateFilter}
        options={[
          { label: "All Time", value: "All Time", icon: "calendar-check" },
          { label: "Today", value: "Today", icon: "calendar-today" },
          { label: "Yesterday", value: "Yesterday", icon: "clock-outline" },
          { label: "Last 7 Days", value: "Last 7 Days", icon: "calendar-week" },
          {
            label: "Last 30 Days",
            value: "Last 30 Days",
            icon: "calendar-month",
          },
        ]}
      />

      <QSAccountPicker
        visible={showAccountPicker}
        onClose={() => setShowAccountPicker(false)}
        accounts={accounts}
        selectedId={accountFilter || undefined}
        onSelect={(acc) =>
          setAccountFilter(
            acc ? (acc.id === accountFilter ? null : acc.id) : null,
          )
        } // Toggle off
      />

      <QSSelectSheet
        visible={showTypeSheet}
        onClose={() => setShowTypeSheet(false)}
        title="Transaction Type"
        selectedValue={typeFilter}
        onSelect={setTypeFilter}
        options={[
          { label: "All Types", value: "All", icon: "format-list-bulleted" },
          { label: "Income", value: "Income", icon: "arrow-down-circle" },
          { label: "Expense", value: "Expense", icon: "arrow-up-circle" },
          { label: "Transfer", value: "Transfer", icon: "swap-horizontal" },
        ]}
      />

      <QSSelectSheet
        visible={showPaymentSheet}
        onClose={() => setShowPaymentSheet(false)}
        title="Payment Method"
        selectedValue={paymentFilter}
        onSelect={setPaymentFilter}
        options={[
          { label: "All Methods", value: "All", icon: "wallet-outline" },
          { label: "Cash", value: "Cash", icon: "cash" },
          { label: "Digital / Bank", value: "Digital", icon: "bank" },
        ]}
      />

      <QSCustomRangePicker
        visible={showCustomRangePicker}
        onClose={() => setShowCustomRangePicker(false)}
        initialStartDate={statsRange.start}
        initialEndDate={statsRange.end}
        onApply={(start, end) => {
          setStatsRange({ start, end });
          setStatsPeriod("custom");
        }}
      />
    </View>
  );
}
