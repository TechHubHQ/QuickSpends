import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Animated, {
    Extrapolate,
    FadeInDown,
    FadeInRight,
    FadeInUp,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue
} from "react-native-reanimated";
import { QSAlertModal } from "../components/QSAlertModal";
import { QSTransactionIndicators } from "../components/QSTransactionIndicators";
import { Transaction, useTransactions } from "../hooks/useTransactions";
import { Trip, useTrips } from "../hooks/useTrips";
import { createStyles } from "../styles/QSTripDetails.styles";
import { useTheme } from "../theme/ThemeContext";
import { getSafeIconName } from "../utils/iconMapping";

interface QSTripDetailsScreenProps {
    id: string;
}

export default function QSTripDetailsScreen({ id }: QSTripDetailsScreenProps) {
    const router = useRouter();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const { getTripById, deleteTrip, loading: tripLoading } = useTrips();
    const { getTransactionsByTrip, getSpendingByCategoryByTrip, loading: transLoading } = useTransactions();

    const [trip, setTrip] = useState<Trip | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categorySpending, setCategorySpending] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message?: string;
        buttons?: any[];
    }>({ visible: false, title: '', message: '', buttons: [] });

    const scrollY = useSharedValue(0);

    const fetchData = useCallback(async () => {
        if (!id) return;

        try {
            const [tripData, transData, catData] = await Promise.all([
                getTripById(id),
                getTransactionsByTrip(id),
                getSpendingByCategoryByTrip(id)
            ]);

            if (tripData) {
                setTrip(tripData);
            }
            setTransactions(transData);
            setCategorySpending(catData);
        } catch (error) {
            console.error("Error fetching trip details:", error);
        }
    }, [id, getTripById, getTransactionsByTrip, getSpendingByCategoryByTrip]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    const headerAnimatedStyle = useAnimatedStyle(() => {
        const translateY = interpolate(
            scrollY.value,
            [-300, 0, 300],
            [150, 0, -100],
            Extrapolate.CLAMP
        );
        const scale = interpolate(
            scrollY.value,
            [-300, 0],
            [2, 1],
            Extrapolate.CLAMP
        );
        return {
            transform: [{ translateY }, { scale }],
        };
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: trip?.currency || 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (tripLoading && !trip) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!trip) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.colors.textSecondary }}>Trip not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const budgetPercentage = Math.min(Math.round((trip.totalSpent / trip.budget) * 100), 100);
    const remainingBudget = Math.max(0, trip.budget - trip.totalSpent);
    const dailyAvg = transactions.length > 0 ? trip.totalSpent / Math.max(1, Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24))) : 0;

    const showAlert = (title: string, message?: string, buttons?: any[]) => {
        setAlertConfig({ visible: true, title, message, buttons });
    };

    const hideAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* QS Alert Modal */}
            <QSAlertModal
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                onClose={hideAlert}
            />

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.editButton} onPress={() => {
                showAlert(
                    "Trip Options",
                    "Choose an action",
                    [
                        {
                            text: "Edit Trip",
                            onPress: () => {
                                router.push({
                                    pathname: "/create-trip",
                                    params: { tripId: trip.id }
                                });
                            }
                        },
                        {
                            text: "Delete Trip",
                            onPress: () => {
                                // Close first alert, open second one
                                // Need slight timeout for modal transition or just replace state
                                setTimeout(() => {
                                    showAlert(
                                        "Delete Trip",
                                        "Are you sure you want to delete this trip? This cannot be undone.",
                                        [
                                            { text: "Cancel", style: "cancel", onPress: hideAlert },
                                            {
                                                text: "Delete",
                                                style: "destructive",
                                                onPress: async () => {
                                                    const result = await deleteTrip(trip.id);
                                                    if (result.success) {
                                                        hideAlert();
                                                        router.back();
                                                    } else {
                                                        // Show error alert
                                                        setTimeout(() => {
                                                            showAlert("Error", result.error || "Failed to delete trip");
                                                        }, 300);
                                                    }
                                                }
                                            }
                                        ]
                                    );
                                }, 300);
                            },
                            style: "destructive"
                        },
                        {
                            text: "Cancel",
                            style: "cancel",
                            onPress: hideAlert
                        }
                    ]
                );
            }}>
                <MaterialCommunityIcons name="dots-vertical" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
                }
            >
                {/* Parallax Header */}
                <Animated.View style={[styles.header, headerAnimatedStyle]}>
                    <Image
                        source={trip.image}
                        style={styles.headerImage}
                        contentFit="cover"
                    />
                    <View style={styles.headerOverlay} />
                    <View style={styles.headerContent}>
                        <View style={styles.tripTypeBadge}>
                            <MaterialCommunityIcons
                                name={trip.type === 'group' ? 'account-group' : 'account'}
                                size={12}
                                color="#FFFFFF"
                            />
                            <Text style={styles.tripTypeText}>{trip.type} Trip</Text>
                        </View>
                        <Text style={styles.tripTitle}>{trip.name}</Text>
                        <Text style={styles.tripSubtitle}>
                            {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {trip.status}
                        </Text>
                    </View>
                </Animated.View>

                {/* Content Card */}
                <View style={styles.contentCard}>
                    {/* Budget Section */}
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <View style={styles.section}>
                            <View style={styles.budgetCard}>
                                <View style={styles.budgetHeader}>
                                    <View style={styles.budgetAmountBox}>
                                        <Text style={styles.budgetLabel}>Total Spent</Text>
                                        <Text style={styles.budgetTotal}>{formatCurrency(trip.totalSpent)}</Text>
                                        <Text style={styles.budgetLimit}>of {formatCurrency(trip.budget)} limit</Text>
                                    </View>
                                    <View style={styles.percentageBox}>
                                        <Text style={styles.percentageText}>{budgetPercentage}%</Text>
                                        <Text style={styles.budgetLabel}>Used</Text>
                                    </View>
                                </View>

                                <View style={styles.progressBarContainer}>
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            {
                                                width: `${budgetPercentage}%`,
                                                backgroundColor: budgetPercentage > 90 ? theme.colors.error : theme.colors.primary
                                            }
                                        ]}
                                    />
                                </View>

                                <View style={styles.budgetFooter}>
                                    <View style={styles.budgetInfoItem}>
                                        <View style={[styles.budgetInfoIcon, { backgroundColor: theme.colors.success + '20' }]}>
                                            <MaterialCommunityIcons name="wallet-outline" size={16} color={theme.colors.success} />
                                        </View>
                                        <View>
                                            <Text style={styles.budgetInfoLabel}>Remaining</Text>
                                            <Text style={styles.budgetInfoValue}>{formatCurrency(remainingBudget)}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.budgetInfoItem}>
                                        <View style={[styles.budgetInfoIcon, { backgroundColor: theme.colors.info + '20' }]}>
                                            <MaterialCommunityIcons name="trending-up" size={16} color={theme.colors.info} />
                                        </View>
                                        <View>
                                            <Text style={styles.budgetInfoLabel}>Daily Avg</Text>
                                            <Text style={styles.budgetInfoValue}>{formatCurrency(dailyAvg)}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Category Breakdown */}
                    {categorySpending.length > 0 && (
                        <View style={{ marginBottom: theme.spacing.xl }}>
                            <Text style={[styles.sectionTitle, { marginLeft: theme.spacing.l }]}>Spending Categories</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.categoryScroll}
                            >
                                {categorySpending.map((item, index) => (
                                    <Animated.View
                                        key={item.category_name}
                                        entering={FadeInRight.delay(200 + index * 50).springify()}
                                    >
                                        <TouchableOpacity style={styles.categoryItem}>
                                            <View style={[styles.categoryIconBox, { backgroundColor: item.category_color + '20' }]}>
                                                <MaterialCommunityIcons
                                                    name={getSafeIconName(item.category_icon || '')}
                                                    size={24}
                                                    color={item.category_color}
                                                />
                                            </View>
                                            <View>
                                                <Text style={styles.categoryName} numberOfLines={1}>{item.category_name}</Text>
                                                <Text style={styles.categoryAmount}>{formatCurrency(item.total)}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </Animated.View>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Recent Transactions */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Expense History</Text>
                        <View style={styles.transactionList}>
                            {transactions.length > 0 ? (
                                transactions.map((item, index) => (
                                    <Animated.View
                                        key={item.id}
                                        entering={FadeInUp.delay(300 + index * 50).springify()}
                                    >
                                        <TouchableOpacity
                                            style={styles.transactionItem}
                                            onPress={() => router.push({
                                                pathname: "/transaction-details",
                                                params: { transaction: JSON.stringify(item) }
                                            })}
                                        >
                                            <View style={styles.transactionLeft}>
                                                <View style={[styles.transactionIconBox, { backgroundColor: (item.category_color || theme.colors.primary) + '15' }]}>
                                                    <MaterialCommunityIcons
                                                        name={getSafeIconName(item.category_icon || 'receipt')}
                                                        size={22}
                                                        color={item.category_color || theme.colors.primary}
                                                    />
                                                </View>
                                                <View style={styles.transactionInfo}>
                                                    <Text style={[styles.transactionName, { flex: 1, marginRight: 8 }]} numberOfLines={1}>{item.name}</Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                                        <Text style={styles.transactionDate}>
                                                            {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </Text>
                                                        <QSTransactionIndicators
                                                            isSplit={item.is_split}
                                                            tripId={item.trip_id}
                                                            groupId={item.group_id}
                                                            hideTrip
                                                        />
                                                    </View>
                                                </View>
                                            </View>
                                            <Text style={styles.transactionAmount}>-{formatCurrency(item.amount)}</Text>
                                        </TouchableOpacity>
                                    </Animated.View>
                                ))
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <MaterialCommunityIcons name="receipt" size={48} color={theme.colors.textTertiary} />
                                    <Text style={styles.emptyText}>No expenses recorded for this trip</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Bottom Padding for FAB */}
                    <View style={{ height: 100 }} />
                </View>
            </Animated.ScrollView>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push({
                    pathname: "/add-transaction",
                    params: { initialType: 'expense', tripId: trip.id }
                })}
            >
                <MaterialCommunityIcons name="plus" size={32} color={theme.colors.onPrimary} />
            </TouchableOpacity>
        </View>
    );
}

