import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { LineChart } from "react-native-gifted-charts";
import { NetWorthData } from "../../hooks/useAnalytics";
import { useTheme } from "../../theme/ThemeContext";
import { formatCurrency } from "../../utils/format";

const CARD_HORIZONTAL_PADDING = 24;

interface NetWorthCardProps {
  data: NetWorthData | null;
  loading?: boolean;
}

const NetWorthCard = ({ data, loading }: NetWorthCardProps) => {
  const { theme } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const fallbackWidth = Math.max(240, windowWidth - 32);
  const [containerWidth, setContainerWidth] = useState(fallbackWidth); // Default fallback
  const [pointerResetKey, setPointerResetKey] = useState(0);

  const resetPointer = () => setPointerResetKey((prev) => prev + 1);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (Number.isFinite(width) && width > 0) {
      setContainerWidth(width);
    }
  };

  if (!data && !loading) return null;

  // Use history from data or fallback to empty array
  const chartData =
    data?.history?.map((point) => {
      const numericValue = Number(point.value);
      return {
        value: Number.isFinite(numericValue) ? numericValue : 0,
        label: point.label,
      };
    }) || [];

  // Adaptive X-axis label rendering to avoid crowding on narrow screens
  const MIN_LABEL_WIDTH = 48; // px per label (approx)
  const safeContainerWidth =
    Number.isFinite(containerWidth) && containerWidth > 0
      ? containerWidth
      : fallbackWidth;
  const chartWidth = Math.max(
    safeContainerWidth - CARD_HORIZONTAL_PADDING * 2,
    240,
  );

  // How many labels can we reasonably show given the available width
  const maxVisibleLabels = Math.max(
    2,
    Math.floor((chartWidth - 40) / MIN_LABEL_WIDTH),
  );

  // Only show the first and last labels to avoid any crowding — simple and readable on mobile
  const visibleLabelIndices = new Set<number>();
  if (chartData.length > 0) {
    visibleLabelIndices.add(0);
    if (chartData.length > 1) visibleLabelIndices.add(chartData.length - 1);
  }

  const chartDataForRender = chartData.map((d, i) => ({
    ...d,
    // Only render label if its index was chosen to be visible
    label: visibleLabelIndices.has(i) ? d.label : "",
  }));

  // Calculate Y-axis range to auto-adjust
  const values = chartDataForRender.map((d) => d.value);
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 1000;
  // Increased padding even further (30% above and below) for maximum visibility
  const padding = (maxValue - minValue) * 0.3 || 1000;

  const currentNetWorth = data?.netWorth || 0;
  const assets = data?.totalAssets || 0;
  const liabilities = data?.totalLiabilities || 0;
  const trend = data?.trend || "stable";
  const changePercentage = data?.changePercentage || 0;

  // Spacing heuristics to keep curves fully visible on small screens
  const edgeInset = Math.max(16, Math.round(chartWidth * 0.05));
  const initialSpacing = edgeInset;
  const computedEndSpacing = edgeInset;
  const spacing =
    (chartWidth - initialSpacing - computedEndSpacing) /
    Math.max(1, chartDataForRender.length - 1);

  // Use shared formatter that gracefully falls back in environments where Intl options are limited
  // (e.g., older Hermes engines on Android)
  // `formatCurrency` is imported from utils/format

  return (
    <LinearGradient
      colors={
        theme.isDark
          ? [theme.colors.card, theme.colors.backgroundSecondary]
          : ["#ffffff", "#f8fafc"]
      }
      style={[styles.card, { borderColor: theme.colors.border }]}
      onLayout={onLayout}
    >
      <Pressable style={styles.header} onPress={resetPointer}>
        <View>
          <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
            Net Worth
          </Text>
          <Text style={[styles.netWorthValue, { color: theme.colors.text }]}>
            {formatCurrency(currentNetWorth)}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {trend !== "stable" && (
            <View
              style={[
                styles.percentBadge,
                {
                  backgroundColor:
                    (trend === "up"
                      ? theme.colors.success
                      : theme.colors.error) + "20",
                },
              ]}
            >
              <Ionicons
                name={trend === "up" ? "trending-up" : "trending-down"}
                size={16}
                color={trend === "up" ? theme.colors.success : theme.colors.error}
              />
              <Text
                style={[
                  styles.percentText,
                  {
                    color:
                      trend === "up"
                        ? theme.colors.success
                        : theme.colors.error,
                  },
                ]}
              >
                {trend === "up" ? "+" : "-"}
                {changePercentage.toFixed(1)}%
              </Text>
            </View>
          )}
          <Text style={[styles.resetText, { color: theme.colors.textSecondary }]}>
            Reset
          </Text>
        </View>
      </Pressable>

      <View style={styles.chartWrapper}>
        <Animated.View entering={FadeInUp.duration(500)}>
          <LineChart
            key={`networth-chart-${pointerResetKey}`}
            data={chartDataForRender}
            height={120}
            width={chartWidth}
            color={theme.colors.primary}
            thickness={4}
            hideRules
            hideDataPoints={false}
            dataPointsColor={theme.colors.primary}
            dataPointsRadius={Math.max(
              3,
              Math.min(6, Math.round((containerWidth || 320) / 80)),
            )}
            focusedDataPointRadius={6}
            hideYAxisText
            xAxisThickness={0}
            yAxisThickness={0}
            // Hide the built-in chart x-axis labels — we render precise, positioned labels below
            xAxisLabelTextStyle={{
              color: "transparent",
              fontSize: 1,
              lineHeight: 1,
              fontWeight: "500",
            }}
            xAxisLabelsVerticalShift={4}
            curved
            curveType={1}
            spacing={spacing}
            initialSpacing={initialSpacing}
            endSpacing={computedEndSpacing}
            disableScroll
            isAnimated
            animateOnDataChange
            onDataChangeAnimationDuration={1200}
            animationDuration={1200}
            // Area under the graph
            areaChart
            startFillColor={theme.colors.primary}
            startOpacity={0.3}
            endFillColor={theme.colors.primary}
            endOpacity={0.01}
            // Pointer config for premium feel
            pointerConfig={{
              pointerStripColor: theme.colors.primary,
              pointerStripWidth: 2,
              pointerColor: theme.colors.primary,
              radius: 6,
              pointerLabelWidth: 100,
              pointerLabelHeight: 50, // Slightly taller
              activatePointersOnLongPress: false,
              autoAdjustPointerLabelPosition: true,
              persistPointer: true,
              pointerLabelComponent: (items: any) => {
                return (
                  <View
                    style={[
                      styles.pointerLabel,
                      {
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                        zIndex: 1000,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pointerLabelText,
                        { color: theme.colors.text },
                      ]}
                    >
                      {formatCurrency(items[0].value)}
                    </Text>
                  </View>
                );
              },
            }}
            yAxisOffset={-(maxValue * 0.2)}
          />
        </Animated.View>

        {/* Custom X-axis: show only a subset of labels based on available width to avoid crowding */}
        {chartData.length > 1 && (
          <View style={[styles.customXAxis, { width: chartWidth }]}>
            <View style={{ width: chartWidth, height: 22 }}>
              {chartDataForRender.map((d, i) =>
                d.label ? (
                  <Text
                    key={i}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.xLabelDynamic,
                      {
                        // Ensure labels don't touch the left edge — keep at least 10px
                        left: Math.min(
                          Math.max(
                            15,
                            // For the last label, subtract less so it moves a bit more to the right
                            initialSpacing +
                              spacing * i -
                              (i === chartDataForRender.length - 1 ? 4 : 24),
                          ),
                          chartWidth - 48,
                        ),
                        color: theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {d.label}
                  </Text>
                ) : null,
              )}
            </View>
          </View>
        )}
      </View>

      <Pressable style={styles.statsRow} onPress={resetPointer}>
        <View style={styles.statItem}>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}
          >
            Assets
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>
            +{formatCurrency(assets)}
          </Text>
        </View>
        <View
          style={[
            styles.verticalDivider,
            { backgroundColor: theme.colors.border },
          ]}
        />
        <View style={styles.statItem}>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}
          >
            Liabilities
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.error }]}>
            -{formatCurrency(liabilities)}
          </Text>
        </View>
      </Pressable>
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
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  netWorthValue: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  percentBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  percentText: {
    fontSize: 12,
    fontWeight: "700",
  },
  resetText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  chartWrapper: {
    height: 160, // Increased height to prevent vertical cutting of bottom labels
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    paddingTop: 12, // Make room for pointer labels so they are not clipped
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  verticalDivider: {
    width: 1,
    height: 30,
    opacity: 0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    opacity: 0.8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  pointerLabel: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
      },
    }),
  },
  pointerLabelText: {
    fontSize: 13,
    fontWeight: "700",
  },
  customXAxis: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 6,
  },
  xLabel: {
    fontSize: 12,
    fontWeight: "600",
    width: "48%",
    textAlign: "center",
  },
  xLabelDynamic: {
    position: "absolute",
    width: 48,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
  },
});

export default NetWorthCard;
