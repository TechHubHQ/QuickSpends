import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
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
import Toast from "react-native-toast-message";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import { Loan, useLoans } from "../hooks/useLoans";
import { Transaction, useTransactions } from "../hooks/useTransactions";
import { useTheme } from "../theme/ThemeContext";

const { width } = Dimensions.get("window");

export default function QSLoanDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const { getLoan, deleteLoan, updateLoan } = useLoans();
    const { getTransactionsByLoan } = useTransactions();
    const { user } = useAuth();
    const { showAlert } = useAlert();

    const [loan, setLoan] = useState<Loan | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        if (!id || !user) return;
        try {
            const loanData = await getLoan(id);
            if (loanData) {
                setLoan(loanData);
                const relatedTransactions = await getTransactionsByLoan(id);
                setTransactions(relatedTransactions);
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Loan not found'
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
            "Delete Loan",
            "Are you sure you want to delete this loan? All linked transactions will be DELETED permanently.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const success = await deleteLoan(id!);
                        if (success) {
                            Toast.show({
                                type: 'success',
                                text1: 'Success',
                                text2: 'Loan deleted successfully'
                            });
                            router.back();
                        } else {
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: 'Failed to delete loan'
                            });
                        }
                    },
                },
            ]
        );
    };

    const handleSettleAll = () => {
        if (!loan) return;
        showAlert(
            "Settle All",
            `Are you sure you want to settle the remaining ₹${loan.remaining_amount.toLocaleString()}?`,
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Settle",
                    onPress: async () => {
                        const success = await updateLoan(loan.id, { status: 'closed', remaining_amount: 0 });
                        if (success) {
                            Toast.show({
                                type: 'success',
                                text1: 'Success',
                                text2: 'Loan settled successfully'
                            });
                            fetchData();
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = () => {
        router.push({ pathname: "/add-loan", params: { loanId: id } });
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!loan) return null;

    const isLent = loan.type === 'lent';
    const mainColor = isLent ? '#10B981' : '#EF4444';
    const progress = ((loan.total_amount - loan.remaining_amount) / loan.total_amount) * 100;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle="light-content" />

            <View style={styles.headerBackground}>
                <LinearGradient
                    colors={[mainColor, theme.colors.background]}
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
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Loan Details</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={handleEdit} style={styles.actionIconButton}>
                            <MaterialCommunityIcons name="pencil-outline" size={22} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDelete} style={styles.actionIconButton}>
                            <MaterialCommunityIcons name="delete-outline" size={22} color={theme.colors.error} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={theme.colors.primary} />
                }
            >
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.overviewCard}>
                    <View style={[styles.personIconContainer, { backgroundColor: mainColor + '20' }]}>
                        <MaterialCommunityIcons name={isLent ? "hand-coin" : "hand-peace"} size={48} color={mainColor} />
                    </View>
                    {loan.name ? (
                        <Text style={[styles.loanTitle, { color: theme.colors.primary }]}>{loan.name}</Text>
                    ) : (
                        <Text style={[styles.loanTitle, { color: theme.colors.primary }]}>LOAN</Text>
                    )}
                    <Text style={[styles.personName, { color: theme.colors.text }]}>{loan.person_name}</Text>
                    <Text style={[styles.typeBadge, { color: mainColor, borderColor: mainColor }]}>
                        {isLent ? "YOU LENT" : "YOU BORROWED"}
                    </Text>

                    <View style={styles.amountSummary}>
                        <View style={styles.amountCol}>
                            <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>Remaining</Text>
                            <Text style={[styles.remainingAmount, { color: theme.colors.text }]}>₹{loan.remaining_amount.toLocaleString()}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.amountCol}>
                            <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>Total</Text>
                            <Text style={[styles.totalAmount, { color: theme.colors.textSecondary }]}>₹{loan.total_amount.toLocaleString()}</Text>
                        </View>
                    </View>

                    <View style={styles.progressSection}>
                        <View style={styles.progressInfo}>
                            <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>Repayment Progress</Text>
                            <Text style={[styles.progressPercent, { color: mainColor }]}>{Math.round(progress)}%</Text>
                        </View>
                        <View style={[styles.progressBarBg, { backgroundColor: theme.isDark ? '#1e293b' : '#f1f5f9' }]}>
                            <Animated.View
                                entering={FadeInDown.delay(300).springify()}
                                style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: mainColor }]}
                            />
                        </View>
                    </View>

                    <View style={styles.detailsGrid}>
                        <View style={[styles.detailItem, { backgroundColor: theme.colors.surface }]}>
                            <MaterialCommunityIcons name="tag-outline" size={20} color={theme.colors.primary} />
                            <View>
                                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Type</Text>
                                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{loan.loan_type || 'Personal'}</Text>
                            </View>
                        </View>
                        <View style={[styles.detailItem, { backgroundColor: theme.colors.surface }]}>
                            <MaterialCommunityIcons name="credit-card-outline" size={20} color={theme.colors.primary} />
                            <View>
                                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Payment</Text>
                                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{loan.payment_type || 'Custom'}</Text>
                            </View>
                        </View>
                    </View>

                    {loan.payment_type === 'EMI' && (
                        <View style={[styles.detailsGrid, { marginTop: 12 }]}>
                            <View style={[styles.detailItem, { backgroundColor: theme.colors.surface }]}>
                                <MaterialCommunityIcons name="cash-multiple" size={20} color={theme.colors.primary} />
                                <View>
                                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>EMI</Text>
                                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>₹{loan.emi_amount?.toLocaleString()}</Text>
                                </View>
                            </View>
                            <View style={[styles.detailItem, { backgroundColor: theme.colors.surface }]}>
                                <MaterialCommunityIcons name="timer-outline" size={20} color={theme.colors.primary} />
                                <View>
                                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Tenure</Text>
                                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>{loan.tenure_months} Mo</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={[styles.detailsGrid, { marginTop: 12 }]}>
                        <View style={[styles.detailItem, { backgroundColor: theme.colors.surface }]}>
                            <MaterialCommunityIcons name="percent" size={20} color={theme.colors.primary} />
                            <View>
                                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Interest</Text>
                                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                                    {loan.interest_rate}%/{loan.interest_type === 'monthly' ? 'mo' : 'yr'}
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.detailItem, { backgroundColor: theme.colors.surface }]}>
                            <MaterialCommunityIcons name="calendar-clock" size={20} color={theme.colors.primary} />
                            <View>
                                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Due Date</Text>
                                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                                    {loan.next_due_date ? new Date(loan.next_due_date).toLocaleDateString() : (loan.due_date ? new Date(loan.due_date).toLocaleDateString() : 'No date')}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {loan.status === 'active' && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: 'rgba(148, 163, 184, 0.05)', flex: 1.2 }]}
                            onPress={() => router.push({ pathname: "/add-transaction", params: { initialType: isLent ? 'income' : 'expense', loanId: loan.id } })}
                        >
                            <MaterialCommunityIcons name="cash-register" size={20} color={theme.colors.primary} />
                            <Text style={[styles.actionText, { color: theme.colors.primary }]}>Record Payment</Text>
                        </TouchableOpacity>

                        {loan.remaining_amount > 0 && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: theme.colors.primary, flex: 1 }]}
                                onPress={handleSettleAll}
                            >
                                <MaterialCommunityIcons name="check-all" size={20} color={theme.colors.onPrimary} />
                                <Text style={[styles.actionText, { color: theme.colors.onPrimary }]}>Settle All</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <View style={styles.transactionsSection}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Repayment History</Text>
                    {transactions.length > 0 ? (
                        transactions.map((item, index) => (
                            <Animated.View
                                key={item.id}
                                entering={FadeInUp.delay(200 + index * 50).springify()}
                                style={[styles.transactionItem, { backgroundColor: theme.colors.surface, borderColor: theme.isDark ? '#334155' : '#E2E8F0' }]}
                            >
                                <View style={styles.transactionLeft}>
                                    <View style={[styles.transactionDateBox, { backgroundColor: theme.isDark ? '#1e293b' : '#f1f5f9' }]}>
                                        <Text style={[styles.dateDay, { color: theme.colors.text }]}>{new Date(item.date).getDate()}</Text>
                                        <Text style={[styles.dateMonth, { color: theme.colors.textSecondary }]}>
                                            {new Date(item.date).toLocaleDateString(undefined, { month: 'short' })}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={[styles.transactionName, { color: theme.colors.text }]}>{item.name}</Text>
                                        <Text style={[styles.transactionAccount, { color: theme.colors.textSecondary }]}>{item.account_name}</Text>
                                    </View>
                                </View>
                                <Text style={[
                                    styles.transactionAmount,
                                    { color: item.type === 'income' ? theme.colors.success : theme.colors.error }
                                ]}>
                                    {item.type === 'income' ? '+' : '-'}₹{Math.abs(item.amount).toLocaleString()}
                                </Text>
                            </Animated.View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="history" size={48} color={theme.isDark ? '#334155' : '#E2E8F0'} />
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No payments recorded yet</Text>
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
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionIconButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    overviewCard: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    personIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    loanTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    personName: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    typeBadge: {
        fontSize: 12,
        fontWeight: '800',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 24,
    },
    amountSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    amountCol: {
        flex: 1,
        alignItems: 'center',
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(148, 163, 184, 0.2)',
    },
    amountLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    remainingAmount: {
        fontSize: 24,
        fontWeight: '800',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: '600',
    },
    progressSection: {
        width: '100%',
        paddingHorizontal: 10,
        marginBottom: 30,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 10,
    },
    progressText: {
        fontSize: 13,
        fontWeight: '600',
    },
    progressPercent: {
        fontSize: 18,
        fontWeight: '800',
    },
    progressBarBg: {
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    detailsGrid: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    detailItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    detailLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 30,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '700',
    },
    transactionsSection: {
        marginTop: 10,
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
    transactionAccount: {
        fontSize: 12,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '700',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
    }
});
