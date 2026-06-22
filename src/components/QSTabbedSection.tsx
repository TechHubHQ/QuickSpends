import React, { useRef } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

interface Tab {
  key: string;
  label: string;
  icon?: string;
  badge?: number;
}

interface QSTabbedSectionProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  variant?: "underline" | "pill" | "segmented";
}

export const QSTabbedSection: React.FC<QSTabbedSectionProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = "underline",
}) => {
  const { theme } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  if (variant === "segmented") {
    return (
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: theme.spacing.m,
          marginVertical: theme.spacing.s,
          backgroundColor: theme.colors.backgroundSecondary,
          borderRadius: 14,
          padding: 4,
          gap: 4,
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: "center",
                borderRadius: 11,
                backgroundColor: isActive ? theme.colors.primary : "transparent",
                ...(isActive ? theme.shadows.small : {}),
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? "700" : "600",
                  color: isActive ? "#FFFFFF" : theme.colors.textSecondary,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  const isPill = variant === "pill";

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        flexDirection: "row",
        paddingHorizontal: theme.spacing.m,
        gap: isPill ? theme.spacing.s : theme.spacing.xs,
      }}
      style={isPill ? undefined : {
        borderBottomWidth: 1,
        borderBottomColor: `${theme.colors.textTertiary}30`,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            style={isPill ? {
              paddingVertical: theme.spacing.xs + 2,
              paddingHorizontal: theme.spacing.s + 4,
              borderRadius: 16,
              backgroundColor: isActive ? `${theme.colors.primary}15` : "transparent",
              borderWidth: 1,
              borderColor: isActive ? `${theme.colors.primary}30` : "transparent",
              opacity: isActive ? 1 : 0.6,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            } : {
              paddingVertical: theme.spacing.m,
              paddingHorizontal: theme.spacing.m,
              borderBottomWidth: 2.5,
              borderBottomColor: isActive ? theme.colors.primary : "transparent",
              opacity: isActive ? 1 : 0.6,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Text
              style={isPill ? {
                fontSize: 13,
                fontWeight: isActive ? "700" : "500",
                color: isActive ? theme.colors.primary : theme.colors.textTertiary,
              } : {
                fontSize: theme.typography.bodySmall.fontSize,
                fontWeight: isActive ? "700" : "500",
                color: isActive ? theme.colors.primary : theme.colors.textSecondary,
              }}
            >
              {tab.label}
            </Text>
            {tab.badge !== undefined && tab.badge > 0 && (
              <View
                style={{
                  backgroundColor: theme.colors.error,
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.colors.onPrimary,
                    fontWeight: "700",
                  }}
                >
                  {tab.badge > 99 ? "99+" : tab.badge}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
};
