import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format, isThisWeek, isToday, isTomorrow } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { UpcomingBill } from "../../hooks/useAnalytics";
import { Theme } from "../../theme/theme";

interface UpcomingBillsCardProps {
    data: UpcomingBill[];
    loading?: boolean;
    theme: Theme;
    formatCurrency: (amount: number) => string;
    onBillPress?: (bill: UpcomingBill) => void;
    onViewAll?: () => void;
}

export const UpcomingBillsCard: React.FC<UpcomingBillsCardProps> = ({
    data,
    loading,
    theme,
    formatCurrency,
    onBillPress,
    onViewAll,
}) => {
    const styles = createStyles(theme);

    if (loading || data.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <MaterialCommunityIcons name="calendar-clock" size={20} color={theme.colors.primary} />
                    <Text style={styles.title}>Upcoming Bills</Text>
                </View>
                <View style={styles.emptyState}>
                    <LinearGradient
                        colors={[theme.colors.success + "20", theme.colors.primary + "20"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.emptyIconContainer}
                    >
                        <MaterialCommunityIcons name="check-circle-outline" size={32} color={theme.colors.success} />
                    </LinearGradient>
                    <Text style={styles.emptyTitle}>
                        {loading ? "Loading..." : "No upcoming bills"}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {loading ? "" : "You're all caught up!"}
                    </Text>
                </View>
            </View>
        );
    }

    const getDueDateDisplay = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isToday(date)) return { label: "Today", urgent: true, color: theme.colors.error };
        if (isTomorrow(date)) return { label: "Tomorrow", urgent: true, color: theme.colors.warning };
        if (isThisWeek(date)) return { label: format(date, "EEEE"), urgent: false, color: theme.colors.primary };
        return { label: format(date, "MMM d"), urgent: false, color: theme.colors.textSecondary };
    };

    const totalAmount = data.reduce((sum, bill) => sum + bill.amount, 0);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <LinearGradient
                        colors={["#F59E0B", "#EAB308"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconBadge}
                    >
                        <MaterialCommunityIcons name="calendar-clock" size={18} color="#FFF" />
                    </LinearGradient>
                    <View>
                        <Text style={styles.title}>Upcoming Bills</Text>
                        <Text style={styles.subtitle}>{data.length} bills this period</Text>
                    </View>
                </View>
                <View style={styles.totalBadge}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
                </View>
            </View>

            {/* Bills List */}
            <View style={styles.billsList}>
                {data.map((bill, index) => {
                    const dueInfo = getDueDateDisplay(bill.dueDate);
                    return (
                        <Animated.View
                            key={bill.id}
                            entering={FadeInDown.delay(index * 100).springify()}
                        >
                            <Pressable
                                onPress={() => onBillPress?.(bill)}
                                style={({ pressed }) => [
                                    styles.billItem,
                                    pressed && styles.billItemPressed,
                                    dueInfo.urgent && styles.billItemUrgent,
                                ]}
                            >
                                {/* Category Icon */}
                                <View
                                    style={[
                                        styles.billIcon,
                                        { backgroundColor: (bill.category?.color || theme.colors.primary) + "20" },
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        name={(bill.category?.icon as any) || "cash"}
                                        size={20}
                                        color={bill.category?.color || theme.colors.primary}
                                    />
                                </View>

                                {/* Bill Info */}
                                <View style={styles.billInfo}>
                                    <Text style={styles.billName} numberOfLines={1}>
                                        {bill.name}
                                    </Text>
                                    <View style={styles.billMeta}>
                                        <View style={[styles.dueBadge, { backgroundColor: dueInfo.color + "15" }]}>
                                            <MaterialCommunityIcons
                                                name={dueInfo.urgent ? "alert-circle" : "calendar"}
                                                size={12}
                                                color={dueInfo.color}
                                            />
                                            <Text style={[styles.dueText, { color: dueInfo.color }]}>
                                                {dueInfo.label}
                                            </Text>
                                        </View>
                                        <View style={styles.frequencyBadge}>
                                            <MaterialCommunityIcons name="repeat" size={10} color={theme.colors.textTertiary} />
                                            <Text style={styles.frequencyText}>{bill.frequency}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Amount */}
                                <View style={styles.billAmount}>
                                    <Text style={[styles.amount, dueInfo.urgent && { color: dueInfo.color }]}>
                                        {formatCurrency(bill.amount)}
                                    </Text>
                                    <MaterialCommunityIcons name="chevron-right" size={16} color={theme.colors.textTertiary} />
                                </View>
                            </Pressable>
                        </Animated.View>
                    );
                })}
            </View>

            {/* View All */}
            {onViewAll && (
                <Pressable onPress={onViewAll} style={styles.viewAllButton}>
                    <Text style={styles.viewAllText}>View all recurring bills</Text>
                    <MaterialCommunityIcons name="arrow-right" size={16} color={theme.colors.primary} />
                </Pressable>
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
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: theme.spacing.l,
        },
        headerLeft: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
        },
        iconBadge: {
            width: 40,
            height: 40,
            borderRadius: 12,
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
            marginTop: 2,
        },
        totalBadge: {
            alignItems: "flex-end",
        },
        totalLabel: {
            fontSize: 11,
            color: theme.colors.textTertiary,
            fontWeight: "500",
            textTransform: "uppercase",
            letterSpacing: 0.5,
        },
        totalAmount: {
            fontSize: 18,
            fontWeight: "800",
            color: theme.colors.primary,
            fontVariant: ["tabular-nums"],
        },
        emptyState: {
            alignItems: "center",
            paddingVertical: theme.spacing.xl,
            gap: 12,
        },
        emptyIconContainer: {
            width: 64,
            height: 64,
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
        },
        emptyTitle: {
            fontSize: 16,
            fontWeight: "600",
            color: theme.colors.text,
        },
        emptySubtitle: {
            fontSize: 14,
            color: theme.colors.textSecondary,
        },
        billsList: {
            gap: 10,
        },
        billItem: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.colors.backgroundSecondary,
            borderRadius: 16,
            padding: 14,
            gap: 12,
            borderWidth: 1,
            borderColor: "transparent",
        },
        billItemPressed: {
            opacity: 0.7,
        },
        billItemUrgent: {
            borderColor: theme.colors.error + "30",
            backgroundColor: theme.colors.error + "08",
        },
        billIcon: {
            width: 44,
            height: 44,
            borderRadius: 14,
            justifyContent: "center",
            alignItems: "center",
        },
        billInfo: {
            flex: 1,
            gap: 6,
        },
        billName: {
            fontSize: 15,
            fontWeight: "600",
            color: theme.colors.text,
        },
        billMeta: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
        },
        dueBadge: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 12,
            gap: 4,
        },
        dueText: {
            fontSize: 11,
            fontWeight: "600",
        },
        frequencyBadge: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
        },
        frequencyText: {
            fontSize: 11,
            color: theme.colors.textTertiary,
            textTransform: "capitalize",
        },
        billAmount: {
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
        viewAllButton: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginTop: theme.spacing.m,
            paddingVertical: 12,
            gap: 6,
        },
        viewAllText: {
            fontSize: 14,
            fontWeight: "600",
            color: theme.colors.primary,
        },
    });

export default UpcomingBillsCard;
