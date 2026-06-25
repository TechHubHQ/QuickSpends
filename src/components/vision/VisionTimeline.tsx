import React from "react";
import { ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../theme/ThemeContext";

interface TimelineGoal {
  id: string;
  name: string;
  goalType: string;
  targetAmount: number;
  projectedDate: string;
  progress: number;
  color: string;
}

interface VisionTimelineProps {
  goals: TimelineGoal[];
  now: string;
}

export const VisionTimeline: React.FC<VisionTimelineProps> = ({ goals, now }) => {
  const { theme } = useTheme();

  if (goals.length === 0) return null;

  return (
    <View style={{ paddingVertical: 8 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 0, alignItems: "center" }}
      >
        <View style={{ alignItems: "center", marginRight: 6, width: 48 }}>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: theme.colors.primary,
              borderWidth: 4,
              borderColor: theme.colors.background,
              marginBottom: 8,
              ...theme.shadows.medium,
            }}
          />
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              color: theme.colors.primary,
              textAlign: "center",
              letterSpacing: 0.5,
            }}
          >
            NOW
          </Text>
        </View>

        <View
          style={{
            height: 3,
            backgroundColor: `${theme.colors.primary}30`,
            flex: 1,
            alignSelf: "center",
            minWidth: 16,
            borderRadius: 2,
          }}
        />

        {goals.map((goal, idx) => (
          <React.Fragment key={goal.id}>
            <View style={{ alignItems: "center", marginHorizontal: 6, width: 100 }}>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: goal.color || theme.colors.success,
                  borderWidth: 3,
                  borderColor: theme.colors.card,
                  marginBottom: 10,
                  opacity: goal.progress >= 100 ? 1 : 0.7,
                  ...theme.shadows.small,
                }}
              />
              <LinearGradient
                colors={[theme.colors.card, theme.colors.backgroundSecondary]}
                style={{
                  borderRadius: 16,
                  padding: 10,
                  width: 100,
                  borderWidth: 1,
                  borderColor: `${goal.color}20`,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: theme.colors.text,
                    textAlign: "center",
                  }}
                  numberOfLines={1}
                >
                  {goal.name}
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    color: goal.color || theme.colors.success,
                    fontWeight: "600",
                    textAlign: "center",
                    marginTop: 3,
                  }}
                >
                  {goal.projectedDate}
                </Text>
                <View
                  style={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: theme.colors.backgroundSecondary,
                    marginTop: 6,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: `${Math.min(goal.progress, 100)}%`,
                      height: "100%",
                      backgroundColor: goal.color || theme.colors.success,
                      borderRadius: 2,
                    }}
                  />
                </View>
              </LinearGradient>
            </View>
            {idx < goals.length - 1 && (
              <View
                style={{
                  height: 3,
                  backgroundColor: `${theme.colors.primary}20`,
                  flex: 1,
                  alignSelf: "center",
                  minWidth: 12,
                  borderRadius: 2,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
};