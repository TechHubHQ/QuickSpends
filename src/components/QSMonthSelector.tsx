import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

interface QSMonthSelectorProps {
  month: Date;
  onPrev: () => void;
  onNext: () => void;
}

export const QSMonthSelector: React.FC<QSMonthSelectorProps> = ({
  month,
  onPrev,
  onNext,
}) => {
  const { theme } = useTheme();

  const monthName = month.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const isCurrentMonth = (() => {
    const now = new Date();
    return (
      month.getMonth() === now.getMonth() &&
      month.getFullYear() === now.getFullYear()
    );
  })();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: theme.spacing.m,
        gap: theme.spacing.s,
        paddingHorizontal: theme.spacing.m,
      }}
    >
      <Pressable
        onPress={onPrev}
        style={({ pressed }) => ({
          opacity: pressed ? 0.6 : 1,
          padding: theme.spacing.s,
          backgroundColor: theme.colors.backgroundSecondary,
          borderRadius: theme.borderRadius.m,
        })}
      >
        <MaterialCommunityIcons
          name="chevron-left"
          size={24}
          color={theme.colors.text}
        />
      </Pressable>

      <View style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.s,
        flex: 1,
        justifyContent: "center",
      }}>
        <Text
          style={{
            fontSize: theme.typography.h2.fontSize,
            fontWeight: theme.typography.h2.fontWeight,
            color: theme.colors.text,
            textAlign: "center",
          }}
        >
          {monthName}
        </Text>

        {isCurrentMonth && (
          <View
            style={{
              backgroundColor: theme.colors.primary,
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 3,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                color: theme.colors.onPrimary,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Now
            </Text>
          </View>
        )}
      </View>

      <Pressable
        onPress={onNext}
        style={({ pressed }) => ({
          opacity: pressed ? 0.6 : 1,
          padding: theme.spacing.s,
          backgroundColor: theme.colors.backgroundSecondary,
          borderRadius: theme.borderRadius.m,
        })}
      >
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={theme.colors.text}
        />
      </Pressable>
    </View>
  );
};
