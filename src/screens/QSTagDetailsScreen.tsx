import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { QSHeader } from "../components/QSHeader";
import { TagWithSpending, useTags } from "../hooks/useTags";
import { useTheme } from "../theme/ThemeContext";

function getEventImage(eventType?: string | null): string {
  switch (eventType) {
    case "birthday": return "🎂";
    case "marriage": return "💒";
    case "anniversary": return "💍";
    case "festival": return "🎉";
    case "travel": return "✈️";
    default: return "📌";
  }
}

const EVENT_BG_COLORS: Record<string, [string, string]> = {
  birthday: ["#FF6B6B", "#EE5A24"],
  marriage: ["#A29BFE", "#6C5CE7"],
  anniversary: ["#FDCB6E", "#E17055"],
  festival: ["#55EFC4", "#00B894"],
  travel: ["#74B9FF", "#0984E3"],
  other: ["#6366F1", "#4F46E5"],
};

export default function QSTagDetailsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTagWithSpending, loading } = useTags();

  const [tagData, setTagData] = useState<TagWithSpending | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!id) return;
    const data = await getTagWithSpending(id);
    setTagData(data);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const getCountdown = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff < 0) return "Event passed";
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today!";
    if (days === 1) return "Tomorrow!";
    return `${days} days away`;
  };

  const getEventGradient = (): [string, string] => {
    if (!tagData?.is_event) return ["#6366F1", "#4F46E5"];
    return EVENT_BG_COLORS[tagData.event_type || "other"] || EVENT_BG_COLORS.other;
  };

  if (loading && !tagData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!tagData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: theme.colors.textSecondary }}>Tag not found</Text>
      </View>
    );
  }

  const [gradientStart, gradientEnd] = getEventGradient();
  const spent = tagData.spent;
  const budget = tagData.budget || 0;
  const progressPercent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const countdown = getCountdown(tagData.event_date);
  const daysUntilEvent = tagData.event_date ? Math.ceil((new Date(tagData.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  // Group transactions by date
  const groupedTransactions: Record<string, any[]> = {};
  tagData.transactions.forEach((tx: any) => {
    const dateKey = formatDate(tx.date);
    if (!groupedTransactions[dateKey]) groupedTransactions[dateKey] = [];
    groupedTransactions[dateKey].push(tx);
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      <QSHeader
        title={tagData.is_event ? "Event Details" : "Tag Details"}
        showBack
        onBackPress={() => router.back()}
        style={{ marginHorizontal: -16 }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Hero Header Card */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={[styles.heroCard, { backgroundColor: gradientStart }]}>
            <View style={styles.heroEmoji}>
              <Text style={{ fontSize: 48 }}>{getEventImage(tagData.event_type)}</Text>
            </View>
            <Text style={styles.heroName}>{tagData.name}</Text>
            {tagData.is_event && tagData.event_type && (
              <Text style={styles.heroType}>{tagData.event_type.charAt(0).toUpperCase() + tagData.event_type.slice(1)}</Text>
            )}
            {tagData.description && (
              <Text style={styles.heroDesc}>{tagData.description}</Text>
            )}
            {tagData.is_event && tagData.event_date && (
              <View style={styles.heroDateRow}>
                <MaterialCommunityIcons name="calendar" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroDate}>{formatDate(tagData.event_date)}</Text>
              </View>
            )}
            {countdown && (
              <View style={styles.countdownBadge}>
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Spending Stats Row */}
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Spent</Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{formatCurrency(spent)}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Transactions</Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{tagData.transactions.length}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Budget Progress (Event only) */}
        {tagData.is_event && budget > 0 && (
          <Animated.View entering={FadeInUp.delay(300).springify()}>
            <View style={[styles.budgetCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.budgetHeader}>
                <Text style={[styles.budgetTitle, { color: theme.colors.text }]}>Budget Progress</Text>
                <Text style={[styles.budgetPercent, { color: theme.colors.primary }]}>
                  {progressPercent.toFixed(0)}%
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(progressPercent, 100)}%`,
                      backgroundColor: progressPercent > 80 ? theme.colors.error : progressPercent > 50 ? theme.colors.warning : theme.colors.success,
                    },
                  ]}
                />
              </View>
              <View style={styles.budgetMeta}>
                <Text style={[styles.budgetMetaText, { color: theme.colors.textSecondary }]}>
                  Spent: {formatCurrency(spent)}
                </Text>
                <Text style={[styles.budgetMetaText, { color: theme.colors.textSecondary }]}>
                  Budget: {formatCurrency(budget)}
                </Text>
              </View>
              {spent > budget && (
                <View style={[styles.overBudgetBadge, { backgroundColor: theme.colors.error + "20" }]}>
                  <MaterialCommunityIcons name="alert" size={16} color={theme.colors.error} />
                  <Text style={[styles.overBudgetText, { color: theme.colors.error }]}>
                    Over budget by {formatCurrency(spent - budget)}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Daily Spend Rate (Event only, future event) */}
        {tagData.is_event && daysUntilEvent && daysUntilEvent > 0 && budget > 0 && (
          <Animated.View entering={FadeInUp.delay(350).springify()}>
            <View style={[styles.insightCard, { backgroundColor: theme.colors.card }]}>
              <MaterialCommunityIcons name="lightbulb-outline" size={18} color={theme.colors.warning} />
              <Text style={[styles.insightText, { color: theme.colors.textSecondary }]}>
                {daysUntilEvent} days until event — you can spend ₹{Math.max(0, Math.round((budget - spent) / daysUntilEvent))}/day to stay on budget.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Transactions List */}
        <Animated.View entering={FadeInUp.delay(400).springify()} style={[styles.txCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Transactions</Text>
          {tagData.transactions.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No transactions linked to this {tagData.is_event ? "event" : "tag"}.
            </Text>
          ) : (
            Object.entries(groupedTransactions).map(([dateKey, txs]) => (
              <View key={dateKey}>
                <Text style={[styles.dateHeader, { color: theme.colors.textTertiary }]}>{dateKey}</Text>
                {txs.map((tx: any) => (
                  <TouchableOpacity
                    key={tx.id}
                    style={[styles.txItem, { borderBottomColor: theme.colors.border }]}
                    onPress={() => router.push({ pathname: "/transaction-details", params: { transaction: JSON.stringify(tx) } })}
                  >
                    <View style={[styles.txIcon, { backgroundColor: (tx.category_color || theme.colors.primary) + "20" }]}>
                      <MaterialCommunityIcons
                        name={(tx.category_icon as any) || "cart"}
                        size={18}
                        color={tx.category_color || theme.colors.primary}
                      />
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={[styles.txName, { color: theme.colors.text }]} numberOfLines={1}>
                        {tx.name}
                      </Text>
                      <Text style={[styles.txCategory, { color: theme.colors.textTertiary }]} numberOfLines={1}>
                        {tx.category_name || tx.account_name || ""}
                      </Text>
                    </View>
                    <Text style={[styles.txAmount, { color: tx.type === "income" ? theme.colors.success : theme.colors.text }]}>
                      {tx.type === "expense" ? "-" : "+"}{formatCurrency(tx.amount)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  heroCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  heroEmoji: { marginBottom: 12 },
  heroName: { fontSize: 24, fontWeight: "800", color: "#FFF", textAlign: "center" },
  heroType: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.7)", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 },
  heroDesc: { fontSize: 14, color: "rgba(255,255,255,0.8)", textAlign: "center", marginTop: 8, lineHeight: 20 },
  heroDateRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  heroDate: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: "500" },
  countdownBadge: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  countdownText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statLabel: { fontSize: 12, fontWeight: "500", marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: "800" },
  budgetCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  budgetTitle: { fontSize: 14, fontWeight: "600" },
  budgetPercent: { fontSize: 18, fontWeight: "800" },
  progressBar: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
  },
  budgetMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  budgetMetaText: { fontSize: 12 },
  overBudgetBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  overBudgetText: { fontSize: 12, fontWeight: "600" },
  insightCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  insightText: { fontSize: 13, flex: 1, lineHeight: 18 },
  txCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: "center", marginVertical: 20 },
  dateHeader: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginTop: 8, marginBottom: 4 },
  txItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  txInfo: { flex: 1 },
  txName: { fontSize: 14, fontWeight: "600" },
  txCategory: { fontSize: 12, marginTop: 1 },
  txAmount: { fontSize: 14, fontWeight: "700" },
});
