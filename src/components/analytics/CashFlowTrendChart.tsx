import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Dimensions,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useTheme } from "../../theme/ThemeContext";
import { formatCurrency } from "../../utils/format";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_HORIZONTAL_PADDING = 24;

interface CashFlowTrendChartProps {
  data: any[]; // History array from useAnalytics
  loading?: boolean;
}

const CashFlowTrendChart = ({ data, loading }: CashFlowTrendChartProps) => {
  const { theme } = useTheme();
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH - 64);
  const [pointerResetKey, setPointerResetKey] = useState(0);

  const resetPointer = () => setPointerResetKey((prev) => prev + 1);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  if (!data || data.length === 0) return null;

  // Prepare datasets
  const incomeData = data.map((item) => ({
    value: item.income,
    label: item.label,
    dataPointText: "", // Hide default text
    // Custom styling for income points?
  }));

  const expenseData = data.map((item) => ({
    value: item.expense,
    label: item.label,
    dataPointText: "",
  }));

  // Check if we have valid data to show
  const allValues = [
    ...incomeData.map((d) => d.value),
    ...expenseData.map((d) => d.value),
  ];
  const maxValue = Math.max(...allValues, 100); // Minimum 100 to avoid flatline on 0

  // Spacing
  // Same manual spacing logic as NetWorthCard to match 'premium' feel and avoid clipping
  const chartWidth = Math.max(
    containerWidth - CARD_HORIZONTAL_PADDING * 2.2,
    240,
  );
  // Tighter spacing so labels stay closer to the data points
  const edgeInset = 12; // keep a small safe inset so the curve/points don't clip
  const initialSpacing = edgeInset;
  const endSpacing = edgeInset; // keep end spacing symmetric with start
  const spacing =
    (chartWidth - initialSpacing - endSpacing) /
    Math.max(1, data.length - 1);
  const labelWidth = 36; // width used to center labels under points

  // Use shared formatter that gracefully falls back in environments where Intl options are limited
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
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Cash Flow
            </Text>
            <Text
              style={[styles.subtitle, { color: theme.colors.textSecondary }]}
            >
              Income vs Expenses
            </Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.legendRow}>
              <View
                style={[
                  styles.legendPill,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.success + "12",
                  },
                ]}
              >
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: theme.colors.success },
                  ]}
                />
                <Text style={[styles.legendText, { color: theme.colors.text }]}>
                  Income
                </Text>
              </View>
              <View
                style={[
                  styles.legendPill,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.error + "12",
                  },
                ]}
              >
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: theme.colors.error },
                  ]}
                />
                <Text style={[styles.legendText, { color: theme.colors.text }]}>
                  Expense
                </Text>
              </View>
            </View>
            <Text style={[styles.resetText, { color: theme.colors.textSecondary }]}>
              Reset
            </Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.chartWrapper}>
        <LineChart
          key={`cashflow-chart-${pointerResetKey}`}
          data={incomeData}
          data2={expenseData}
          height={160}
          width={chartWidth}
          // Style adjustments
          color1={theme.colors.success}
          color2={theme.colors.error}
          thickness1={3}
          thickness2={3}
          // Points
          dataPointsColor1={theme.colors.success}
          dataPointsColor2={theme.colors.error}
          dataPointsRadius1={4}
          dataPointsRadius2={4}
          hideDataPoints={false}
          // Areas
          areaChart
          startFillColor1={theme.colors.success}
          startOpacity1={0.2}
          endFillColor1={theme.colors.success}
          endOpacity1={0.01}
          startFillColor2={theme.colors.error}
          startOpacity2={0.2}
          endFillColor2={theme.colors.error}
          endOpacity2={0.01}
          // Axes
          hideRules
          hideYAxisText
          xAxisThickness={0}
          yAxisThickness={0}
          // Hide built-in labels — we'll render only start & end labels below
          xAxisLabelTextStyle={{
            color: "transparent",
            fontSize: 1,
            lineHeight: 1,
            fontWeight: "500",
          }}
          xAxisLabelsVerticalShift={4}
          // Curve
          curved
          curveType={1}
          // Spacing
          spacing={spacing}
          initialSpacing={initialSpacing}
          endSpacing={endSpacing}
          // Animation
          isAnimated
          animationDuration={1200}
          // Pointers
          pointerConfig={{
            pointerStripColor: theme.colors.primary,
            pointerStripWidth: 2,
            pointerColor: theme.colors.primary, // Neutral pointer color? Or adaptive? using primary is safe
            radius: 6,
            pointerLabelWidth: 100,
            pointerLabelHeight: 90, // Taller for 2 values
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: true,
            persistPointer: true,
            pointerLabelComponent: (items: any) => {
              if (!items || items.length === 0) return null;

              const currentItem = items[0];
              // Prefer index if available, otherwise fallback to matching by label
              const idx =
                typeof currentItem.index === "number"
                  ? currentItem.index
                  : incomeData.findIndex((d) => d.label === currentItem.label);

              const label =
                idx >= 0
                  ? (data[idx]?.label ?? currentItem.label)
                  : currentItem.label;
              const incomeValue =
                idx >= 0
                  ? (incomeData[idx]?.value ?? 0)
                  : (incomeData.find((d) => d.label === currentItem.label)
                      ?.value ?? 0);
              const expenseValue =
                idx >= 0
                  ? (expenseData[idx]?.value ?? 0)
                  : (expenseData.find((d) => d.label === currentItem.label)
                      ?.value ?? 0);

              return (
                <View
                  style={[
                    styles.pointerLabel,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dateLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {label}
                  </Text>
                  <View style={styles.pointerRow}>
                    <Text
                      style={{
                        color: theme.colors.success,
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      Income:
                    </Text>
                    <Text style={{ color: theme.colors.text, fontSize: 12 }}>
                      {formatCurrency(incomeValue)}
                    </Text>
                  </View>
                  <View style={styles.pointerRow}>
                    <Text
                      style={{
                        color: theme.colors.error,
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      Expense:
                    </Text>
                    <Text style={{ color: theme.colors.text, fontSize: 12 }}>
                      {formatCurrency(expenseValue)}
                    </Text>
                  </View>
                </View>
              );
            },
          }}
          yAxisOffset={-(maxValue * 0.2)} // Add padding at the bottom so 0 is not cut off
        />

        {/* Custom X-axis: show only the start and end labels to avoid crowding */}
        {data.length > 1 && (
          <View style={[styles.customXAxis, { width: chartWidth }]}>
            <View style={{ width: chartWidth, height: 22 }}>
              {[0, data.length - 1].map((i) => (
                <Text
                  key={i}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[
                    styles.xLabelDynamic,
                    {
                      // Center labels under their points using labelWidth — nudge the last label slightly right
                      left: Math.min(
                        Math.max(
                          10,
                          initialSpacing +
                            spacing * i -
                            Math.floor(labelWidth / 2) +
                            (i === data.length - 1 ? 8 : 0),
                        ),
                        chartWidth - labelWidth,
                      ),
                      color: theme.colors.textSecondary,
                    },
                  ]}
                >
                  {data[i].label}
                </Text>
              ))}
            </View>
          </View>
        )}
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
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerTop: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 6,
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
  legendRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  legendPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: "600",
  },
  resetText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  chartWrapper: {
    minHeight: 190,
    alignItems: "center",
    justifyContent: "flex-start",
    marginVertical: 10,
    paddingTop: 4,
    overflow: "hidden",
  },
  pointerLabel: {
    padding: 10,
    borderRadius: 12,
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
    gap: 4,
    minWidth: 120,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
    textTransform: "uppercase",
  },
  pointerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  customXAxis: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 6,
  },
  xLabelDynamic: {
    position: "absolute",
    width: 36,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
  },
});

export default CashFlowTrendChart;
