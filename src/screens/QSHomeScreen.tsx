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
import { QSTabbedSection } from "../components/QSTabbedSection";
import { QSTransactionIndicators } from "../components/QSTransactionIndicators";
import { useAuth } from "../context/AuthContext";
import { useAccounts } from "../hooks/useAccounts";
import { useBudgets } from "../hooks/useBudgets";
import { useNotifications } from "../hooks/useNotifications";
import { useTransactions } from "../hooks/useTransactions";
import { Trip, useTrips } from "../hooks/useTrips";
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
  const { getAllTagsWithSpending } = useTags();

  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalanceInfo, setShowBalanceInfo] = useState(false);
  const HOME_TABS = [
    { key: "budgets", label: "Budgets" },
    { key: "trips", label: "Trips" },
    { key: "events", label: "Events" },
  ];

  const [activeTab, setActiveTab] = useState<
    "budgets" | "trips" | "events"
  >("budgets");
  const [unreadCount, setUnreadCount] = useState(0);
  const { getUnreadCount } = useNotifications();
  const [totalBalance, setTotalBalance] = useState(0);
  const [balanceTrend, setBalanceTrend] = useState({
    percentage: 0,
    trend: "up" as "up" | "down",
  });
  const [budgets, setBudgets] = useState<any[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]); // Added accounts state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeEvents, setActiveEvents] = useState<any[]>([]);
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
      ] = await Promise.all([
        getAccountsByUser(user.id),
        getRecentTransactions(user.id, 5),
        getBudgetsWithSpending(user.id),
        getTripsByUser(user.id),
      ]);

      setAccounts(accountsData);

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
    getBalanceTrend,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!user) return;
    getUnreadCount(user.id).then(setUnreadCount);
    const interval = setInterval(async () => {
      const count = await getUnreadCount(user.id);
      setUnreadCount(count);
    }, 10000);
    return () => clearInterval(interval);
  }, [user, getUnreadCount]);

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
        <QSHeader
          rightElement={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                onPress={() => router.push('/monthly-planner')}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <MaterialCommunityIcons name="calendar-month-outline" size={24} color={theme.colors.text} />
              </Pressable>
              <View>
                <Pressable
                  onPress={() => router.push('/notifications')}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.text} />
                </Pressable>
                {unreadCount > 0 && (
                  <View style={{
                    position: 'absolute', top: -2, right: -3,
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: theme.colors.error,
                    borderWidth: 1.5, borderColor: theme.colors.background,
                  }} />
                )}
              </View>
            </View>
          }
        />
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

        <View style={[styles.sectionHeader, { paddingRight: 0 }]}>
          <QSTabbedSection
            tabs={HOME_TABS}
            activeTab={activeTab}
            onTabChange={(key) => setActiveTab(key as typeof activeTab)}
            variant="pill"
          />
          {activeTab === "budgets" && (
            <Pressable
              onPress={() => router.push("/budget-creation")}
              style={({ pressed }) => ({
                backgroundColor: theme.colors.primary,
                padding: 4, borderRadius: 12,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color={theme.colors.onPrimary} />
            </Pressable>
          )}
          {activeTab === "trips" && (
            <Pressable
              onPress={() => router.push("/create-trip")}
              style={({ pressed }) => ({
                backgroundColor: theme.colors.primary,
                padding: 4, borderRadius: 12,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color={theme.colors.onPrimary} />
            </Pressable>
          )}
          {activeTab === "events" && (
            <Pressable
              onPress={() => router.push('/tags-management')}
              style={({ pressed }) => ({
                backgroundColor: theme.colors.primary,
                padding: 4, borderRadius: 12,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <MaterialCommunityIcons name="tag-plus-outline" size={20} color={theme.colors.onPrimary} />
            </Pressable>
          )}
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
        ) : activeTab === "events" ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventsScroll}
            snapToInterval={200}
            decelerationRate="fast"
          >
            {activeEvents.length > 0 ? (
              activeEvents
                .filter((e: any) => new Date(e.event_date).getTime() > Date.now() - 86400000)
                .map((event: any, index: number) => {
                  const progressPercent = event.budget > 0 ? Math.min((event.spent / event.budget) * 100, 100) : 0;
                  const daysLeft = Math.ceil((new Date(event.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const eventIcon = (() => {
                    switch (event.event_type) {
                      case 'birthday': return 'cake-variant';
                      case 'marriage': return 'ring';
                      case 'anniversary': return 'heart-circle';
                      case 'festival': return 'party-popper';
                      case 'travel': return 'airplane';
                      default: return 'calendar-star';
                    }
                  })();
                  const eventAccent = (() => {
                    switch (event.event_type) {
                      case 'birthday': return '#FF6B6B';
                      case 'marriage': return '#A29BFE';
                      case 'anniversary': return '#F59E0B';
                      case 'festival': return '#10B981';
                      case 'travel': return '#3B82F6';
                      default: return theme.colors.primary;
                    }
                  })();

                  return (
                    <Animated.View key={event.id} entering={FadeInRight.delay(200 + index * 50).springify()}>
                      <Pressable
                        style={({ pressed }) => [styles.eventCard, { opacity: pressed ? 0.85 : 1 }]}
                        // @ts-ignore
                        onPress={() => router.push({ pathname: `/tag-details/[id]`, params: { id: event.id } })}
                      >
                        <View style={styles.eventCardTop}>
                          <View style={[styles.eventIconBox, { backgroundColor: `${eventAccent}18` }]}>
                            <MaterialCommunityIcons name={eventIcon as any} size={22} color={eventAccent} />
                          </View>
                          <View style={[styles.eventTypeBadge, { backgroundColor: `${eventAccent}15` }]}>
                            <Text style={[styles.eventTypeBadgeText, { color: eventAccent }]}>
                              {event.event_type || 'event'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.eventCardName} numberOfLines={1}>{event.name}</Text>
                        <View style={styles.eventCardDateRow}>
                          <MaterialCommunityIcons name="calendar-outline" size={12} color={theme.colors.textSecondary} />
                          <Text style={styles.eventCardDate}>
                            {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Text>
                        </View>
                        {event.budget > 0 && (
                          <View style={styles.eventBudgetSection}>
                            <View style={styles.eventBudgetBar}>
                              <View style={[styles.eventBudgetBarFill, { width: `${Math.min(progressPercent, 100)}%`, backgroundColor: eventAccent }]} />
                            </View>
                            <View style={styles.eventBudgetRow}>
                              <Text style={styles.eventBudgetSpent}>₹{event.spent.toLocaleString('en-IN')}</Text>
                              <Text style={styles.eventBudgetTotal}>/ ₹{event.budget.toLocaleString('en-IN')}</Text>
                            </View>
                          </View>
                        )}
                        <View style={[styles.eventDaysBadge, { backgroundColor: daysLeft <= 0 ? `${theme.colors.error}15` : `${theme.colors.primary}10` }]}>
                          <MaterialCommunityIcons
                            name={daysLeft > 0 ? 'clock-outline' : daysLeft === 0 ? 'bell-ring' : 'check-circle-outline'}
                            size={12}
                            color={daysLeft <= 0 ? theme.colors.error : theme.colors.primary}
                          />
                          <Text style={[styles.eventDaysText, { color: daysLeft <= 0 ? theme.colors.error : theme.colors.primary }]}>
                            {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Today!' : 'Past'}
                          </Text>
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                })
            ) : (
              <View style={[styles.budgetCard, { width: 220, justifyContent: 'center', alignItems: 'center' }]}>
                <MaterialCommunityIcons name="calendar-star" size={32} color={theme.colors.textTertiary} />
                <Text style={[styles.budgetName, { textAlign: 'center', marginTop: 12 }]}>No active events</Text>
                <Text style={[styles.budgetRemaining, { textAlign: 'center', marginTop: 4 }]}>Tap + to create one</Text>
              </View>
            )}
          </ScrollView>
        ) : null}

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
