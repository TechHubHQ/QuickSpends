import React, { useMemo } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useTheme } from "../../theme/ThemeContext";
import { formatCurrencyCompact } from "../../utils/format";
import { ProjectionPoint } from "../../hooks/useFutureVision";

interface ProjectionChartProps {
  points: ProjectionPoint[];
  targetAmount: number;
  height?: number;
  scenarios?: { name: string; points: ProjectionPoint[]; color: string }[];
}

export const ProjectionChart: React.FC<ProjectionChartProps> = ({
  points,
  targetAmount,
  height = 190,
  scenarios,
}) => {
  const { theme } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.max(240, windowWidth - 96);

  const mainSeries = useMemo(() => {
    return points.map((p) => ({
      value: p.balance,
      label: p.label,
      dataPointText: p.isTarget ? "●" : undefined,
    }));
  }, [points]);

  const allSeries = useMemo(() => {
    if (!scenarios || scenarios.length === 0) return [mainSeries];
    return scenarios.map((s) =>
      s.points.map((p) => ({ value: p.balance, label: p.label }))
    );
  }, [mainSeries, scenarios]);

  const allValues = allSeries.flat().map((d) => d.value);
  const maxVal = Math.max(...allValues, targetAmount);
  const minVal = Math.min(...allValues, 0);
  const yPadding = (maxVal - minVal) * 0.15 || maxVal * 0.15 || 1000;

  const spacing =
    points.length > 1
      ? Math.max(30, Math.min(80, chartWidth / Math.max(points.length - 1, 1)))
      : 60;

  const visibleLabels = new Set<number>();
  if (points.length > 0) {
    visibleLabels.add(0);
    visibleLabels.add(points.length - 1);
    if (points.length > 4) {
      const step = Math.floor((points.length - 2) / 3);
      for (let i = step; i < points.length - 1; i += step) {
        visibleLabels.add(i);
      }
    }
  }

  const labeledData = mainSeries.map((d, i) => ({
    ...d,
    label: visibleLabels.has(i) ? d.label : "",
  }));

  const color = theme.colors.primary;

  return (
    <View>
      <LineChart
        data={labeledData}
        height={height}
        width={chartWidth}
        color={color}
        thickness={3}
        hideRules
        dataPointsColor={color}
        dataPointsRadius={4}
        hideYAxisText
        xAxisThickness={0}
        yAxisThickness={0}
        xAxisLabelTextStyle={{
          color: theme.colors.textSecondary,
          fontSize: 10,
          fontWeight: "600",
        }}
        xAxisLabelsVerticalShift={4}
        curved
        areaChart
        startFillColor={color}
        startOpacity={0.25}
        endFillColor={color}
        endOpacity={0.04}
        spacing={spacing}
        initialSpacing={20}
        endSpacing={20}
        disableScroll
        isAnimated
        animationDuration={1400}
        yAxisOffset={-yPadding * 0.2}
        maxValue={maxVal + yPadding}
        noOfSections={4}
        pointerConfig={{
          pointerStripColor: color,
          pointerStripWidth: 2,
          pointerStripHeight: height * 0.75,
          pointerColor: color,
          radius: 6,
          pointerLabelWidth: 130,
          pointerLabelHeight: "auto" as any,
          activatePointersOnLongPress: false,
          autoAdjustPointerLabelPosition: true,
          persistPointer: true,
          pointerVanishDelay: 6000,
          pointerLabelComponent: (items: any[]) => (
            <View
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 14,
                backgroundColor: theme.isDark ? "#1e293b" : "#ffffff",
                borderWidth: 1,
                borderColor: color + "30",
                alignItems: "center",
                ...theme.shadows.medium,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "800",
                  color: theme.colors.text,
                }}
              >
                {formatCurrencyCompact(items[0]?.value || 0)}
              </Text>
              {items[0]?.label ? (
                <Text
                  style={{
                    fontSize: 10,
                    color: theme.colors.textSecondary,
                    fontWeight: "600",
                    marginTop: 2,
                  }}
                >
                  {items[0].label}
                </Text>
              ) : null}
            </View>
          ),
        }}
      />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 28,
          marginTop: 10,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={{
              width: 14,
              height: 4,
              borderRadius: 2,
              backgroundColor: color,
            }}
          />
          <Text
            style={{
              fontSize: 11,
              color: theme.colors.textSecondary,
              fontWeight: "500",
            }}
          >
            Projected
          </Text>
        </View>
        {targetAmount > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 14,
                height: 2,
                borderRadius: 1,
                backgroundColor: theme.colors.textTertiary,
              }}
            />
            <Text
              style={{
                fontSize: 11,
                color: theme.colors.textSecondary,
                fontWeight: "500",
              }}
            >
              Target: {formatCurrencyCompact(targetAmount)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};