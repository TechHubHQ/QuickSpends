import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { CategorySpending } from "../../hooks/useAnalytics";
import { Theme } from "../../theme/theme";
import { formatCurrencyCompact } from "../../utils/format";

const { width } = Dimensions.get("window");

const mixHex = (base: string, mix: string, amount: number) => {
  const bR = parseInt(base.slice(1, 3), 16);
  const bG = parseInt(base.slice(3, 5), 16);
  const bB = parseInt(base.slice(5, 7), 16);
  const mR = parseInt(mix.slice(1, 3), 16);
  const mG = parseInt(mix.slice(3, 5), 16);
  const mB = parseInt(mix.slice(5, 7), 16);
  const r = Math.round(bR + (mR - bR) * amount);
  const g = Math.round(bG + (mG - bG) * amount);
  const b = Math.round(bB + (mB - bB) * amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

const getGradientColor = (baseColor: string, isDark: boolean) => {
  const lift = isDark ? 0.18 : 0.32;
  return mixHex(baseColor, "#FFFFFF", lift);
};

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

  const total = data.reduce((sum, item) => sum + item.total, 0);

  const pieData = data.map((item) => ({
    value: item.total,
    color: item.category_color || theme.colors.primary,
    text: item.category_name,
  }));

  return (
    <View>
      <Animated.View entering={FadeInUp.duration(500)} style={styles.chartWrapper}>
        <PieChart
          donut
          sectionAutoFocus
          isAnimated
          animationDuration={900}
          radius={80}
          innerRadius={52}
          innerCircleColor={theme.colors.card}
          data={pieData}
          centerLabelComponent={() => (
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: theme.colors.text }}>
                {formatCurrencyCompact(total)}
              </Text>
              <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 }}>
                Total
              </Text>
            </View>
          )}
        />
      </Animated.View>
      <View style={styles.legendContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.category_color || theme.colors.primary }]} />
            <Text style={[styles.legendLabel, { color: theme.colors.text }]} numberOfLines={1}>
              {item.category_name}
            </Text>
            <Text style={[styles.legendValue, { color: theme.colors.textSecondary }]}>
              {item.percentage.toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
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
  const gridColor = theme.isDark ? "rgba(148,163,184,0.15)" : "rgba(15,23,42,0.06)";
  const borderColor = theme.isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.06)";
  const barWidth = 22;

  const barData = data.slice(0, 6).map((item) => ({
    value: item.total,
    label: item.category_name.length > 8 ? item.category_name.substring(0, 6) + ".." : item.category_name,
    frontColor: item.category_color || theme.colors.primary,
    gradientColor: getGradientColor(item.category_color || theme.colors.primary, theme.isDark),
    barBorderRadius: 6,
    topLabelComponent: () => (
      <Text style={{ fontSize: 10, fontWeight: "700", color: theme.colors.textSecondary, marginBottom: 2 }}>
        {formatCurrencyCompact(item.total)}
      </Text>
    ),
    topLabelContainerStyle: { alignItems: "center", marginBottom: 4, width: 56, left: -17 },
    topLabelComponentHeight: 18,
  }));

  return (
    <View style={[styles.chartWrapper, { height: 260 }]}>
      <Animated.View entering={FadeInUp.duration(500)}>
        <BarChart
          data={barData}
          barWidth={barWidth}
          noOfSections={3}
          maxValue={maxVal * 1.2}
          height={200}
          overflowTop={24}
          initialSpacing={12}
          endSpacing={12}
          spacing={20}
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
          }}
          yAxisLabelTexts={[""]}
          hideYAxisText
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

  const maxVal = Math.max(...data.map((item) => Math.max(item.spent_amount, item.budget_amount)));
  const gridColor = theme.isDark ? "rgba(148,163,184,0.15)" : "rgba(15,23,42,0.06)";
  const borderColor = theme.isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.06)";
  const barWidth = 22;

  const barData = data.map((item) => ({
    value: item.spent_amount,
    label: item.category_name.length > 10 ? item.category_name.substring(0, 8) + ".." : item.category_name,
    frontColor: item.spent_amount > item.budget_amount ? theme.colors.error : theme.colors.primary,
    gradientColor: getGradientColor(
      item.spent_amount > item.budget_amount ? theme.colors.error : theme.colors.primary,
      theme.isDark,
    ),
    barBorderRadius: 6,
    topLabelComponent: () => (
      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: theme.colors.card, borderWidth: 1, borderColor }}>
        <Text style={{ fontSize: 10, fontWeight: "700", color: theme.colors.text }}>
          {Math.round(item.percentage)}%
        </Text>
      </View>
    ),
    topLabelContainerStyle: { alignItems: "center", marginBottom: 4, width: 44, left: -11 },
    topLabelComponentHeight: 22,
  }));

  return (
    <View style={[styles.chartWrapper, { height: 260 }]}>
      <Animated.View entering={FadeInUp.duration(500)}>
        <BarChart
          data={barData}
          barWidth={barWidth}
          noOfSections={3}
          maxValue={maxVal * 1.2}
          height={200}
          overflowTop={28}
          initialSpacing={12}
          endSpacing={12}
          spacing={18}
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
          }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartWrapper: {
    alignItems: "center",
    paddingVertical: 8,
    width: "100%",
  },
  emptyContainer: {
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
  legendContainer: {
    paddingHorizontal: 8,
    paddingTop: 12,
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  legendValue: {
    fontSize: 13,
    fontWeight: "600",
  },
});
