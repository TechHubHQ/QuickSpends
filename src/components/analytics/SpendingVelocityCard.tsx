import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { SpendingVelocity } from "../../hooks/useAnalytics";
import { Theme } from "../../theme/theme";

interface SpendingVelocityCardProps {
    data: SpendingVelocity | null;
    loading?: boolean;
    theme: Theme;
    formatCurrency: (amount: number) => string;
}

export const SpendingVelocityCard: React.FC<SpendingVelocityCardProps> = ({
    data,
    loading,
    theme,
    formatCurrency,
}) => {
    const styles = createStyles(theme);

    if (loading || !data) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <MaterialCommunityIcons name="speedometer" size={20} color={theme.colors.primary} />
                    <Text style={styles.title}>Spending Velocity</Text>
                </View>
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="chart-line" size={48} color={theme.colors.textTertiary} />
                    <Text style={styles.emptyText}>{loading ? "Calculating..." : "Not enough data"}</Text>
                </View>
            </View>
        );
    }

    const getStatusConfig = () => {
        switch (data.status) {
            case "ahead":
                return {
                    icon: "trending-up" as const,
                    color: theme.colors.error,
                    label: "Spending Faster",
                    gradient: ["#F43F5E", "#EC4899"] as [string, string],
                    message: `You're spending ${((data.currentSpend / data.averageSpend - 1) * 100).toFixed(0)}% faster than usual`,
                };
            case "behind":
                return {
                    icon: "trending-down" as const,
                    color: theme.colors.success,
                    label: "Under Budget",
                    gradient: ["#10B981", "#14B8A6"] as [string, string],
                    message: `Great! You're ${((1 - data.currentSpend / data.averageSpend) * 100).toFixed(0)}% below your average pace`,
                };
            default:
                return {
                    icon: "trending-neutral" as const,
                    color: theme.colors.primary,
                    label: "On Track",
                    gradient: ["#6366F1", "#8B5CF6"] as [string, string],
                    message: "Your spending is consistent with your usual habits",
                };
        }
    };

    const statusConfig = getStatusConfig();
    const progressPercent = Math.min((data.currentSpend / data.averageSpend) * 100, 150);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <LinearGradient
                        colors={statusConfig.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconBadge}
                    >
                        <MaterialCommunityIcons name="speedometer" size={18} color="#FFF" />
                    </LinearGradient>
                    <Text style={styles.title}>Spending Velocity</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + "20" }]}>
                    <MaterialCommunityIcons name={statusConfig.icon} size={14} color={statusConfig.color} />
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                        {statusConfig.label}
                    </Text>
                </View>
            </View>

            <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.mainContent}>
                {/* Velocity Gauge */}
                <View style={styles.gaugeContainer}>
                    <View style={styles.gaugeBackground}>
                        <LinearGradient
                            colors={statusConfig.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.gaugeFill, { width: `${Math.min(progressPercent, 100)}%` }]}
                        />
                        {/* Threshold Markers */}
                        <View style={[styles.thresholdMarker, { left: "50%" }]}>
                            <View style={styles.thresholdLine} />
                        </View>
                        <View style={[styles.thresholdMarker, { left: "80%" }]}>
                            <View style={[styles.thresholdLine, { backgroundColor: theme.colors.warning }]} />
                        </View>
                        <View style={[styles.thresholdMarker, { left: "100%" }]}>
                            <View style={[styles.thresholdLine, { backgroundColor: theme.colors.error }]} />
                        </View>
                    </View>
                    <View style={styles.gaugeLabels}>
                        <Text style={styles.gaugeLabel}>0%</Text>
                        <Text style={styles.gaugeLabel}>50%</Text>
                        <Text style={styles.gaugeLabel}>80%</Text>
                        <Text style={styles.gaugeLabel}>100%</Text>
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <Animated.View entering={FadeIn.delay(200)} style={styles.statCard}>
                        <Text style={styles.statLabel}>Current Spend</Text>
                        <Text style={[styles.statValue, { color: statusConfig.color }]}>
                            {formatCurrency(data.currentSpend)}
                        </Text>
                    </Animated.View>
                    <View style={styles.statDivider} />
                    <Animated.View entering={FadeIn.delay(300)} style={styles.statCard}>
                        <Text style={styles.statLabel}>Avg. by Now</Text>
                        <Text style={styles.statValue}>{formatCurrency(data.averageSpend)}</Text>
                    </Animated.View>
                </View>

                {/* Message */}
                <View style={styles.messageContainer}>
                    <MaterialCommunityIcons name="information-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.messageText}>{statusConfig.message}</Text>
                </View>

                {/* Projected Overspend Warning */}
                {data.status === "ahead" && data.projectedOverspend > 0 && (
                    <Animated.View entering={FadeInUp.delay(400)} style={styles.warningBanner}>
                        <LinearGradient
                            colors={["#FEF3C7", "#FDE68A"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.warningGradient}
                        >
                            <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#D97706" />
                            <View style={styles.warningContent}>
                                <Text style={styles.warningTitle}>Projected Overspend</Text>
                                <Text style={styles.warningAmount}>
                                    +{formatCurrency(data.projectedOverspend)} by month end
                                </Text>
                            </View>
                        </LinearGradient>
                    </Animated.View>
                )}

                {/* Info Legend */}
                <View style={styles.legendContainer}>
                    <Text style={styles.legendTitle}>How it works</Text>
                    <View style={styles.legendItems}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
                            <Text style={styles.legendText}>Under 80%: On track or under budget</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: theme.colors.warning }]} />
                            <Text style={styles.legendText}>80-100%: Approaching your average</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: theme.colors.error }]} />
                            <Text style={styles.legendText}>Over 100%: Spending faster than usual</Text>
                        </View>
                    </View>
                    <Text style={styles.legendNote}>
                        Compared to your 3-month average spending at this point in the month
                    </Text>
                </View>
            </Animated.View>
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
            justifyContent: "center",
            alignItems: "center",
        },
        title: {
            fontSize: 18,
            fontWeight: "700",
            color: theme.colors.text,
        },
        statusBadge: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 20,
            gap: 4,
        },
        statusText: {
            fontSize: 12,
            fontWeight: "600",
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
        mainContent: {
            gap: 20,
        },
        gaugeContainer: {
            gap: 8,
        },
        gaugeBackground: {
            height: 12,
            backgroundColor: theme.colors.backgroundSecondary,
            borderRadius: 6,
            overflow: "hidden",
            position: "relative",
        },
        gaugeFill: {
            height: "100%",
            borderRadius: 6,
        },
        thresholdMarker: {
            position: "absolute",
            top: 0,
            bottom: 0,
            width: 2,
            justifyContent: "center",
        },
        thresholdLine: {
            width: 2,
            height: "100%",
            backgroundColor: theme.colors.textTertiary,
            opacity: 0.5,
        },
        gaugeLabels: {
            flexDirection: "row",
            justifyContent: "space-between",
        },
        gaugeLabel: {
            fontSize: 10,
            color: theme.colors.textTertiary,
            fontWeight: "500",
        },
        statsRow: {
            flexDirection: "row",
            backgroundColor: theme.colors.backgroundSecondary,
            borderRadius: 16,
            padding: 16,
        },
        statCard: {
            flex: 1,
            alignItems: "center",
            gap: 4,
        },
        statDivider: {
            width: 1,
            backgroundColor: theme.colors.border,
            marginHorizontal: 16,
        },
        statLabel: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            fontWeight: "500",
        },
        statValue: {
            fontSize: 20,
            fontWeight: "800",
            color: theme.colors.text,
            fontVariant: ["tabular-nums"],
        },
        messageContainer: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 4,
        },
        messageText: {
            flex: 1,
            fontSize: 13,
            color: theme.colors.textSecondary,
            lineHeight: 18,
        },
        warningBanner: {
            borderRadius: 12,
            overflow: "hidden",
        },
        warningGradient: {
            flexDirection: "row",
            alignItems: "center",
            padding: 14,
            gap: 12,
        },
        warningContent: {
            flex: 1,
        },
        warningTitle: {
            fontSize: 13,
            fontWeight: "600",
            color: "#92400E",
        },
        warningAmount: {
            fontSize: 15,
            fontWeight: "700",
            color: "#B45309",
        },
        legendContainer: {
            backgroundColor: theme.colors.backgroundSecondary,
            borderRadius: 12,
            padding: 14,
            gap: 10,
        },
        legendTitle: {
            fontSize: 12,
            fontWeight: "600",
            color: theme.colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 0.5,
        },
        legendItems: {
            gap: 8,
        },
        legendItem: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
        },
        legendDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
        },
        legendText: {
            fontSize: 12,
            color: theme.colors.text,
        },
        legendNote: {
            fontSize: 11,
            color: theme.colors.textTertiary,
            fontStyle: "italic",
            marginTop: 4,
        },
    });

export default SpendingVelocityCard;
