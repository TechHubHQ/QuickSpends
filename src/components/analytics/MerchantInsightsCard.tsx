import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { MerchantSpending } from "../../hooks/useAnalytics";
import { Theme } from "../../theme/theme";

interface MerchantInsightsCardProps {
  data: MerchantSpending[];
  loading?: boolean;
  theme: Theme;
  formatCurrency: (amount: number) => string;
  onMerchantPress?: (merchant: MerchantSpending) => void;
  onAmountPress?: (merchant: MerchantSpending) => void;
}

export const MerchantInsightsCard: React.FC<MerchantInsightsCardProps> = ({
  data,
  loading,
  theme,
  formatCurrency,
  onMerchantPress,
  onAmountPress,
}) => {
  const styles = createStyles(theme);

  if (loading || data.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="store"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.title}>Top Merchants</Text>
        </View>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="store-search"
            size={48}
            color={theme.colors.textTertiary}
          />
          <Text style={styles.emptyText}>
            {loading ? "Loading..." : "No merchant data available"}
          </Text>
        </View>
      </View>
    );
  }

  const gradientColors = [
    ["#6366F1", "#8B5CF6"],
    ["#EC4899", "#F43F5E"],
    ["#10B981", "#14B8A6"],
    ["#F59E0B", "#EAB308"],
    ["#3B82F6", "#06B6D4"],
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons name="store" size={18} color="#FFF" />
          </View>
          <Text style={styles.title}>Top Merchants</Text>
        </View>
        <Text style={styles.subtitle}>Where your money goes</Text>
      </View>

      <View style={styles.merchantList}>
        {data.map((merchant, index) => (
          <Animated.View
            key={merchant.merchant_name}
            entering={FadeInRight.delay(index * 100).springify()}
          >
            <View style={styles.merchantItem}>
              <Pressable
                onPress={() => onMerchantPress?.(merchant)}
                style={({ pressed }) => [
                  styles.leftArea,
                  pressed && styles.merchantItemPressed,
                ]}
              >
                <LinearGradient
                  colors={gradientColors[index % gradientColors.length] as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.rankBadge}
                >
                  <Text style={styles.rankText}>{index + 1}</Text>
                </LinearGradient>

                <View style={styles.merchantInfo}>
                  <Text style={styles.merchantName} numberOfLines={1}>
                    {merchant.merchant_name}
                  </Text>
                  <View style={styles.merchantMeta}>
                    <Text style={styles.transactionCount}>
                      {merchant.count} transaction
                      {merchant.count > 1 ? "s" : ""}
                    </Text>
                    <View style={styles.percentagePill}>
                      <Text style={styles.percentageText}>
                        {merchant.percentage.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>

              <Pressable
                onPress={() => onAmountPress?.(merchant)}
                hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
                style={({ pressed }) =>
                  [
                    styles.amountContainer,
                    { opacity: pressed ? 0.7 : 1 },
                  ] as any
                }
              >
                <Text style={styles.amount}>
                  {formatCurrency(merchant.total)}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={18}
                  color={theme.colors.textTertiary}
                />
              </Pressable>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginHorizontal: theme.spacing.l,
      marginBottom: theme.spacing.l,
      padding: theme.spacing.l,
      borderRadius: 24,
      backgroundColor: theme.colors.card,
      ...theme.shadows.medium,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.l,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    iconBadge: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: "500",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: theme.spacing.xl,
      gap: 12,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.textTertiary,
    },
    merchantList: {
      gap: 12,
    },
    merchantItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: 16,
      padding: 14,
      gap: 14,
    },
    leftArea: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      flex: 1,
    },
    merchantItemPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
    rankBadge: {
      width: 36,
      height: 36,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    rankText: {
      fontSize: 16,
      fontWeight: "800",
      color: "#FFFFFF",
    },
    merchantInfo: {
      flex: 1,
      gap: 4,
    },
    merchantName: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.colors.text,
    },
    merchantMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    transactionCount: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    percentagePill: {
      backgroundColor: theme.colors.primary + "20",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 20,
    },
    percentageText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    amountContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    amount: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.colors.text,
      fontVariant: ["tabular-nums"],
    },
  });

export default MerchantInsightsCard;
