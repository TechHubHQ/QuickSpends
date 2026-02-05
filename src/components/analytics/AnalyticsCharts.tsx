import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { CategorySpending } from "../../hooks/useAnalytics";
import { Theme } from "../../theme/theme";
import { formatCurrencyCompact } from "../../utils/format";

const { width } = Dimensions.get("window");

const normalizeHex = (color?: string) => {
  if (!color || color[0] !== "#") return null;
  const hex = color.slice(1);
  if (hex.length === 3) {
    return (
      "#" +
      hex
        .split("")
        .map((char) => char + char)
        .join("")
    );
  }
  if (hex.length === 6) return `#${hex}`;
  return null;
};

const mixHex = (base: string, mix: string, amount: number) => {
  const baseHex = normalizeHex(base);
  const mixHexValue = normalizeHex(mix);
  if (!baseHex || !mixHexValue) return base;
  const baseR = parseInt(baseHex.slice(1, 3), 16);
  const baseG = parseInt(baseHex.slice(3, 5), 16);
  const baseB = parseInt(baseHex.slice(5, 7), 16);
  const mixR = parseInt(mixHexValue.slice(1, 3), 16);
  const mixG = parseInt(mixHexValue.slice(3, 5), 16);
  const mixB = parseInt(mixHexValue.slice(5, 7), 16);
  const r = Math.round(baseR + (mixR - baseR) * amount);
  const g = Math.round(baseG + (mixG - baseG) * amount);
  const b = Math.round(baseB + (mixB - baseB) * amount);
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

const getGradientColor = (baseColor: string, isDark: boolean) => {
  const lift = isDark ? 0.18 : 0.32;
  return mixHex(baseColor, "#FFFFFF", lift);
};

const getTopLabelStyle = (barWidth: number, labelWidth: number) => ({
  alignItems: "center",
  marginBottom: 6,
  width: labelWidth,
  left: -Math.round((labelWidth - barWidth) / 2),
});

interface CategoryDonutChartProps {
  data: CategorySpending[];
  theme: Theme;
}

export const CategoryDonutChart = ({
  data,
  theme,
}: CategoryDonutChartProps) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No spending data available
        </Text>
      </View>
    );
  }

  const pieData = data.map((item) => ({
    value: item.total,
    color: item.category_color,
    text: item.category_name,
  }));

  return (
    <View style={styles.chartWrapper}>
      <Animated.View entering={FadeInUp.duration(500)}>
        <PieChart
          donut
          sectionAutoFocus
          isAnimated
          animationDuration={900}
          radius={90}
          innerRadius={60}
          innerCircleColor={theme.colors.card}
          data={pieData}
          centerLabelComponent={() => {
            const total = data.reduce((sum, item) => sum + item.total, 0);
            return (
              <View style={{ justifyContent: "center", alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 20,
                    color: theme.colors.text,
                    fontWeight: "bold",
                  }}
                >
                  ₹{total.toLocaleString()}
                </Text>
                <Text
                  style={{ fontSize: 12, color: theme.colors.textSecondary }}
                >
                  Total
                </Text>
              </View>
            );
          }}
        />
      </Animated.View>
    </View>
  );
};

interface BudgetBarChartProps {
  data: any[];
  theme: Theme;
}

export const BudgetBarChart = ({ data, theme }: BudgetBarChartProps) => {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(
    ...data.map((item) => Math.max(item.spent_amount, item.budget_amount)),
  );

  const barWidth = 24;
  const topLabelWidth = 52;
  const topLabelStyle = getTopLabelStyle(barWidth, topLabelWidth);
  const gridColor = theme.isDark
    ? "rgba(148,163,184,0.18)"
    : "rgba(15,23,42,0.08)";
  const borderColor = theme.isDark
    ? "rgba(255,255,255,0.12)"
    : "rgba(15,23,42,0.08)";
  const pillBackground = theme.isDark
    ? "rgba(15,23,42,0.9)"
    : "rgba(255,255,255,0.95)";

  const barData = data.map((item) => ({
    value: item.spent_amount,
    label:
      item.category_name.length > 10
        ? item.category_name.substring(0, 8) + ".."
        : item.category_name,
    frontColor:
      item.spent_amount > item.budget_amount
        ? theme.colors.error
        : theme.colors.primary,
    showGradient: true,
    gradientColor: getGradientColor(
      item.spent_amount > item.budget_amount
        ? theme.colors.error
        : theme.colors.primary,
      theme.isDark,
    ),
    barBorderRadius: 5,
    barBorderTopLeftRadius: 5,
    barBorderTopRightRadius: 5,
    barBorderBottomLeftRadius: 3,
    barBorderBottomRightRadius: 3,
    topLabelComponent: () => (
      <View
        style={[
          styles.valuePill,
          { backgroundColor: pillBackground, borderColor },
        ]}
      >
        <Text style={[styles.valuePillText, { color: theme.colors.text }]}>
          {Math.round(item.percentage)}%
        </Text>
      </View>
    ),
    topLabelContainerStyle: topLabelStyle,
    topLabelComponentHeight: 22,
    barInnerComponent: () => (
      <View
        style={[
          styles.barHighlight,
          {
            backgroundColor: theme.isDark
              ? "rgba(255,255,255,0.35)"
              : "rgba(255,255,255,0.65)",
          },
        ]}
      />
    ),
  }));

  return (
    <View style={[styles.chartWrapper, { height: 300 }]}>
      <Animated.View entering={FadeInUp.duration(500)}>
        <BarChart
          data={barData}
          barWidth={barWidth}
          noOfSections={4}
          maxValue={maxVal * 1.15}
          height={220}
          overflowTop={28}
          initialSpacing={14}
          endSpacing={14}
          spacing={22}
          barBorderWidth={1}
          barBorderColor={borderColor}
          yAxisThickness={0}
          yAxisLabelWidth={0}
          xAxisThickness={1}
          xAxisColor={gridColor}
          rulesColor={gridColor}
          rulesThickness={1}
          isAnimated
          animationDuration={900}
          xAxisLabelTextStyle={{
            color: theme.colors.textSecondary,
            fontSize: 10,
            fontWeight: "600",
            letterSpacing: 0.2,
          }}
        />
      </Animated.View>
    </View>
  );
};

