
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Keyboard,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { QSAccountCard } from "../components/QSAccountCard";
import { QSBottomSheet } from "../components/QSBottomSheet";
import { QSHeader } from "../components/QSHeader";
import { QSTransactionIndicators } from "../components/QSTransactionIndicators";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import { Account, useAccounts } from "../hooks/useAccounts";
import { useCategories } from "../hooks/useCategories";
import { Transaction, useTransactions } from "../hooks/useTransactions";
import { createStyles } from "../styles/QSAccountDetails.styles";
import { useTheme } from "../theme/ThemeContext";

type FilterType = 'all' | 'income' | 'expense' | 'transfer';

export default function QSAccountDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme } = useTheme();
    const router = useRouter();
    const isDark = theme.isDark;
    const styles = createStyles(theme.colors, isDark);
    const { user } = useAuth();
    const { getAccountsByUser, deleteAccount } = useAccounts();
    const { getRecentTransactions, addTransaction } = useTransactions();
    const { getCategories, addCategory } = useCategories();
    const { showAlert } = useAlert();

    const [account, setAccount] = useState<Account | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ monthIn: 0, monthOut: 0 });

    const [showFilter, setShowFilter] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');

    // Reconcile State
    const [showReconcile, setShowReconcile] = useState(false);
    const [reconcileBalance, setReconcileBalance] = useState("");

    const fetchData = useCallback(async () => {
        if (!user || !id) return;
        setRefreshing(true);
        try {
            const accounts = await getAccountsByUser(user.id);
            const currentAccount = accounts.find(acc => acc.id === id);
            if (currentAccount) {
                setAccount(currentAccount);
                // In a real app, we'd have a getTransactionsByAccount hook
                // For now, let's filter the recent ones or mock it
                const allRecent = await getRecentTransactions(user.id, 50);
                const accountTransactions = allRecent.filter(t => t.account_id === id);
                setTransactions(accountTransactions);

                // Calculate stats for the current month
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                const monthIn = accountTransactions
                    .filter(t => t.type === 'income' && new Date(t.date) >= startOfMonth)
                    .reduce((sum, t) => sum + t.amount, 0);

                const monthOut = accountTransactions
                    .filter(t => t.type === 'expense' && new Date(t.date) >= startOfMonth)
                    .reduce((sum, t) => sum + t.amount, 0);

                setStats({ monthIn, monthOut });
            }
        } catch (error) {

        } finally {
            setRefreshing(false);
        }
    }, [user, id, getAccountsByUser, getRecentTransactions]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const handleTransfer = () => {
        router.push({
            pathname: "/add-transaction",
            params: { initialType: 'transfer', accountId: id }
        });
    };

    const handleStatement = () => {
        Toast.show({
            type: 'info',
            text1: 'Coming Soon',
            text2: 'Statement generation will be available in a future update.'
        });
    };

    const handleEditAccount = () => {
        router.push({
            pathname: "/setup-account",
            params: { accountId: id }
        });
    };

    const handleDeleteAccount = () => {
        showAlert(
            "Delete Account",
            "Are you sure you want to delete this account? This will hide the account but preserve transaction history.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const success = await deleteAccount(id || "");
                        if (success) {
                            Toast.show({
                                type: 'success',
                                text1: 'Success',
                                text2: 'Account deleted successfully'
                            });
                            router.back();
                        } else {
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: 'Failed to delete account'
                            });
                        }
                    }
                }
            ]
        );
    };

    const getFilteredTransactions = () => {
        if (activeFilter === 'all') return transactions;
        return transactions.filter(t => t.type === activeFilter);
    };

    const renderFilterOption = (label: string, value: FilterType, icon: string, color: string) => (
        <TouchableOpacity
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
            }}
            onPress={() => {
                setActiveFilter(value);
                setShowFilter(false);
            }}
        >
            <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
            }}>
                <MaterialCommunityIcons name={icon as any} size={20} color={color} />
            </View>
            <Text style={{
                flex: 1,
                fontSize: 16,
                color: theme.colors.text,
                fontFamily: 'Inter_500Medium'
            }}>{label}</Text>
            {activeFilter === value && (
                <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} />
            )}
        </TouchableOpacity>
    );

    if (!account) {
        return (
            <View style={styles.container}>
                <QSHeader title="Account Details" showBack onBackPress={() => router.back()} />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: theme.colors.textSecondary }}>Loading account details...</Text>
                </View>
            </View>
        );
    }

    const displayedTransactions = getFilteredTransactions();

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor={theme.colors.primary} />
                }
            >
                <QSHeader
                    title={account.type === 'cash' ? "Physical Wallet Details" : "Account Details"}
                    showBack
                    onBackPress={() => router.back()}
                    rightIcon={account.type === 'cash' ? "dots-vertical" : "pencil"}
                    onRightPress={handleEditAccount}
                />
                {/* Featured Card */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.cardSection}>
                    <QSAccountCard account={account} monthIn={stats.monthIn} monthOut={stats.monthOut} />
                    <View style={styles.statusInfo}>
                        <MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.success} />
                        <Text style={styles.statusText}>
                            {account.type === 'cash'
                                ? "Reconciled • Updated just now"
                                : (account.type === 'card' && account.card_type === 'credit' && account.credit_limit
                                    ? `Outstanding: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(account.credit_limit - account.balance)} • Limit: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(account.credit_limit)} `
                                    : "Available Balance • Updated just now")
                            }
                        </Text>
                    </View>
                </Animated.View>

                {/* Quick Actions */}
                <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.actionButtonsGrid}>
                    {account.type === 'cash' ? (
                        <>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => router.push({
                                    pathname: "/add-transaction",
                                    params: { initialType: 'income', accountId: id }
                                })}
                            >
                                <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(52, 211, 153, 0.1)', borderColor: 'rgba(52, 211, 153, 0.2)', borderWidth: 1 }]}>
                                    <MaterialCommunityIcons name="plus" size={24} color="#34D399" />
                                </View>
                                <Text style={styles.actionLabel}>Add Cash</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => router.push({
                                    pathname: "/add-transaction",
                                    params: { initialType: 'expense', accountId: id }
                                })}
                            >
                                <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', borderWidth: 1 }]}>
                                    <MaterialCommunityIcons name="minus" size={24} color="#EF4444" />
                                </View>
                                <Text style={styles.actionLabel}>Log Expense</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => {
                                    if (account) {
                                        setReconcileBalance(account.balance.toString());
                                        setShowReconcile(true);
                                    }
                                }}
                            >
                                <View style={styles.actionIconContainer}>
                                    <MaterialCommunityIcons name="clipboard-check" size={24} color={isDark ? '#FFF' : theme.colors.primary} />
                                </View>
                                <Text style={styles.actionLabel}>Reconcile</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity style={styles.actionButton} onPress={handleTransfer}>
                                <View style={styles.actionIconContainer}>
                                    <MaterialCommunityIcons name="swap-horizontal" size={24} color={isDark ? '#FFF' : theme.colors.primary} />
                                </View>
                                <Text style={styles.actionLabel}>Transfer</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} onPress={handleStatement}>
                                <View style={styles.actionIconContainer}>
                                    <MaterialCommunityIcons name="file-document" size={24} color={isDark ? '#FFF' : theme.colors.primary} />
                                </View>
                                <Text style={styles.actionLabel}>Statement</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} onPress={() => setShowFilter(true)}>
                                <View style={[styles.actionIconContainer, activeFilter !== 'all' && { borderColor: theme.colors.primary, borderWidth: 1, backgroundColor: isDark ? 'rgba(124, 58, 237, 0.1)' : 'rgba(124, 58, 237, 0.05)' }]}>
                                    <MaterialCommunityIcons name={activeFilter === 'all' ? "filter-variant" : "filter"} size={24} color={activeFilter !== 'all' ? theme.colors.primary : (isDark ? '#FFF' : theme.colors.primary)} />
                                </View>
                                <Text style={[styles.actionLabel, activeFilter !== 'all' && { color: theme.colors.primary, fontWeight: 'bold' }]}>
                                    {activeFilter === 'all' ? "Filter" : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </Animated.View>

                {/* Recent Transactions */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {account.type === 'cash' ? "Recent Cash Activity" : "Recent Transactions"}
                        </Text>
                        <TouchableOpacity onPress={() => router.push({ pathname: "/transactions", params: { accountId: id } })}>
                            <Text style={styles.seeAllButton}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.transactionList}>
                        {displayedTransactions.length > 0 ? (
                            displayedTransactions.map((item, index) => (
                                <Animated.View key={item.id} entering={FadeInUp.delay(300 + index * 50).springify()}>
                                    <TouchableOpacity
                                        style={styles.transactionItem}
                                        onPress={() => router.push({
                                            pathname: "/transaction-details",
                                            params: { transaction: JSON.stringify(item) }
                                        })}
                                    >
                                        <View style={styles.transactionLeft}>
                                            <View style={styles.transactionIconBox}>
                                                <MaterialCommunityIcons
                                                    name={item.type === 'transfer'
                                                        ? "swap-horizontal"
                                                        : (item.name === 'Opening Balance'
                                                            ? 'wallet-plus'
                                                            : (item.category_icon || 'receipt') as any)}
                                                    size={24}
                                                    color={item.type === 'transfer' ? "#8B5CF6" : (item.category_color || (item.name === 'Opening Balance' ? theme.colors.primary : theme.colors.text))}
                                                />
                                            </View>
                                            <View>
                                                <Text style={styles.transactionName}>{item.name}</Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <Text style={styles.transactionTime}>
                                                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </Text>
                                                    <QSTransactionIndicators
                                                        isSplit={item.is_split}
                                                        tripId={item.trip_id}
                                                        groupId={item.group_id}
                                                        savingsId={item.savings_id}
                                                        loanId={item.loan_id}
                                                    />
                                                </View>
                                            </View>
                                        </View>
                                        <Text
                                            style={[
                                                styles.transactionAmount,
                                                { color: item.type === 'income' ? "#48BB78" : (item.type === 'expense' ? "#F56565" : (item.type === 'transfer' ? "#8B5CF6" : theme.colors.text)) }
                                            ]}
                                        >
                                            {item.type === 'expense' ? '-' : '+'}{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.abs(item.amount))}
                                        </Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))
                        ) : (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: theme.colors.textSecondary }}>
                                    {activeFilter !== 'all'
                                        ? `No ${activeFilter} transactions found.`
                                        : "No transactions found for this account."}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Footer Actions */}
                <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.footerActions}>
                    <TouchableOpacity style={styles.editButton} onPress={handleEditAccount}>
                        <Text style={styles.editButtonText}>
                            {account.type === 'cash' ? "Edit Wallet Details" : "Edit Account Details"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                        <MaterialCommunityIcons name="delete" size={20} color="#F56565" />
                        <Text style={styles.deleteButtonText}>
                            {account.type === 'cash' ? "Delete Wallet" : "Delete Account"}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>

            <QSBottomSheet
                visible={showFilter}
                onClose={() => setShowFilter(false)}
                title="Filter Transactions"
                showDoneButton={false}
            >
                <View style={{ paddingBottom: 20 }}>
                    {renderFilterOption('All Transactions', 'all', 'format-list-bulleted', theme.colors.text)}
                    {renderFilterOption('Income', 'income', 'arrow-down-circle', '#10B981')}
                    {renderFilterOption('Expense', 'expense', 'arrow-up-circle', '#EF4444')}
                    {renderFilterOption('Transfers', 'transfer', 'swap-horizontal', '#8B5CF6')}
                </View>
            </QSBottomSheet>

            <QSBottomSheet
                visible={showReconcile}
                onClose={() => {
                    setShowReconcile(false);
                    Keyboard.dismiss();
                }}
                title="Reconcile Wallet"
                showDoneButton={false}
            >
                <View style={{ paddingBottom: 30 }}>
                    <Text style={{ color: theme.colors.textSecondary, marginBottom: 8 }}>Current Balance</Text>
                    <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(account.balance)}
                    </Text>

                    <Text style={{ color: theme.colors.text, marginBottom: 8, fontWeight: '500' }}>New Balance</Text>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        marginBottom: 24,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                    }}>
                        <Text style={{ color: theme.colors.text, fontSize: 18, marginRight: 8 }}>₹</Text>
                        <TextInput
                            style={{
                                flex: 1,
                                height: 50,
                                fontSize: 18,
                                color: theme.colors.text,
                            }}
                            value={reconcileBalance}
                            onChangeText={setReconcileBalance}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor={theme.colors.textSecondary}
                            autoFocus
                        />
                    </View>

                    <TouchableOpacity
                        style={{
                            backgroundColor: theme.colors.primary,
                            paddingVertical: 14,
                            borderRadius: 12,
                            alignItems: 'center',
                            shadowColor: theme.colors.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 8,
                            elevation: 4
                        }}
                        onPress={async () => {
                            if (!reconcileBalance || isNaN(parseFloat(reconcileBalance))) {
                                Toast.show({
                                    type: 'error',
                                    text1: 'Invalid Balance',
                                    text2: 'Please enter a valid numeric balance.'
                                });
                                return;
                            }

                            const newBalance = parseFloat(reconcileBalance);
                            if (newBalance === account.balance) {
                                setShowReconcile(false);
                                return;
                            }

                            const diff = newBalance - account.balance;
                            const type = diff > 0 ? 'income' : 'expense';
                            const amount = Math.abs(diff);

                            // Find a category for adjustment
                            try {
                                if (!user) {
                                    Toast.show({
                                        type: 'error',
                                        text1: 'Error',
                                        text2: 'User not found'
                                    });
                                    return;
                                }

                                const categories = await getCategories(type);
                                let category = categories.find(c => c.name === 'Adjustment');

                                if (!category) {
                                    // Create Adjustment category if it doesn't exist
                                    const newCategory = await addCategory(
                                        'Adjustment',
                                        'scale-balance',
                                        '#607D8B', // Blue Grey
                                        type
                                    );
                                    // addCategory returns { id, ... } but we need to match the shape or just use the id
                                    category = newCategory as any;
                                }

                                const transactionId = await addTransaction({
                                    user_id: user.id,
                                    account_id: account.id,
                                    category_id: category?.id,
                                    name: 'Balance Correction',
                                    amount: amount,
                                    type: type,
                                    date: new Date().toISOString()
                                });

                                if (transactionId) {
                                    setShowReconcile(false);
                                    fetchData(); // Refresh data to show new balance
                                    Toast.show({
                                        type: 'success',
                                        text1: 'Reconciled',
                                        text2: 'Wallet balance updated with a correction transaction.'
                                    });
                                } else {
                                    Toast.show({
                                        type: 'error',
                                        text1: 'Error',
                                        text2: 'Failed to reconcile balance.'
                                    });
                                }
                            } catch (e) {
                                Toast.show({
                                    type: 'error',
                                    text1: 'Error',
                                    text2: 'An error occurred while reconciling.'
                                });
                            }
                        }}
                    >
                        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>Update Balance</Text>
                    </TouchableOpacity>
                </View>
            </QSBottomSheet>
        </View>
    );
}
