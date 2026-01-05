
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import Toast from "react-native-toast-message";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import { Budget, useBudgets } from "../hooks/useBudgets";
import { useTransactions } from "../hooks/useTransactions";
import { useTheme } from "../theme/ThemeContext";
import { getSafeIconName } from "../utils/iconMapping";

const { width } = Dimensions.get("window");

export default function QSBudgetDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme.isDark;
    const insets = useSafeAreaInsets();
    const { getBudgetById, deleteBudget } = useBudgets();
    const { getRecentTransactions } = useTransactions();
    const { user } = useAuth();
    const { showAlert } = useAlert();

    const [budget, setBudget] = useState<Budget | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Toggle state for ring interaction
    const [showStats, setShowStats] = useState(false);

    const fetchData = useCallback(async () => {
        if (!id || !user) return;
        try {
            const budgetData = await getBudgetById(id);
            if (budgetData) {
                setBudget(budgetData);

                // Fetch transactions for this budget's category
                const recent = await getRecentTransactions(user.id, 50);
                const relevant = recent.filter(
                    (t) => t.category_id === budgetData.category_id && t.type === 'expense'
                );
                setTransactions(relevant);
                setTransactions(relevant);
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Budget not found'
                });
                router.back();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id, user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = () => {
        showAlert(
            "Delete Budget",
            "Are you sure you want to delete this budget? This will not delete your transactions.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const success = await deleteBudget(id!);
                        if (success) {
                            Toast.show({
                                type: 'success',
                                text1: 'Success',
                                text2: 'Budget deleted successfully'
                            });
                            router.back();
                        } else {
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: 'Failed to delete budget'
                            });
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!budget) return null;

    const percentage = Math.min(Math.round((budget.spent / budget.amount) * 100), 100);
    const remaining = budget.amount - budget.spent;
    const isOverBudget = budget.spent > budget.amount;

    // Radius logic
    const size = width * 0.75; // Large ring covering most width
    const strokeWidth = 15;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Premium Header Background */}
            <View style={styles.headerBackground}>
                <LinearGradient
                    colors={[budget.category_color, theme.colors.background]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    locations={[0, 0.8]}
                />
            </View>

            <View style={{ paddingTop: insets.top }}>
                <View style={styles.navBar}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Budget Details</Text>
                    <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                        <MaterialCommunityIcons name="delete-outline" size={24} color={theme.colors.error} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={theme.colors.primary} />
                }
            >
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.overviewCard}>

                    <Pressable onPress={() => setShowStats(!showStats)} style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                            {/* Track Circle */}
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke={theme.colors.backgroundSecondary}
                                strokeWidth={strokeWidth}
                                fill="transparent"
                            />
                            {/* Progress Circle */}
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke={isOverBudget ? theme.colors.error : budget.category_color}
                                strokeWidth={strokeWidth}
                                fill="transparent"
                                strokeDasharray={`${circumference}`}
                                strokeDashoffset={`${circumference * (1 - Math.min(percentage, 100) / 100)}`}
                                strokeLinecap="round"
                                rotation="-90"
                                origin={`${size / 2}, ${size / 2}`}
                            />
                        </Svg>

                        {/* Centered Content */}
                        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', padding: 40 }]}>
                            {!showStats ? (
                                <Animated.View entering={FadeInUp.springify()} key="info" style={{ alignItems: 'center' }}>
                                    <View style={[styles.iconCircle, { backgroundColor: budget.category_color + '20' }]}>
                                        <MaterialCommunityIcons name={getSafeIconName(budget.category_icon)} size={48} color={budget.category_color} />
                                    </View>
                                    <Text style={[styles.categoryName, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{budget.category_name}</Text>
                                    <View style={[styles.periodBadge, { backgroundColor: theme.colors.card }]}>
                                        <Text style={[styles.periodText, { color: theme.colors.textSecondary }]}>{budget.period === 'monthly' ? 'Monthly' : 'Yearly'}</Text>
                                    </View>
                                </Animated.View>
                            ) : (
                                <Animated.View entering={FadeInUp.springify()} key="stats" style={{ alignItems: 'center' }}>
                                    <Text style={[styles.percentageText, { color: isOverBudget ? theme.colors.error : theme.colors.text }]}>
                                        {percentage}%
                                    </Text>
                                    <Text style={[styles.spentText, { color: theme.colors.textSecondary }]}>Spent</Text>

                                    <View style={{ height: 1, width: 40, backgroundColor: theme.colors.border, marginVertical: 8 }} />

                                    <Text style={[styles.statValue, { color: remaining < 0 ? theme.colors.error : theme.colors.success, fontSize: 18 }]}>
                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(remaining)}
                                    </Text>
                                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Remaining</Text>
                                </Animated.View>
                            )}
                        </View>
                    </Pressable>

                    <Text style={{ marginTop: 16, color: theme.colors.textSecondary, fontSize: 12 }}>Tap the ring to toggle details</Text>

                </Animated.View>

                <View style={styles.transactionsSection}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Activity</Text>
                    {transactions.length > 0 ? (
                        transactions.map((item, index) => (
                            <Animated.View
                                key={item.id}
                                entering={FadeInUp.delay(200 + index * 50).springify()}
                                style={[styles.transactionItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                            >
                                <View style={styles.transactionLeft}>
                                    <View style={[styles.transactionDateBox, { backgroundColor: theme.colors.backgroundSecondary }]}>
                                        <Text style={[styles.dateDay, { color: theme.colors.text }]}>{new Date(item.date).getDate()}</Text>
                                        <Text style={[styles.dateMonth, { color: theme.colors.textSecondary }]}>
                                            {new Date(item.date).toLocaleDateString(undefined, { month: 'short' })}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={[styles.transactionName, { color: theme.colors.text }]}>{item.name}</Text>
                                        <Text style={[styles.transactionTime, { color: theme.colors.textSecondary }]}>
                                            {new Date(item.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={[styles.transactionAmount, { color: theme.colors.error }]}>
                                    -{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.abs(item.amount))}
                                </Text>
                            </Animated.View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No transactions yet</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
        opacity: 0.15,
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    backButton: {
        padding: 8,
    },
    deleteButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    scrollContent: {
        padding: 20,
    },
    overviewCard: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    categoryName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 6,
        textAlign: 'center',
    },
    periodBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    periodText: {
        fontSize: 12,
        fontWeight: '500',
    },
    percentageText: {
        fontSize: 42,
        fontWeight: '800',
    },
    spentText: {
        fontSize: 14,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    transactionsSection: {

    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    transactionDateBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateDay: {
        fontSize: 16,
        fontWeight: '700',
    },
    dateMonth: {
        fontSize: 10,
        textTransform: 'uppercase',
    },
    transactionName: {
        fontSize: 16,
        fontWeight: '600',
    },
    transactionTime: {
        fontSize: 12,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '700',
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
    }
});