interface SpendingBarChartProps {
  data: CategorySpending[];
  theme: Theme;
}

export const SpendingBarChart = ({ data, theme }: SpendingBarChartProps) => {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((item) => item.total));

  const barWidth = 26;
  const topLabelWidth = 64;
  const topLabelStyle = getTopLabelStyle(barWidth, topLabelWidth);
  const gridColor = theme.isDark
    ? "rgba(148,163,184,0.18)"
    : "rgba(15,23,42,0.08)";
  const borderColor = theme.isDark
    ? "rgba(255,255,255,0.12)"
    : "rgba(15,23,42,0.08)";
  const pillBackground = theme.isDark
    ? "rgba(15,23,42,0.9)"
    : "rgba(255,255,255,0.95)";

  const barData = data.slice(0, 5).map((item) => ({
    // Show top 5
    value: item.total,
    label:
      item.category_name.length > 8
        ? item.category_name.substring(0, 6) + ".."
        : item.category_name,
    frontColor: item.category_color || theme.colors.primary,
    showGradient: true,
    gradientColor: getGradientColor(
      item.category_color || theme.colors.primary,
      theme.isDark,
    ),
    barBorderRadius: 5,
    barBorderTopLeftRadius: 5,
    barBorderTopRightRadius: 5,
    barBorderBottomLeftRadius: 3,
    barBorderBottomRightRadius: 3,
    topLabelComponent: () => (
      <View
        style={[
          styles.valuePill,
          { backgroundColor: pillBackground, borderColor },
        ]}
      >
        <View
          style={[
            styles.valuePillDot,
            { backgroundColor: item.category_color || theme.colors.primary },
          ]}
        />
        <Text style={[styles.valuePillText, { color: theme.colors.text }]}>
          {/* Use safe compact formatter to avoid Intl not supporting `notation` on some JS engines */}
          {formatCurrencyCompact(item.total)}
        </Text>
      </View>
    ),
    topLabelContainerStyle: topLabelStyle,
    topLabelComponentHeight: 22,
    barInnerComponent: () => (
      <View
        style={[
          styles.barHighlight,
          {
            backgroundColor: theme.isDark
              ? "rgba(255,255,255,0.35)"
              : "rgba(255,255,255,0.65)",
          },
        ]}
      />
    ),
  }));
  return (
    <View style={[styles.chartWrapper, { height: 320 }]}>
      <Animated.View entering={FadeInUp.duration(500)}>
        <BarChart
          data={barData}
          barWidth={barWidth}
          noOfSections={4}
          maxValue={maxVal * 1.15}
          height={230}
          overflowTop={32}
          initialSpacing={14}
          endSpacing={14}
          spacing={22}
          barBorderWidth={1}
          barBorderColor={borderColor}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={gridColor}
          xAxisLabelTextStyle={{
            color: theme.colors.textSecondary,
            fontSize: 10,
            width: 44,
            fontWeight: "600",
            letterSpacing: 0.2,
          }}
          rulesColor={gridColor}
          rulesThickness={1}
          isAnimated
          animationDuration={900}
          yAxisLabelTexts={[""]}
          yAxisLabelWidth={0}
          hideYAxisText
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartWrapper: {
    alignItems: "center",
    paddingVertical: 10,
    width: "100%",
    marginLeft: 0,
  },
  emptyContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  valuePill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  valuePillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  valuePillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  barHighlight: {
    height: 3,
    borderRadius: 2,
    marginTop: 6,
    marginHorizontal: 6,
  },
});
