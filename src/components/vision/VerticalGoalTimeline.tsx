import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { ProjectionPoint } from "../../hooks/useFutureVision";
import { Theme } from "../../theme/theme";
import { useTheme } from "../../theme/ThemeContext";
import { formatCurrencyCompact } from "../../utils/format";

interface Milestone {
  point: ProjectionPoint;
  label: string;
  type: "current" | "milestone" | "goal";
  threshold: number;
}

interface VerticalGoalTimelineProps {
  points: ProjectionPoint[];
  targetAmount: number;
  currentAmount: number;
  monthlyAllocation: number;
  color: string;
}

function extractMilestones(
  points: ProjectionPoint[],
  targetAmount: number
): Milestone[] {
  if (points.length === 0) return [];

  const result: Milestone[] = [];
  const addedMonths = new Set<string>();

  result.push({
    point: points[0],
    label: "Current",
    type: "current",
    threshold: targetAmount > 0 ? (points[0].balance / targetAmount) * 100 : 0,
  });
  addedMonths.add(points[0].month);

  const thresholds = [0.25, 0.5, 0.75, 1.0];
  for (const threshold of thresholds) {
    const thresholdAmount = targetAmount * threshold;
    const crossing = points.find(
      (p) => p.balance >= thresholdAmount && !addedMonths.has(p.month)
    );
    if (crossing) {
      addedMonths.add(crossing.month);
      result.push({
        point: crossing,
        label: threshold === 1 ? "Goal!" : `${Math.round(threshold * 100)}%`,
        type: threshold === 1 ? "goal" : "milestone",
        threshold: threshold * 100,
      });
    }
  }

  return result;
}

const TimelineNode: React.FC<{
  milestone: Milestone;
  color: string;
  isLast: boolean;
  theme: Theme;
  index: number;
  monthlyAllocation: number;
}> = ({ milestone, color, isLast, theme, index, monthlyAllocation }) => {
  const isGoal = milestone.type === "goal";
  const isCurrent = milestone.type === "current";
  const nodeColor = isGoal ? "#22c55e" : isCurrent ? theme.colors.primary : color;
  const nodeSize = isGoal ? 28 : isCurrent ? 24 : 20;
  const iconName = isGoal
    ? "flag-checkered"
    : isCurrent
      ? "circle-slice-8"
      : "circle-medium";

  return (
    <Animated.View
      entering={FadeInUp.delay(150 + index * 120).springify()}
      style={{ flexDirection: "row", minHeight: isLast ? 50 : 110 }}
    >
      <View style={{ width: 48, alignItems: "center", position: "relative" }}>
        {!isLast && (
          <View
            style={{
              position: "absolute",
              top: nodeSize / 2,
              bottom: 0,
              width: 2.5,
              backgroundColor: `${nodeColor}30`,
              zIndex: 0,
            }}
          />
        )}
        <View
          style={{
            width: nodeSize,
            height: nodeSize,
            borderRadius: nodeSize / 2,
            backgroundColor: nodeColor,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
            ...theme.shadows.small,
          }}
        >
          <MaterialCommunityIcons
            name={iconName as any}
            size={isGoal ? 14 : isCurrent ? 14 : 10}
            color="#ffffff"
          />
        </View>
      </View>

      <View style={{ flex: 1, paddingLeft: 8, paddingBottom: isLast ? 0 : 8 }}>
        <LinearGradient
          colors={
            isGoal
              ? ["#22c55e18", "#22c55e08"]
              : isCurrent
                ? [`${theme.colors.primary}12`, `${theme.colors.primary}05`]
                : [`${color}18`, `${color}08`]
          }
          style={{
            borderRadius: 18,
            padding: 14,
            borderWidth: 1,
            borderColor: isGoal
              ? "#22c55e25"
              : isCurrent
                ? `${theme.colors.primary}15`
                : `${color}20`,
            marginRight: 4,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "800",
                  color: isGoal ? "#22c55e" : isCurrent ? theme.colors.primary : color,
                }}
              >
                {milestone.label}
              </Text>
              {isGoal && (
                <MaterialCommunityIcons name="party-popper" size={16} color="#22c55e" />
              )}
            </View>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: theme.colors.textTertiary,
              }}
            >
              {milestone.point.label || milestone.point.month}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 20, marginTop: 10 }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: theme.colors.textSecondary,
                  marginBottom: 2,
                }}
              >
                Balance
              </Text>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "800",
                  color: theme.colors.text,
                }}
              >
                {formatCurrencyCompact(milestone.point.balance)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: theme.colors.textSecondary,
                  marginBottom: 2,
                }}
              >
                {isGoal ? "Interest" : "Contributed"}
              </Text>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "800",
                  color: isGoal ? "#22c55e" : theme.colors.text,
                }}
              >
                {formatCurrencyCompact(
                  isGoal
                    ? milestone.point.interestEarned
                    : milestone.point.contributed
                )}
              </Text>
            </View>
          </View>

          {isCurrent && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginTop: 8,
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
              }}
            >
              <MaterialCommunityIcons
                name="calendar-clock"
                size={13}
                color={theme.colors.textTertiary}
              />
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.textTertiary,
                  fontWeight: "500",
                }}
              >
                {`${formatCurrencyCompact(monthlyAllocation)}/mo allocation`}
              </Text>
            </View>
          )}

          {isGoal && (
            <LinearGradient
              colors={["#22c55e", "#16a34a"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                marginTop: 10,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 10,
                alignSelf: "flex-start",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: "#ffffff",
                }}
              >
                TARGET ACHIEVED
              </Text>
            </LinearGradient>
          )}
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

export const VerticalGoalTimeline: React.FC<VerticalGoalTimelineProps> = ({
  points,
  targetAmount,
  currentAmount,
  monthlyAllocation,
  color,
}) => {
  const { theme } = useTheme();
  const milestones = useMemo(
    () => extractMilestones(points, targetAmount),
    [points, targetAmount]
  );

  if (milestones.length === 0) return null;

  return (
    <Animated.View
      entering={FadeInDown.delay(250).springify()}
      style={{
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 8,
        borderRadius: 24,
        padding: 20,
        backgroundColor: theme.colors.card,
        ...theme.shadows.medium,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <LinearGradient
          colors={[`${color}25`, `${color}08`]}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons
            name="road-variant"
            size={20}
            color={color}
          />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: theme.colors.text,
            }}
          >
            Goal Journey
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.textSecondary,
              marginTop: 2,
              fontWeight: "500",
            }}
          >
            {milestones.length - 1} milestone{milestones.length > 2 ? "s" : ""} to reach your target
          </Text>
        </View>
      </View>

      <View style={{ paddingLeft: 4 }}>
        {milestones.map((ms, idx) => (
          <TimelineNode
            key={`${ms.point.month}-${idx}`}
            milestone={ms}
            color={color}
            isLast={idx === milestones.length - 1}
            theme={theme}
            index={idx}
            monthlyAllocation={monthlyAllocation}
          />
        ))}
      </View>
    </Animated.View>
  );
};
