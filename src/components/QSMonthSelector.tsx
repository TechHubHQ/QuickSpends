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
        gap: theme.spacing.l,
      }}
    >
      <Pressable
        onPress={onPrev}
        style={({ pressed }) => ({
          opacity: pressed ? 0.6 : 1,
          padding: theme.spacing.s,
        })}
      >
        <MaterialCommunityIcons
          name="chevron-left"
          size={28}
          color={theme.colors.text}
        />
      </Pressable>

      <Text
        style={{
          fontSize: theme.typography.h2.fontSize,
          fontWeight: theme.typography.h2.fontWeight,
          color: theme.colors.text,
          minWidth: 180,
          textAlign: "center",
        }}
      >
        {monthName}
      </Text>

      <Pressable
        onPress={onNext}
        style={({ pressed }) => ({
          opacity: pressed ? 0.6 : 1,
          padding: theme.spacing.s,
        })}
      >
        <MaterialCommunityIcons
          name="chevron-right"
          size={28}
          color={theme.colors.text}
        />
      </Pressable>

      {isCurrentMonth && (
        <View
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.s,
            paddingHorizontal: 8,
            paddingVertical: 2,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              color: theme.colors.onPrimary,
              fontWeight: "700",
              textTransform: "uppercase",
            }}
          >
            Now
          </Text>
        </View>
      )}
    </View>
  );
};
