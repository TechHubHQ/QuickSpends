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
  data: any[];
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

  const incomeData = data.map((item) => ({
    value: item.income,
    label: item.label,
    dataPointText: "",
  }));

  const expenseData = data.map((item) => ({
    value: item.expense,
    label: item.label,
    dataPointText: "",
  }));

  const allValues = [
    ...incomeData.map((d) => d.value),
    ...expenseData.map((d) => d.value),
  ];
  const maxValue = Math.max(...allValues, 100);

  const chartWidth = Math.max(
    containerWidth - CARD_HORIZONTAL_PADDING * 2.2,
    240,
  );
  const edgeInset = 12;
  const initialSpacing = edgeInset;
  const endSpacing = edgeInset;
  const spacing =
    (chartWidth - initialSpacing - endSpacing) /
    Math.max(1, data.length - 1);
  const labelWidth = 36;

  const totalIncome = data.reduce((s, d) => s + d.income, 0);
  const totalExpense = data.reduce((s, d) => s + d.expense, 0);
  const netFlow = totalIncome - totalExpense;

  return (
    <LinearGradient
      colors={
        theme.isDark
          ? [theme.colors.card, theme.colors.backgroundSecondary]
          : ["#ffffff", "#f0fdf4"]
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
                    backgroundColor: theme.colors.success + "15",
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
                    backgroundColor: theme.colors.error + "15",
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

      {/* Mini summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Income
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
            {formatCurrency(totalIncome)}
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Expense
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.error }]}>
            {formatCurrency(totalExpense)}
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Net
          </Text>
          <Text
            style={[
              styles.summaryValue,
              { color: netFlow >= 0 ? theme.colors.success : theme.colors.error },
            ]}
          >
            {formatCurrency(netFlow)}
          </Text>
        </View>
      </View>

      <View style={styles.chartWrapper}>
        <LineChart
          key={`cashflow-chart-${pointerResetKey}`}
          data={incomeData}
          data2={expenseData}
          height={160}
          width={chartWidth}
          color1={theme.colors.success}
          color2={theme.colors.error}
          thickness1={3}
          thickness2={3}
          dataPointsColor1={theme.colors.success}
          dataPointsColor2={theme.colors.error}
          dataPointsRadius1={4}
          dataPointsRadius2={4}
          focusedDataPointColor={theme.colors.card}
          focusedDataPointRadius={7}
          showDataPointOnFocus
          showStripOnFocus
          stripHeight={150}
          stripWidth={2}
          stripColor={theme.colors.primary}
          stripOpacity={0.2}
          hideDataPoints={false}
          areaChart
          startFillColor1={theme.colors.success}
          startOpacity1={0.2}
          endFillColor1={theme.colors.success}
          endOpacity1={0.02}
          startFillColor2={theme.colors.error}
          startOpacity2={0.2}
          endFillColor2={theme.colors.error}
          endOpacity2={0.02}
          hideRules
          hideYAxisText
          xAxisThickness={0}
          yAxisThickness={0}
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
          endSpacing={endSpacing}
          isAnimated
          animationDuration={1200}
          pointerConfig={{
            pointerStripColor: theme.colors.primary,
            pointerStripWidth: 2,
            pointerStripHeight: 150,
            pointerColor: theme.colors.primary,
            radius: 6,
            pointerLabelWidth: 120,
            pointerLabelHeight: 100,
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: true,
            persistPointer: true,
            pointerVanishDelay: 5000,
            pointerLabelComponent: (items: any) => {
              if (!items || items.length === 0) return null;

              const currentItem = items[0];
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
                <LinearGradient
                  colors={
                    theme.isDark
                      ? ["#1e293b", "#0f172a"]
                      : ["#ffffff", "#f8fafc"]
                  }
                  style={[
                    styles.pointerLabel,
                    {
                      borderColor: theme.colors.primary + "40",
                      ...Platform.select({
                        ios: {
                          shadowColor: theme.colors.primary,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.2,
                          shadowRadius: 12,
                        },
                        android: {
                          elevation: 8,
                        },
                      }),
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
                    <View style={[styles.pointerDot, { backgroundColor: theme.colors.success }]} />
                    <Text style={{ color: theme.colors.text, fontSize: 12, flex: 1 }}>
                      Income
                    </Text>
                    <Text style={{ color: theme.colors.success, fontSize: 12, fontWeight: "700" }}>
                      {formatCurrency(incomeValue)}
                    </Text>
                  </View>
                  <View style={styles.pointerRow}>
                    <View style={[styles.pointerDot, { backgroundColor: theme.colors.error }]} />
                    <Text style={{ color: theme.colors.text, fontSize: 12, flex: 1 }}>
                      Expense
                    </Text>
                    <Text style={{ color: theme.colors.error, fontSize: 12, fontWeight: "700" }}>
                      {formatCurrency(expenseValue)}
                    </Text>
                  </View>
                  <View style={[styles.pointerDivider, { backgroundColor: theme.colors.border }]} />
                  <View style={styles.pointerRow}>
                    <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: "600", flex: 1 }}>
                      Net
                    </Text>
                    <Text
                      style={{
                        color: incomeValue - expenseValue >= 0 ? theme.colors.success : theme.colors.error,
                        fontSize: 12,
                        fontWeight: "800",
                      }}
                    >
                      {formatCurrency(incomeValue - expenseValue)}
                    </Text>
                  </View>
                </LinearGradient>
              );
            },
          }}
          yAxisOffset={-(maxValue * 0.2)}
        />

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
    marginBottom: 12,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
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
  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "800",
  },
  summaryDivider: {
    width: 1,
    height: 24,
    opacity: 0.3,
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
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    minWidth: 130,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 2,
    textAlign: "center",
    textTransform: "uppercase",
  },
  pointerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
  },
  pointerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pointerDivider: {
    height: 1,
    opacity: 0.3,
    marginVertical: 2,
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
