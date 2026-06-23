import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PieChart } from "react-native-gifted-charts";
import Animated, { FadeInUp } from "react-native-reanimated";
import { NeedsWantsSavingsData } from "../../hooks/useAnalytics";
import { Theme } from "../../theme/theme";
import { formatCurrencyCompact } from "../../utils/format";
import { QSInfoSheet } from "../QSInfoSheet";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const NWS_COLORS = {
  needs: { main: "#4F46E5", light: "#4F46E518", gradient: ["#6366F1", "#4F46E5"] as [string, string] },
  wants: { main: "#EC4899", light: "#EC489918", gradient: ["#F472B6", "#EC4899"] as [string, string] },
  savings: { main: "#10B981", light: "#10B98118", gradient: ["#34D399", "#10B981"] as [string, string] },
};

interface NeedsWantsSavingsChartProps {
  data: NeedsWantsSavingsData | null;
  theme: Theme;
  onSegmentPress?: (type: "needs" | "wants" | "savings", title: string) => void;
}

export const NeedsWantsSavingsChart = ({
  data,
  theme,
  onSegmentPress,
}: NeedsWantsSavingsChartProps) => {
  const [showInfo, setShowInfo] = useState(false);

  if (!data || data.total === 0) {
    return (
      <LinearGradient
        colors={theme.isDark ? [theme.colors.card, theme.colors.backgroundSecondary] : ["#ffffff", "#f0fdf4"]}
        style={[styles.emptyCard, { borderColor: theme.colors.border }]}
      >
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No data for Needs vs Wants
        </Text>
      </LinearGradient>
    );
  }

  const { needs, wants, savings, total } = data;

  const needsPct = total > 0 ? (needs / total) * 100 : 0;
  const wantsPct = total > 0 ? (wants / total) * 100 : 0;
  const savingsPct = total > 0 ? (savings / total) * 100 : 0;

  const pieData = [
    {
      value: needs,
      color: NWS_COLORS.needs.main,
      text: "Needs",
      name: "Needs",
      type: "needs" as const,
      percentage: needsPct.toFixed(0),
      onPress: () => onSegmentPress?.("needs", "Needs Transactions"),
    },
    {
      value: wants,
      color: NWS_COLORS.wants.main,
      text: "Wants",
      name: "Wants",
      type: "wants" as const,
      percentage: wantsPct.toFixed(0),
      onPress: () => onSegmentPress?.("wants", "Wants Transactions"),
    },
    {
      value: savings,
      color: NWS_COLORS.savings.main,
      text: "Savings",
      name: "Savings",
      type: "savings" as const,
      percentage: savingsPct.toFixed(0),
      onPress: () => onSegmentPress?.("savings", "Savings Transactions"),
    },
  ].filter((item) => item.value > 0);

  const formatCurrency = (amount: number) => formatCurrencyCompact(amount);

  const idealSegments = [
    { label: "Needs", pct: 50, color: NWS_COLORS.needs.main },
    { label: "Wants", pct: 30, color: NWS_COLORS.wants.main },
    { label: "Savings", pct: 20, color: NWS_COLORS.savings.main },
  ];

  const actualSegments = [
    { label: "Needs", pct: needsPct, color: NWS_COLORS.needs.main },
    { label: "Wants", pct: wantsPct, color: NWS_COLORS.wants.main },
    { label: "Savings", pct: savingsPct, color: NWS_COLORS.savings.main },
  ];

  const getDeviation = (actual: number, ideal: number) => {
    const diff = actual - ideal;
    if (Math.abs(diff) < 1) return null;
    return diff > 0 ? `+${diff.toFixed(0)}%` : `${diff.toFixed(0)}%`;
  };

  return (
    <LinearGradient
      colors={
        theme.isDark
          ? [theme.colors.card, theme.colors.backgroundSecondary]
          : ["#ffffff", "#f5f3ff"]
      }
      style={[styles.card, { borderColor: theme.colors.border }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Needs vs Wants
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            50/30/20 Rule
          </Text>
        </View>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => setShowInfo(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.infoText, { color: theme.colors.primary }]}>
            How?
          </Text>
        </TouchableOpacity>
      </View>

      <QSInfoSheet
        visible={showInfo}
        onClose={() => setShowInfo(false)}
        title="Needs vs Wants Logic"
      >
        <View style={styles.sheetContent}>
          <View style={styles.sheetItem}>
            <Text style={[styles.sheetLabel, { color: NWS_COLORS.needs.main }]}>Needs (50%)</Text>
            <Text style={[styles.sheetDesc, { color: theme.colors.textSecondary }]}>
              Essentials: Housing, Utilities, Groceries, Transport, Health, Education, Bills, Insurance, Taxes.
            </Text>
          </View>
          <View style={styles.sheetItem}>
            <Text style={[styles.sheetLabel, { color: NWS_COLORS.wants.main }]}>Wants (30%)</Text>
            <Text style={[styles.sheetDesc, { color: theme.colors.textSecondary }]}>
              Discretionary: Dining out, Entertainment, Shopping, Travel, Hobbies, Gifts, Luxury.
            </Text>
          </View>
          <View style={styles.sheetItem}>
            <Text style={[styles.sheetLabel, { color: NWS_COLORS.savings.main }]}>Savings (20%)</Text>
            <Text style={[styles.sheetDesc, { color: theme.colors.textSecondary }]}>
              Investments, Debt repayment above minimum, Transfers to savings goals.
            </Text>
          </View>
          <Text style={[styles.sheetNote, { color: theme.colors.textTertiary }]}>
            Transactions are auto-classified by category. You can override the classification when adding a transaction.
          </Text>
        </View>
      </QSInfoSheet>

      {/* Pie + Legend */}
      <View style={styles.chartRow}>
        <View style={styles.chartWrapper}>
          <Animated.View entering={FadeInUp.duration(500)}>
            <PieChart
              donut
              radius={72}
              innerRadius={50}
              innerCircleColor={theme.colors.card}
              toggleFocusOnPress
              isAnimated
              animationDuration={900}
              data={pieData}
              centerLabelComponent={() => (
                <View style={styles.centerLabel}>
                  <Text style={[styles.centerValue, { color: theme.colors.text }]}>
                    {formatCurrency(total)}
                  </Text>
                  <Text style={[styles.centerLabelText, { color: theme.colors.textSecondary }]}>
                    Total
                  </Text>
                </View>
              )}
            />
          </Animated.View>
        </View>

        <View style={styles.legendContainer}>
          {pieData.map((item, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [styles.legendItem, { opacity: pressed ? 0.6 : 1 }]}
              onPress={item.onPress}
            >
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[styles.legendLabel, { color: theme.colors.text }]}>
                  {item.name}
                </Text>
                <Text style={[styles.legendValue, { color: theme.colors.textSecondary }]}>
                  {formatCurrency(item.value)} • {item.percentage}%
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 50/30/20 Goal Comparison */}
      <View style={[styles.goalSection, { borderTopColor: theme.colors.border }]}>
        <View style={styles.goalRow}>
          {idealSegments.map((seg, i) => {
            const actual = actualSegments[i];
            const dev = getDeviation(actual.pct, seg.pct);
            return (
              <View key={seg.label} style={styles.goalColumn}>
                <Text style={[styles.goalLabel, { color: theme.colors.textSecondary }]}>
                  {seg.label}
                </Text>
                <View style={styles.goalBarOuter}>
                  <View
                    style={[
                      styles.goalBarIdeal,
                      {
                        backgroundColor: seg.color + "25",
                        height: 8,
                        width: "100%",
                        borderRadius: 4,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.goalBarActual,
                        {
                          backgroundColor: seg.color,
                          width: `${Math.min(actual.pct / seg.pct * 100, 100)}%`,
                          height: 8,
                          borderRadius: 4,
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.goalPctRow}>
                  <Text style={[styles.goalIdeal, { color: theme.colors.textTertiary }]}>
                    {seg.pct}%
                  </Text>
                  <Text
                    style={[
                      styles.goalDeviation,
                      {
                        color: dev ? (dev.startsWith("+") ? NWS_COLORS.wants.main : NWS_COLORS.needs.main) : theme.colors.textTertiary,
                      },
                    ]}
                  >
                    {dev || "✓"}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Quick Stats */}
      <View style={[styles.statsRow, { borderTopColor: theme.colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: NWS_COLORS.needs.main }]}>
            {needsPct.toFixed(0)}%
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Needs
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: NWS_COLORS.wants.main }]}>
            {wantsPct.toFixed(0)}%
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Wants
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: NWS_COLORS.savings.main }]}>
            {savingsPct.toFixed(0)}%
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Savings
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  emptyCard: {
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 120,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  infoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
  },
  infoText: {
    fontSize: 12,
    fontWeight: "600",
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: {
    justifyContent: "center",
    alignItems: "center",
  },
  centerValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  centerLabelText: {
    fontSize: 10,
  },
  legendContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  legendValue: {
    fontSize: 12,
    marginTop: 1,
  },
  goalSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  goalRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  goalColumn: {
    flex: 1,
    gap: 6,
  },
  goalLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  goalBarOuter: {
    overflow: "hidden",
  },
  goalBarIdeal: {
    overflow: "hidden",
  },
  goalBarActual: {},
  goalPctRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalIdeal: {
    fontSize: 10,
    fontWeight: "600",
  },
  goalDeviation: {
    fontSize: 10,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    opacity: 0.3,
  },
  sheetContent: {
    gap: 16,
  },
  sheetItem: {
    gap: 4,
  },
  sheetLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  sheetDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  sheetNote: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 8,
  },
});
