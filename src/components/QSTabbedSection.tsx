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
}

export const QSTabbedSection: React.FC<QSTabbedSectionProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  const { theme } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        flexDirection: "row",
        paddingHorizontal: theme.spacing.m,
        gap: theme.spacing.xs,
      }}
      style={{
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
            style={{
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
              style={{
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
