import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { PieChart } from "react-native-gifted-charts";
import { NeedsWantsSavingsData } from "../../hooks/useAnalytics";
import { Theme } from "../../theme/theme";
import { formatCurrencyCompact } from "../../utils/format";
import { QSInfoSheet } from "../QSInfoSheet";

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
  const { width } = useWindowDimensions();
  const isNarrow = width < 380;
  const radius = isNarrow ? 64 : 80;
  const innerRadius = isNarrow ? 44 : 55;
  if (!data || data.total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No data for Needs vs Wants
        </Text>
      </View>
    );
  }

  const { needs, wants, savings, total } = data;

  const pieData = [
    {
      value: needs,
      color: "#4F46E5", // Indigo for Needs
      text: "Needs",
      name: "Needs",
      type: "needs",
      percentage: ((needs / total) * 100).toFixed(0),
      onPress: () => onSegmentPress?.("needs", "Needs Transactions"),
    },
    {
      value: wants,
      color: "#EC4899", // Pink for Wants
      text: "Wants",
      name: "Wants",
      type: "wants",
      percentage: ((wants / total) * 100).toFixed(0),
      onPress: () => onSegmentPress?.("wants", "Wants Transactions"),
    },
    {
      value: savings,
      color: "#10B981", // Emerald for Savings
      text: "Savings",
      name: "Savings",
      type: "savings",
      percentage: ((savings / total) * 100).toFixed(0),
      onPress: () => onSegmentPress?.("savings", "Savings Transactions"),
    },
  ].filter((item) => item.value > 0);

  // Use a safe compact currency formatter that falls back if the environment doesn't support Intl notation
  const formatCurrency = (amount: number) => formatCurrencyCompact(amount);

  return (
    <View style={styles.container}>
      {/* Header with toggle */}
      <TouchableOpacity
        style={styles.headerRow}
        onPress={() => setShowInfo(true)}
        activeOpacity={0.7}
      >
        {!isNarrow ? (
          <>
            <Text style={[styles.infoLink, { color: theme.colors.primary }]}>
              How is this calculated?
            </Text>
            <MaterialCommunityIcons
              name="information-outline"
              size={16}
              color={theme.colors.primary}
            />
          </>
        ) : (
          <MaterialCommunityIcons
            name="information-outline"
            size={18}
            color={theme.colors.primary}
            accessibilityLabel="How is this calculated?"
          />
        )}
      </TouchableOpacity>

      <QSInfoSheet
        visible={showInfo}
        onClose={() => setShowInfo(false)}
        title="Needs vs Wants Logic"
      >
        <View style={styles.sheetContent}>
          <View style={styles.sheetItem}>
            <MaterialCommunityIcons
              name="home-city"
              size={20}
              color={theme.colors.primary}
              style={styles.sheetIcon}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.sheetLabel, { color: theme.colors.text }]}>
                Needs (50%)
              </Text>
              <Text
                style={[
                  styles.sheetDesc,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Essentials you cannot live without: Housing, Utilities,
                Groceries, Transport, Health, Education, Bills, Loans.
              </Text>
            </View>
          </View>

          <View style={styles.sheetItem}>
            <MaterialCommunityIcons
              name="wallet-giftcard"
              size={20}
              color={theme.colors.error}
              style={styles.sheetIcon}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.sheetLabel, { color: theme.colors.text }]}>
                Wants (30%)
              </Text>
              <Text
                style={[
                  styles.sheetDesc,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Discretionary spending: Dining out, Entertainment, Shopping,
                Hobbies, Vacations.
              </Text>
            </View>
          </View>

          <View style={styles.sheetItem}>
            <MaterialCommunityIcons
              name="bank"
              size={20}
              color={theme.colors.success}
              style={styles.sheetIcon}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.sheetLabel, { color: theme.colors.text }]}>
                Savings (20%)
              </Text>
              <Text
                style={[
                  styles.sheetDesc,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Money transferred to your defined Savings Goals.
              </Text>
            </View>
          </View>
        </View>
      </QSInfoSheet>

      {/* Responsive chart + legend: stack on narrow screens */}
      <View
        style={[
          styles.chartRow,
          isNarrow ? { flexDirection: "column", alignItems: "center" } : {},
        ]}
      >
        <View
          style={[styles.chartWrapper, isNarrow ? { marginBottom: 12 } : {}]}
        >
          <Animated.View entering={FadeInUp.duration(500)}>
            <PieChart
              donut
              radius={radius}
              innerRadius={innerRadius}
              innerCircleColor={theme.colors.card}
              toggleFocusOnPress
              isAnimated
              animationDuration={900}
              data={pieData}
              centerLabelComponent={() => {
                return (
                  <View
                    style={{ justifyContent: "center", alignItems: "center" }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color: theme.colors.text,
                        fontWeight: "bold",
                      }}
                    >
                      {formatCurrency(total)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        color: theme.colors.textSecondary,
                      }}
                    >
                      Total
                    </Text>
                  </View>
                );
              }}
            />
          </Animated.View>
        </View>

        {/* Legend */}
        {isNarrow ? (
          <View style={styles.compactLegendRow}>
            {pieData.map((item, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.compactLegendItem,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() =>
                  onSegmentPress?.(
                    item.type as any,
                    `${item.name} Transactions`,
                  )
                }
              >
                <View
                  style={[styles.legendDot, { backgroundColor: item.color }]}
                />
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[
                    styles.compactLegendLabel,
                    { color: theme.colors.text },
                  ]}
                >
                  {item.name}
                </Text>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[
                    styles.compactLegendValue,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {item.percentage}% • {formatCurrency(item.value)}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View
            style={[
              styles.legendContainer,
              isNarrow
                ? { marginLeft: 0, alignItems: "center", width: "100%" }
                : {},
            ]}
          >
            {pieData.map((item, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.legendItem,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
                onPress={() =>
                  onSegmentPress?.(
                    item.type as any,
                    `${item.name} Transactions`,
                  )
                }
              >
                <View
                  style={[styles.legendDot, { backgroundColor: item.color }]}
                />
                <View style={{ maxWidth: isNarrow ? 160 : 220 }}>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[styles.legendLabel, { color: theme.colors.text }]}
                  >
                    {item.name} ({item.percentage}%)
                  </Text>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.legendValue,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {formatCurrency(item.value)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* 50/30/20 Rule Analysis */}
      <View style={styles.analysisContainer}>
        <Text
          style={[styles.analysisText, { color: theme.colors.textSecondary }]}
        >
          Ideal: 50% Needs, 30% Wants, 20% Savings
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8, // Reduced margin
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 8,
    gap: 4,
  },
  infoLink: {
    fontSize: 12,
    fontWeight: "500",
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Ensure space is used
    paddingHorizontal: 0, // Remove padding to use full width
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1, // Allow chart to take space
  },
  emptyContainer: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
  legendContainer: {
    flex: 1,
    marginLeft: 16, // Reduced margin
    justifyContent: "center",
    gap: 12,
  },
  /* Compact legend (narrow screens) */
  compactLegendRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 8,
  },
  compactLegendItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  compactLegendLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  compactLegendValue: {
    fontSize: 12,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  legendValue: {
    fontSize: 12,
  },
  analysisContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(150, 150, 150, 0.1)",
    alignItems: "center",
  },
  analysisText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  sheetContent: {
    gap: 16,
  },
  sheetItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  sheetIcon: {
    marginTop: 2,
  },
  sheetLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  sheetDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
});
