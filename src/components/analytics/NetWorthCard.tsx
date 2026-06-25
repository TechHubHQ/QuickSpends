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
  const [containerWidth, setContainerWidth] = useState(fallbackWidth);
  const [pointerResetKey, setPointerResetKey] = useState(0);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  const resetPointer = () => {
    setPointerResetKey((prev) => prev + 1);
    setActivePointIndex(null);
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (Number.isFinite(width) && width > 0) {
      setContainerWidth(width);
    }
  };

  if (!data && !loading) return null;

  const chartData =
    data?.history?.map((point, idx) => {
      const numericValue = Number(point.value);
      return {
        value: Number.isFinite(numericValue) ? numericValue : 0,
        label: point.label,
        index: idx,
      };
    }) || [];

  const MIN_LABEL_WIDTH = 48;
  const safeContainerWidth =
    Number.isFinite(containerWidth) && containerWidth > 0
      ? containerWidth
      : fallbackWidth;
  const chartWidth = Math.max(
    safeContainerWidth - CARD_HORIZONTAL_PADDING * 2,
    240,
  );

  const maxVisibleLabels = Math.max(
    2,
    Math.floor((chartWidth - 40) / MIN_LABEL_WIDTH),
  );

  const visibleLabelIndices = new Set<number>();
  if (chartData.length > 0) {
    visibleLabelIndices.add(0);
    if (chartData.length > 1) visibleLabelIndices.add(chartData.length - 1);
    if (chartData.length > 4) {
      const mid = Math.floor(chartData.length / 2);
      visibleLabelIndices.add(mid);
    }
  }

  const chartDataForRender = chartData.map((d, i) => ({
    ...d,
    label: visibleLabelIndices.has(i) ? d.label : "",
  }));

  const values = chartDataForRender.map((d) => d.value);
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 1000;
  const padding = (maxValue - minValue) * 0.3 || 1000;

  const currentNetWorth = data?.netWorth || 0;
  const assets = data?.totalAssets || 0;
  const liabilities = data?.totalLiabilities || 0;
  const trend = data?.trend || "stable";
  const changePercentage = data?.changePercentage || 0;

  const isPositive = currentNetWorth >= 0;
  const primaryColor = isPositive ? theme.colors.success : theme.colors.error;
  const gradientColors = isPositive
    ? [theme.colors.success, theme.colors.primary]
    : [theme.colors.error, theme.colors.warning];

  const edgeInset = Math.max(16, Math.round(chartWidth * 0.05));
  const initialSpacing = edgeInset;
  const computedEndSpacing = edgeInset;
  const spacing =
    (chartWidth - initialSpacing - computedEndSpacing) /
    Math.max(1, chartDataForRender.length - 1);

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
        <View>
          <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
            Net Worth
          </Text>
          <Text
            style={[
              styles.netWorthValue,
              { color: currentNetWorth >= 0 ? theme.colors.success : theme.colors.error },
            ]}
          >
            {formatCurrency(currentNetWorth)}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {trend !== "stable" && (
            <LinearGradient
              colors={
                trend === "up"
                  ? [theme.colors.success + "20", theme.colors.success + "40"]
                  : [theme.colors.error + "20", theme.colors.error + "40"]
              }
              style={styles.percentBadge}
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
            </LinearGradient>
          )}
          <Text style={[styles.resetText, { color: theme.colors.textSecondary }]}>
            Reset
          </Text>
        </View>
      </Pressable>

      <View style={styles.chartWrapper}>
        <LineChart
          key={`networth-chart-${pointerResetKey}`}
          data={chartDataForRender}
          height={150}
          width={chartWidth}
          color={primaryColor}
          thickness={3}
          hideRules
          hideDataPoints={false}
          dataPointsColor={primaryColor}
          dataPointsRadius={Math.max(
            3,
            Math.min(6, Math.round((containerWidth || 320) / 80)),
          )}
          focusedDataPointColor={theme.colors.card}
          focusedDataPointRadius={8}
          showDataPointOnFocus
          showStripOnFocus
          stripHeight={160}
          stripWidth={2}
          stripColor={primaryColor}
          stripOpacity={0.3}
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
          endSpacing={computedEndSpacing}
          disableScroll
          isAnimated
          animationDuration={1200}
          areaChart
          startFillColor={primaryColor}
          startOpacity={0.25}
          endFillColor={primaryColor}
          endOpacity={0.02}
          pointerConfig={{
            pointerStripColor: primaryColor,
            pointerStripWidth: 2,
            pointerStripHeight: 130,
            pointerColor: primaryColor,
            radius: 6,
            pointerLabelWidth: 120,
            pointerLabelHeight: 60,
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: true,
            persistPointer: true,
            pointerVanishDelay: 5000,
            pointerLabelComponent: (items: any) => {
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
                      borderColor: primaryColor + "40",
                      ...Platform.select({
                        ios: {
                          shadowColor: primaryColor,
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
                      styles.pointerLabelText,
                      { color: theme.colors.text },
                    ]}
                  >
                    {formatCurrency(items[0].value)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: theme.colors.textSecondary,
                      textAlign: "center",
                      fontWeight: "500",
                    }}
                  >
                    {items[0]?.label || ""}
                  </Text>
                </LinearGradient>
              );
            },
          }}
          yAxisOffset={-(maxValue * 0.2)}
        />

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
                        left: Math.min(
                          Math.max(
                            15,
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

      <View style={styles.statsRow}>
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    paddingTop: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    minWidth: 100,
    backdropFilter: "blur(10px)",
  },
  pointerLabelText: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
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
    width: 48,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
  },
});

export default NetWorthCard;
