import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View
} from "react-native";
import Animated, {
  Extrapolate,
  FadeInDown,
  FadeInRight,
  FadeInUp,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { AlertButton, QSAlertModal } from "../components/QSAlertModal";
import { QSHeader } from "../components/QSHeader";
import { QSTransactionIndicators } from "../components/QSTransactionIndicators";
import { useAuth } from "../context/AuthContext";
import { useGroups } from "../hooks/useGroups";
import { Transaction, useTransactions } from "../hooks/useTransactions";
import { Trip, useTrips } from "../hooks/useTrips";
import { createStyles } from "../styles/QSTripDetails.styles";
import { useTheme } from "../theme/ThemeContext";
import { getSafeIconName } from "../utils/iconMapping";

interface QSTripDetailsScreenProps {
  id: string;
}

export default function QSTripDetailsScreen({ id }: QSTripDetailsScreenProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = createStyles(theme);
  const { getTripById, deleteTrip, loading: tripLoading } = useTrips();
  const {
    getTransactionsByTrip,
    getSpendingByCategoryByTrip,
    loading: transLoading,
  } = useTransactions();
  const { getGroupDetails } = useGroups();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categorySpending, setCategorySpending] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Filter State
  const [filterUserId, setFilterUserId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<
    "date_desc" | "date_asc" | "amount_desc" | "amount_asc"
  >("date_desc");
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "expense" | "income" | "transfer">("all");
  const [groupMembers, setGroupMembers] = useState<any[]>([]);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    buttons?: AlertButton[];
  }>({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  // Memoized Filter Logic
  const filteredTransactions = React.useMemo(() => {
    if (!transactions) return [];
    let result = [...transactions];

    // Filter by User
    if (filterUserId) {
      result = result.filter((t) => t.user_id === filterUserId);
    }

    // Filter by Type
    if (filterType !== "all") {
      result = result.filter((t) => t.type === filterType);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case "date_asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "date_desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "amount_asc":
          return a.amount - b.amount;
        case "amount_desc":
          return b.amount - a.amount;
        default:
          return 0;
      }
    });

    return result;
  }, [transactions, filterUserId, filterType, sortOption]);

  const filteredTotal = React.useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (filterType === 'income' && t.type === 'income') return acc + t.amount;
      if (filterType === 'transfer' && t.type === 'transfer') return acc + t.amount;
      // For "All" or "Expense", count only expenses for the "Total Spent" view
      if (t.type === 'expense') return acc + t.amount;
      return acc;
    }, 0);
  }, [filteredTransactions, filterType]);


  // ... (rest of logic)
  const displayedTransactions = expanded
    ? filteredTransactions
    : filteredTransactions.slice(0, 5);


  const scrollY = useSharedValue(0);

  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      const [tripData, transData, catData] = await Promise.all([
        getTripById(id),
        getTransactionsByTrip(id),
        getSpendingByCategoryByTrip(id),
      ]);

      if (tripData) {
        setTrip(tripData);
        // If it's a group trip, fetch members
        if (tripData.type === 'group' && tripData.groupId && user) {
          const groupDetails = await getGroupDetails(tripData.groupId, user.id);
          if (groupDetails) {
            setGroupMembers(groupDetails.members || []);
          }
        }
      }
      setTransactions(transData);
      setCategorySpending(catData);
    } catch (error) {
      console.error("Error fetching trip details:", error);
    }
  }, [id, getTripById, getTransactionsByTrip, getSpendingByCategoryByTrip]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [-300, 0, 300],
      [150, 0, -100],
      Extrapolate.CLAMP,
    );
    const scale = interpolate(
      scrollY.value,
      [-300, 0],
      [2, 1],
      Extrapolate.CLAMP,
    );
    return {
      transform: [{ translateY }, { scale }] as any,
    };
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (tripLoading && !trip) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!trip) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: theme.colors.textSecondary }}>
          Trip not found
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [{ marginTop: 20 }, pressed && { opacity: 0.7 }]}
        >
          <Text style={{ color: theme.colors.primary, fontWeight: "bold" }}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  const budgetPercentage = Math.min(
    Math.round((trip.totalSpent / trip.budget) * 100),
    100,
  );
  const remainingBudget = Math.max(0, trip.budget - trip.totalSpent);
  const dailyAvg =
    transactions.length > 0
      ? trip.totalSpent /
      Math.max(
        1,
        Math.ceil(
          (new Date(trip.endDate).getTime() -
            new Date(trip.startDate).getTime()) /
          (1000 * 60 * 60 * 24),
        ),
      )
      : 0;

  const showAlert = (title: string, message?: string, buttons?: AlertButton[]) => {
    setAlertConfig({ visible: true, title, message, buttons });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* QS Alert Modal */}
      <QSAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
          />
        }
      >
        <QSHeader
          showBack={true}
          onBackPress={() => router.back()}
          rightIcon="dots-vertical"
          onRightPress={() => {
            showAlert("Trip Options", "Choose an action", [
              {
                text: "Edit Trip",
                onPress: () => {
                  router.push({
                    pathname: "/create-trip",
                    params: { tripId: trip.id },
                  });
                },
              },
              {
                text: "Delete Trip",
                onPress: () => {
                  // Close first alert, open second one
                  // Need slight timeout for modal transition or just replace state
                  setTimeout(() => {
                    showAlert(
                      "Delete Trip",
                      "Are you sure you want to delete this trip? This cannot be undone.",
                      [
                        { text: "Cancel", style: "cancel", onPress: hideAlert },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: async () => {
                            const result = await deleteTrip(trip.id);
                            if (result.success) {
                              hideAlert();
                              router.back();
                            } else {
                              // Show error alert
                              setTimeout(() => {
                                showAlert(
                                  "Error",
                                  result.error || "Failed to delete trip",
                                );
                              }, 300);
                            }
                          },
                        },
                      ],
                    );
                  }, 300);
                },
                style: "destructive",
              },
              {
                text: "Cancel",
                style: "cancel",
                onPress: hideAlert,
              },
            ]);
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: "transparent",
          }}
        />

        {/* Parallax Header */}
        <Animated.View style={[styles.header as any, headerAnimatedStyle]}>
          <Image
            source={trip.image}
            style={styles.headerImage}
            contentFit="cover"
          />
          <View style={styles.headerOverlay} />
          <View style={styles.headerContent}>
            <View style={styles.tripTypeBadge}>
              <MaterialCommunityIcons
                name={trip.type === "group" ? "account-group" : "account"}
                size={12}
                color="#FFFFFF"
              />
              <Text style={styles.tripTypeText}>{trip.type} Trip</Text>
            </View>
            <Text style={styles.tripTitle}>{trip.name}</Text>
            <Text style={styles.tripSubtitle}>
              {new Date(trip.startDate).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              • {trip.status}
            </Text>
          </View>
        </Animated.View>

        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Budget Section */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={styles.section}>
              <View style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <View style={styles.budgetAmountBox}>
                    <Text style={styles.budgetLabel}>Total Spent</Text>
                    <Text style={styles.budgetTotal}>
                      {formatCurrency(trip.totalSpent)}
                    </Text>
                    <Text style={styles.budgetLimit}>
                      of {formatCurrency(trip.budget)} limit
                    </Text>
                  </View>
                  <View style={styles.percentageBox}>
                    <Text style={styles.percentageText}>
                      {budgetPercentage}%
                    </Text>
                    <Text style={styles.budgetLabel}>Used</Text>
                  </View>
                </View>

                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${budgetPercentage}%`,
                        backgroundColor:
                          budgetPercentage > 90
                            ? theme.colors.error
                            : theme.colors.primary,
                      },
                    ]}
                  />
                </View>

                <View style={styles.budgetFooter}>
                  <View style={styles.budgetInfoItem}>
                    <View
                      style={[
                        styles.budgetInfoIcon,
                        { backgroundColor: theme.colors.success + "20" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="wallet-outline"
                        size={16}
                        color={theme.colors.success}
                      />
                    </View>
                    <View>
                      <Text style={styles.budgetInfoLabel}>Remaining</Text>
                      <Text style={styles.budgetInfoValue}>
                        {formatCurrency(remainingBudget)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.budgetInfoItem}>
                    <View
                      style={[
                        styles.budgetInfoIcon,
                        { backgroundColor: theme.colors.info + "20" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="trending-up"
                        size={16}
                        color={theme.colors.info}
                      />
                    </View>
                    <View>
                      <Text style={styles.budgetInfoLabel}>Daily Avg</Text>
                      <Text style={styles.budgetInfoValue}>
                        {formatCurrency(dailyAvg)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Category Breakdown */}
          {categorySpending.length > 0 && (
            <View style={{ marginBottom: theme.spacing.xl }}>
              <Text
                style={[styles.sectionTitle, { marginLeft: theme.spacing.l }]}
              >
                Spending Categories
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {categorySpending.map((item, index) => (
                  <Animated.View
                    key={item.category_name}
                    entering={FadeInRight.delay(200 + index * 50).springify()}
                  >
                    <Pressable
                      style={({ pressed }) => [
                        styles.categoryItem,
                        pressed && { opacity: 0.7 }
                      ]}
                    >
                      <View
                        style={[
                          styles.categoryIconBox,
                          { backgroundColor: item.category_color + "20" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={getSafeIconName(item.category_icon || "")}
                          size={24}
                          color={item.category_color}
                        />
                      </View>
                      <View>
                        <Text style={styles.categoryName} numberOfLines={1}>
                          {item.category_name}
                        </Text>
                        <Text style={styles.categoryAmount}>
                          {formatCurrency(item.total)}
                        </Text>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Recent Transactions */}
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.sectionTitle}>Expense History</Text>
              <Pressable
                onPress={() => setShowFilters(!showFilters)}
                style={({ pressed }) => [
                  { flexDirection: "row", alignItems: "center", gap: 4 },
                  pressed && { opacity: 0.7 }
                ]}
              >
                <Text
                  style={{
                    color: theme.colors.primary,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  {showFilters ? "Hide Filters" : "Filter & Sort"}
                </Text>
                <MaterialCommunityIcons
                  name={showFilters ? "chevron-up" : "tune"}
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>

            {/* Filter Total Info bar */}
            {(filterUserId !== null || filterType !== "all" || sortOption !== "date_desc") && (
              <Animated.View
                entering={FadeInDown.duration(400)}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: theme.spacing.m,
                  marginBottom: 12,
                  backgroundColor: theme.colors.primary + "10",
                  paddingVertical: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.primary + "20",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <MaterialCommunityIcons
                    name="filter-variant"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: theme.colors.textSecondary,
                    }}
                  >
                    {filterUserId
                      ? (groupMembers.find((m) => m.id === filterUserId)?.username || "User") +
                      "'s activity"
                      : "Filtered results"}
                    {filterType !== "all" && ` • ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}s`}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: theme.colors.primary,
                  }}
                >
                  Total: {formatCurrency(filteredTotal)}
                </Text>
              </Animated.View>
            )}

            {/* Expandable Filter Panel */}
            {showFilters && (
              <View style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.card,
                padding: 16,
                marginBottom: 16,
              }}>
                {/* Sort Section */}
                <Text style={{
                  fontSize: 12,
                  fontWeight: "600",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  color: theme.colors.textSecondary,
                }}>Sort By</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  <Pressable
                    style={({ pressed }) => [
                      {
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      },
                      sortOption === "date_desc" && {
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.primary,
                      },
                      pressed && { opacity: 0.8 }
                    ]}
                    onPress={() => setSortOption("date_desc")}
                  >
                    <Text
                      style={[
                        { fontSize: 12, fontWeight: "600", color: theme.colors.text },
                        sortOption === "date_desc" && { color: "#FFF" }
                      ]}
                    >
                      Newest First
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      {
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      },
                      sortOption === "date_asc" && {
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.primary,
                      },
                      pressed && { opacity: 0.8 }
                    ]}
                    onPress={() => setSortOption("date_asc")}
                  >
                    <Text
                      style={[
                        { fontSize: 12, fontWeight: "600", color: theme.colors.text },
                        sortOption === "date_asc" && { color: "#FFF" }
                      ]}
                    >
                      Oldest First
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      {
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      },
                      sortOption === "amount_desc" && {
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.primary,
                      },
                      pressed && { opacity: 0.8 }
                    ]}
                    onPress={() => setSortOption("amount_desc")}
                  >
                    <Text
                      style={[
                        { fontSize: 12, fontWeight: "600", color: theme.colors.text },
                        sortOption === "amount_desc" && { color: "#FFF" }
                      ]}
                    >
                      Highest Amount
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      {
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      },
                      sortOption === "amount_asc" && {
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.primary,
                      },
                      pressed && { opacity: 0.8 }
                    ]}
                    onPress={() => setSortOption("amount_asc")}
                  >
                    <Text
                      style={[
                        { fontSize: 12, fontWeight: "600", color: theme.colors.text },
                        sortOption === "amount_asc" && { color: "#FFF" }
                      ]}
                    >
                      Lowest Amount
                    </Text>
                  </Pressable>
                </View>

                <View
                  style={{
                    height: 1,
                    backgroundColor: theme.colors.border,
                    marginVertical: 12,
                  }}
                />

                {/* Type Section */}
                <Text style={{
                  fontSize: 12,
                  fontWeight: "600",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  color: theme.colors.textSecondary,
                }}>Transaction Type</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {(["all", "expense", "income", "transfer"] as const).map((type) => (
                    <Pressable
                      key={type}
                      style={({ pressed }) => [
                        {
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                        },
                        filterType === type && {
                          backgroundColor: theme.colors.primary,
                          borderColor: theme.colors.primary,
                        },
                        pressed && { opacity: 0.8 }
                      ]}
                      onPress={() => setFilterType(type)}
                    >
                      <Text
                        style={[
                          { fontSize: 12, fontWeight: "600", color: theme.colors.text },
                          filterType === type && { color: "#FFF" }
                        ]}
                      >
                        {type === "all" ? "All" : type === "expense" ? "Spends" : type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* User Section (Only if group members exist) */}
                {groupMembers.length > 0 && (
                  <>
                    <View
                      style={{
                        height: 1,
                        backgroundColor: theme.colors.border,
                        marginVertical: 12,
                      }}
                    />
                    <Text style={{
                      fontSize: 12,
                      fontWeight: "600",
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      color: theme.colors.textSecondary,
                    }}>Filter By User</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      <Pressable
                        style={({ pressed }) => [
                          {
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                          },
                          filterUserId === null && {
                            backgroundColor: theme.colors.primary,
                            borderColor: theme.colors.primary,
                          },
                          pressed && { opacity: 0.8 }
                        ]}
                        onPress={() => setFilterUserId(null)}
                      >
                        <Text
                          style={[
                            { fontSize: 12, fontWeight: "600", color: theme.colors.text },
                            filterUserId === null && { color: "#FFF" }
                          ]}
                        >
                          All Members
                        </Text>
                      </Pressable>
                      {groupMembers.map((m) => (
                        <Pressable
                          key={m.id}
                          style={({ pressed }) => [
                            {
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 20,
                              borderWidth: 1,
                              borderColor: theme.colors.border,
                            },
                            filterUserId === m.id && {
                              backgroundColor: theme.colors.primary,
                              borderColor: theme.colors.primary,
                            },
                          ]}
                          onPress={() =>
                            setFilterUserId(filterUserId === m.id ? null : m.id)
                          }
                        >
                          <Text
                            style={[
                              { fontSize: 12, fontWeight: "600", color: theme.colors.text },
                              filterUserId === m.id && { color: "#FFF" }
                            ]}
                          >
                            {m.id === user?.id ? "You" : m.username.split(" ")[0]}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}

            <View style={styles.transactionList}>
              {displayedTransactions.length > 0 ? (
                <>
                  {displayedTransactions.map((item, index) => (
                    <Animated.View
                      key={item.id}
                      entering={FadeInUp.delay(300 + index * 50).springify()}
                    >
                      <Pressable
                        style={({ pressed }) => [
                          styles.transactionItem,
                          index === displayedTransactions.length - 1 &&
                          transactions.length <= 5 && { borderBottomWidth: 0 },
                          pressed && { opacity: 0.7 }
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
                              styles.transactionIconBox,
                              {
                                backgroundColor:
                                  (item.category_color ||
                                    theme.colors.primary) + "15",
                              },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={getSafeIconName(
                                item.category_icon || "receipt",
                              )}
                              size={22}
                              color={
                                item.category_color || theme.colors.primary
                              }
                            />
                          </View>
                          <View style={styles.transactionInfo}>
                            <Text
                              style={[
                                styles.transactionName,
                                { flex: 1, marginRight: 8 },
                              ]}
                              numberOfLines={1}
                            >
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
                              <Text style={styles.transactionDate}>
                                {new Date(item.date).toLocaleDateString(
                                  undefined,
                                  { month: "short", day: "numeric" },
                                )}
                              </Text>
                              <QSTransactionIndicators
                                isSplit={item.is_split}
                                tripId={item.trip_id}
                                groupId={item.group_id}
                                savingsId={item.savings_id}
                                loanId={item.loan_id}
                                hideTrip
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
                                  ? theme.colors.success
                                  : theme.colors.text,
                            },
                          ]}
                        >
                          {item.type === "income" ? "+" : "-"}
                          {formatCurrency(item.amount)}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  ))}
                  {transactions.length > 5 && (
                    <Pressable
                      onPress={() => setExpanded(!expanded)}
                      style={({ pressed }) => [{
                        paddingVertical: 12,
                        alignItems: "center",
                        backgroundColor: theme.colors.card, // Match list bg
                      }, pressed && { opacity: 0.7 }]}
                    >
                      <Text
                        style={{
                          color: theme.colors.primary,
                          fontWeight: "600",
                        }}
                      >
                        {expanded ? "Show Less" : "View More"}
                      </Text>
                    </Pressable>
                  )}
                </>
              ) : (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="receipt"
                    size={48}
                    color={theme.colors.textTertiary}
                  />
                  <Text style={styles.emptyText}>
                    No expenses recorded for this trip
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Bottom Padding for FAB */}
          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.7 }]}
        onPress={() =>
          router.push({
            pathname: "/add-transaction",
            params: { initialType: "expense", tripId: trip.id },
          })
        }
      >
        <MaterialCommunityIcons
          name="plus"
          size={32}
          color={theme.colors.onPrimary}
        />
      </Pressable>
    </View>
  );
}
