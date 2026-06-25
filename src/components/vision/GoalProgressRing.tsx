import React from "react";
import { Text, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { useTheme } from "../../theme/ThemeContext";

interface GoalProgressRingProps {
  current: number;
  target: number;
  size?: number;
  color?: string;
  showLabel?: boolean;
}

export const GoalProgressRing: React.FC<GoalProgressRingProps> = ({
  current,
  target,
  size = 100,
  color,
  showLabel = true,
}) => {
  const { theme } = useTheme();
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const percentage = Math.round(progress * 100);
  const fillColor = color || theme.colors.primary;

  const radius = size * 0.42;
  const innerRadius = radius * 0.7;

  const pieData = [
    { value: progress, color: fillColor, gradientCenterColor: fillColor + "cc" },
    { value: Math.max(1 - progress, 0.001), color: `${theme.colors.textTertiary}20` },
  ];

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <PieChart
        donut
        isAnimated
        animationDuration={1200}
        radius={radius}
        innerRadius={innerRadius}
        innerCircleColor={"transparent"}
        data={pieData}
        showGradient
        centerLabelComponent={() =>
          showLabel ? (
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: size * 0.18,
                  fontWeight: "800",
                  color: theme.colors.text,
                  letterSpacing: -1,
                }}
              >
                {percentage}%
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};
