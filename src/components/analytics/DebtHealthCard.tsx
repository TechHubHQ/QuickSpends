import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { DebtHealth } from "../../hooks/useAnalytics";
import { Theme } from "../../theme/theme";

interface DebtHealthCardProps {
    data: DebtHealth | null;
    loading?: boolean;
    theme: Theme;
    formatCurrency: (amount: number) => string;
}

export const DebtHealthCard: React.FC<DebtHealthCardProps> = ({
    data,
    loading,
    theme,
    formatCurrency,
}) => {
    const styles = createStyles(theme);

    if (loading || !data || data.totalDebt === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <MaterialCommunityIcons name="shield-check" size={20} color={theme.colors.primary} />
                    <Text style={styles.title}>Debt Health</Text>
                </View>
                <View style={styles.emptyState}>
                    <LinearGradient
                        colors={[theme.colors.success + "30", theme.colors.primary + "20"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.celebrationIcon}
                    >
                        <MaterialCommunityIcons name="party-popper" size={36} color={theme.colors.success} />
                    </LinearGradient>
                    <Text style={styles.emptyTitle}>
                        {loading ? "Loading..." : "Debt Free!"}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {loading ? "" : "You have no active borrowed loans"}
                    </Text>
                </View>
            </View>
        );
    }

    const remainingDebt = data.totalDebt - data.paidAmount;
    const progressPercent = Math.min(data.progress, 100);

    const getProgressColor = () => {
        if (progressPercent >= 75) return theme.colors.success;
        if (progressPercent >= 50) return theme.colors.primary;
        if (progressPercent >= 25) return theme.colors.warning;
        return theme.colors.error;
    };

    const progressColor = getProgressColor();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <LinearGradient
                        colors={["#10B981", "#059669"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconBadge}
                    >
                        <MaterialCommunityIcons name="shield-check" size={18} color="#FFF" />
                    </LinearGradient>
                    <Text style={styles.title}>Debt Health</Text>
                </View>
                <View style={[styles.progressBadge, { backgroundColor: progressColor + "20" }]}>
                    <Text style={[styles.progressText, { color: progressColor }]}>
                        {progressPercent.toFixed(0)}% Paid
                    </Text>
                </View>
            </View>

            {/* Main Progress Circle */}
            <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.progressSection}>
                <View style={styles.circleContainer}>
                    {/* Background Circle */}
                    <View style={styles.circleBackground}>
                        {/* Progress Arc - Simulated with a conic gradient effect */}
                        <View style={[styles.circleFill, {
                            borderColor: progressColor,
                            borderWidth: 8,
                        }]}>
                            <View style={styles.circleInner}>
                                <Text style={styles.progressAmount}>{formatCurrency(data.paidAmount)}</Text>
                                <Text style={styles.progressLabel}>Paid so far</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <Animated.View entering={FadeIn.delay(200)} style={styles.statRow}>
                        <View style={styles.statIcon}>
                            <MaterialCommunityIcons name="bank" size={16} color={theme.colors.textSecondary} />
                        </View>
                        <Text style={styles.statLabel}>Total Debt</Text>
                        <Text style={styles.statValue}>{formatCurrency(data.totalDebt)}</Text>
                    </Animated.View>

                    <View style={styles.statDivider} />

                    <Animated.View entering={FadeIn.delay(300)} style={styles.statRow}>
                        <View style={[styles.statIcon, { backgroundColor: theme.colors.error + "15" }]}>
                            <MaterialCommunityIcons name="credit-card-clock" size={16} color={theme.colors.error} />
                        </View>
                        <Text style={styles.statLabel}>Remaining</Text>
                        <Text style={[styles.statValue, { color: theme.colors.error }]}>
                            {formatCurrency(remainingDebt)}
                        </Text>
                    </Animated.View>
                </View>
            </Animated.View>

            {/* Linear Progress Bar */}
            <View style={styles.linearProgressContainer}>
                <View style={styles.linearProgressBackground}>
                    <LinearGradient
                        colors={[progressColor, progressColor + "CC"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.linearProgressFill, { width: `${progressPercent}%` }]}
                    />
                </View>
                <View style={styles.progressLabels}>
                    <Text style={styles.progressEndLabel}>₹0</Text>
                    <Text style={styles.progressEndLabel}>{formatCurrency(data.totalDebt)}</Text>
                </View>
            </View>

            {/* Next Payment */}
            {data.nextPaymentDate && (
                <Animated.View entering={FadeInUp.delay(400)} style={styles.nextPaymentBanner}>
                    <View style={styles.nextPaymentIcon}>
                        <MaterialCommunityIcons name="calendar-alert" size={20} color={theme.colors.warning} />
                    </View>
                    <View style={styles.nextPaymentContent}>
                        <Text style={styles.nextPaymentLabel}>Next Payment Due</Text>
                        <Text style={styles.nextPaymentDate}>
                            {format(new Date(data.nextPaymentDate), "EEE, MMM d, yyyy")}
                        </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textTertiary} />
                </Animated.View>
            )}
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
        progressBadge: {
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 20,
        },
        progressText: {
            fontSize: 12,
            fontWeight: "700",
        },
        emptyState: {
            alignItems: "center",
            paddingVertical: theme.spacing.xl,
            gap: 12,
        },
        celebrationIcon: {
            width: 72,
            height: 72,
            borderRadius: 24,
            justifyContent: "center",
            alignItems: "center",
        },
        emptyTitle: {
            fontSize: 18,
            fontWeight: "700",
            color: theme.colors.success,
        },
        emptySubtitle: {
            fontSize: 14,
            color: theme.colors.textSecondary,
        },
        progressSection: {
            flexDirection: "row",
            alignItems: "center",
            gap: 20,
            marginBottom: theme.spacing.l,
        },
        circleContainer: {
            width: 100,
            height: 100,
        },
        circleBackground: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: theme.colors.backgroundSecondary,
            justifyContent: "center",
            alignItems: "center",
        },
        circleFill: {
            width: 100,
            height: 100,
            borderRadius: 50,
            justifyContent: "center",
            alignItems: "center",
        },
        circleInner: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: theme.colors.card,
            justifyContent: "center",
            alignItems: "center",
        },
        progressAmount: {
            fontSize: 14,
            fontWeight: "800",
            color: theme.colors.text,
            fontVariant: ["tabular-nums"],
        },
        progressLabel: {
            fontSize: 10,
            color: theme.colors.textSecondary,
            marginTop: 2,
        },
        statsContainer: {
            flex: 1,
            gap: 12,
        },
        statRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
        },
        statIcon: {
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: theme.colors.backgroundSecondary,
            justifyContent: "center",
            alignItems: "center",
        },
        statLabel: {
            flex: 1,
            fontSize: 13,
            color: theme.colors.textSecondary,
        },
        statValue: {
            fontSize: 15,
            fontWeight: "700",
            color: theme.colors.text,
            fontVariant: ["tabular-nums"],
        },
        statDivider: {
            height: 1,
            backgroundColor: theme.colors.border + "50",
        },
        linearProgressContainer: {
            marginBottom: theme.spacing.m,
        },
        linearProgressBackground: {
            height: 8,
            backgroundColor: theme.colors.backgroundSecondary,
            borderRadius: 4,
            overflow: "hidden",
        },
        linearProgressFill: {
            height: "100%",
            borderRadius: 4,
        },
        progressLabels: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 6,
        },
        progressEndLabel: {
            fontSize: 10,
            color: theme.colors.textTertiary,
            fontWeight: "500",
        },
        nextPaymentBanner: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.colors.warning + "10",
            borderRadius: 14,
            padding: 14,
            gap: 12,
            borderWidth: 1,
            borderColor: theme.colors.warning + "20",
        },
        nextPaymentIcon: {
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: theme.colors.warning + "20",
            justifyContent: "center",
            alignItems: "center",
        },
        nextPaymentContent: {
            flex: 1,
        },
        nextPaymentLabel: {
            fontSize: 11,
            color: theme.colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            fontWeight: "500",
        },
        nextPaymentDate: {
            fontSize: 14,
            fontWeight: "700",
            color: theme.colors.text,
            marginTop: 2,
        },
    });

export default DebtHealthCard;
