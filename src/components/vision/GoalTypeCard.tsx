import React from "react";
import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { GoalType, GOAL_TYPE_META } from "../../hooks/useFutureVision";

interface GoalTypeCardProps {
  type: GoalType;
  isSelected: boolean;
  onSelect: (type: GoalType) => void;
}

export const GoalTypeCard: React.FC<GoalTypeCardProps> = ({ type, isSelected, onSelect }) => {
  const { theme } = useTheme();
  const meta = GOAL_TYPE_META[type];

  return (
    <Pressable
      onPress={() => onSelect(type)}
      style={{
        width: "45%",
        aspectRatio: 1.2,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: isSelected ? meta.color : theme.colors.border,
        backgroundColor: isSelected ? theme.colors.card : theme.colors.backgroundSecondary,
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        ...((isSelected ? theme.shadows.medium : {}) as any),
      }}
    >
      <LinearGradient
        colors={[`${meta.color}25`, `${meta.color}10`]}
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <MaterialCommunityIcons
          name={meta.icon as any}
          size={26}
          color={meta.color}
        />
      </LinearGradient>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "700",
          color: theme.colors.text,
          textAlign: "center",
        }}
        numberOfLines={1}
      >
        {meta.label}
      </Text>
      <Text
        style={{
          fontSize: 10,
          color: theme.colors.textSecondary,
          textAlign: "center",
          marginTop: 3,
        }}
        numberOfLines={1}
      >
        {meta.description}
      </Text>
    </Pressable>
  );
};
