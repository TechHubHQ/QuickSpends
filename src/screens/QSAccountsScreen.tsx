import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { QSBottomSheet } from "../components/QSBottomSheet";
import { QSHeader } from "../components/QSHeader";
import { useAuth } from "../context/AuthContext";
import { Account, useAccounts } from "../hooks/useAccounts";
import { useTransactions } from "../hooks/useTransactions";
import { createStyles } from "../styles/QSAccounts.styles";
import { useTheme } from "../theme/ThemeContext";

export default function QSAccountsScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const isDark = theme.isDark;
    const styles = createStyles(theme.colors, isDark);
    const { user } = useAuth();
    const { getAccountsByUser } = useAccounts();
    const { getBalanceTrend } = useTransactions();

    const [refreshing, setRefreshing] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [totalNetWorth, setTotalNetWorth] = useState(0);
    const [balanceTrend, setBalanceTrend] = useState({ percentage: 0, trend: 'up' as 'up' | 'down' });
    const [isBalanceVisible, setIsBalanceVisible] = useState(false);

    // Tabs: 'all' | 'banks' | 'cash' | 'cards'
    const [selectedTab, setSelectedTab] = useState<'all' | 'banks' | 'cash' | 'cards'>('all');
    const [filterVisible, setFilterVisible] = useState(false);
    const [balanceFilters, setBalanceFilters] = useState({
        banks: true,
        cash: true,
        credit: true,
    });

    const fetchData = useCallback(async () => {
        if (!user) return;

        setRefreshing(true);
        try {
            const accountsData = await getAccountsByUser(user.id);
            setAccounts(accountsData);

            // Calculate total net worth with filters
            // Calculate total net worth with filters (Assets - Liabilities)
            const netWorth = accountsData.reduce((sum, acc) => {
                const isBank = acc.type === 'bank' || (acc.type === 'card' && acc.card_type === 'debit');
                const isCash = acc.type === 'cash';
                const isCredit = acc.type === 'card' && acc.card_type === 'credit';

                // Skip if filtered out
                if (isBank && !balanceFilters.banks) return sum;
                if (isCash && !balanceFilters.cash) return sum;
                if (isCredit && !balanceFilters.credit) return sum;

                // Subtract credit debt, add others
                if (isCredit) {
                    const debt = (acc.credit_limit || 0) - acc.balance;
                    return sum - debt;
                }
                return sum + acc.balance;
            }, 0);

            setTotalNetWorth(netWorth);

            const trendData = await getBalanceTrend(user.id, netWorth);
            setBalanceTrend(trendData);
        } catch (error) {

        } finally {
            setRefreshing(false);
        }
    }, [user, getAccountsByUser, getBalanceTrend, balanceFilters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Filter accounts based on selected tab
    const filteredAccounts = accounts.filter(acc => {
        if (selectedTab === 'all') return true;
        if (selectedTab === 'banks') return acc.type === 'bank' || (acc.type === 'card' && acc.card_type === 'debit');
        if (selectedTab === 'cash') return acc.type === 'cash';
        if (selectedTab === 'cards') return acc.type === 'card' && acc.card_type === 'credit';
        return false;
    });

    const getAccountIcon = (type: string, cardType?: string) => {
        if (type === 'bank') return 'bank';
        if (type === 'cash') return 'cash';
        if (type === 'card') return 'credit-card';
        return 'wallet';
    };

    // Modern colors for icons
    const getAccountColor = (type: string, cardType?: string) => {
        if (type === 'bank') return '#3B82F6'; // Blue
        if (type === 'cash') return '#14B8A6'; // Teal
        if (type === 'card' && cardType === 'credit') return '#A855F7'; // Purple
        return theme.colors.primary;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor={theme.colors.primary} />
                }
            >
                <QSHeader
                    title="Accounts"
                    subtitle="My Wallet"
                    rightIcon="cog"
                    onRightPress={() => router.push('/settings')}
                />

                {/* Net Worth Card */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.netWorthCard}>
                    <LinearGradient
                        colors={['#1e3a8a', '#3b82f6']} // Dark Blue to Blue
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                    />

                    {/* Decorative Blur Circles using absolute positioning */}
                    <View style={[styles.nwDecoration, { backgroundColor: 'rgba(255,255,255,0.2)', width: 160, height: 160, right: -40, top: -40, opacity: 0.6 }]} />

                    <View style={styles.netWorthContent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Text style={{ color: '#E0E7FF', fontSize: 14, fontWeight: '600' }}>Total Net Worth</Text>
                            <TouchableOpacity onPress={() => setIsBalanceVisible(!isBalanceVisible)} style={{ marginLeft: 8 }}>
                                <MaterialCommunityIcons
                                    name={isBalanceVisible ? "eye" : "eye-off"}
                                    size={16}
                                    color="rgba(255,255,255,0.7)"
                                />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.netWorthAmount}>
                            {isBalanceVisible ? formatCurrency(totalNetWorth) : "••••••••"}
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={[
                                styles.trendBadge,
                                balanceTrend.percentage === 0 && { backgroundColor: 'rgba(148, 163, 184, 0.2)' } // Grey bg if 0%
                            ]}>
                                <MaterialCommunityIcons
                                    name={balanceTrend.percentage === 0 ? "minus" : (balanceTrend.trend === 'up' ? "trending-up" : "trending-down")}
                                    size={16}
                                    color={balanceTrend.percentage === 0 ? "#94A3B8" : (balanceTrend.trend === 'up' ? "#86EFAC" : "#FCA5A5")}
                                />
                                <Text style={[
                                    styles.trendText,
                                    balanceTrend.percentage === 0 && { color: "#94A3B8" },
                                    balanceTrend.trend === 'down' && { color: "#FCA5A5" } // Explicit Red for down
                                ]}>
                                    {balanceTrend.percentage === 0 ? '' : (balanceTrend.trend === 'up' ? '+' : '-')}{balanceTrend.percentage}%
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
                                onPress={() => setFilterVisible(true)}
                            >
                                <MaterialCommunityIcons name="tune" size={14} color="#FFFFFF" />
                                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>Filter</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>

                {/* Filter Bottom Sheet */}
                <QSBottomSheet
                    visible={filterVisible}
                    onClose={() => setFilterVisible(false)}
                    title="Filter Balance"
                    showDoneButton
                    onDone={() => setFilterVisible(false)}
                >
                    <View style={{ padding: 20, gap: 20 }}>
                        <Text style={{ color: theme.colors.textSecondary, marginBottom: 10 }}>
                            Select which accounts to include in your Total Balance calculation.
                        </Text>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(59, 130, 246, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="bank" size={24} color="#3B82F6" />
                                </View>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>Banks & Debit</Text>
                            </View>
                            <Switch
                                value={balanceFilters.banks}
                                onValueChange={(val) => setBalanceFilters(prev => ({ ...prev, banks: val }))}
                                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                                thumbColor="#FFFFFF"
                            />
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(20, 184, 166, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="cash" size={24} color="#14B8A6" />
                                </View>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>Cash Wallets</Text>
                            </View>
                            <Switch
                                value={balanceFilters.cash}
                                onValueChange={(val) => setBalanceFilters(prev => ({ ...prev, cash: val }))}
                                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                                thumbColor="#FFFFFF"
                            />
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(168, 85, 247, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="credit-card" size={24} color="#A855F7" />
                                </View>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>Credit Cards</Text>
                            </View>
                            <Switch
                                value={balanceFilters.credit}
                                onValueChange={(val) => setBalanceFilters(prev => ({ ...prev, credit: val }))}
                                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                    </View>
                </QSBottomSheet>

                {/* Account Type Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabItem, selectedTab === 'all' && styles.tabItemActive]}
                        onPress={() => setSelectedTab('all')}
                    >
                        <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]} numberOfLines={1}>All</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabItem, selectedTab === 'banks' && styles.tabItemActive]}
                        onPress={() => setSelectedTab('banks')}
                    >
                        <Text style={[styles.tabText, selectedTab === 'banks' && styles.tabTextActive]} numberOfLines={1}>Banks</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabItem, selectedTab === 'cash' && styles.tabItemActive]}
                        onPress={() => setSelectedTab('cash')}
                    >
                        <Text style={[styles.tabText, selectedTab === 'cash' && styles.tabTextActive]} numberOfLines={1}>Cash</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabItem, selectedTab === 'cards' && styles.tabItemActive]}
                        onPress={() => setSelectedTab('cards')}
                    >
                        <Text style={[styles.tabText, selectedTab === 'cards' && styles.tabTextActive]} numberOfLines={1}>Cards</Text>
                    </TouchableOpacity>
                </View>

                {/* Accounts List */}
                <View style={styles.accountList}>
                    {filteredAccounts.map((account, index) => {
                        const icon = getAccountIcon(account.type, account.card_type);
                        const accentColor = getAccountColor(account.type, account.card_type);
                        const isCredit = account.type === 'card' && account.card_type === 'credit';

                        return (
                            <Animated.View key={account.id} entering={FadeInUp.delay(200 + index * 50).springify()}>
                                <TouchableOpacity
                                    style={styles.accountCard}
                                    onPress={() => router.push(`/account-details/${account.id}` as any)}
                                >
                                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                                        <View style={[
                                            styles.accountIconContainer,
                                            {
                                                backgroundColor: `${accentColor}15`, // 10% opacity
                                                borderColor: `${accentColor}30`     // 20% opacity
                                            }
                                        ]}>
                                            <MaterialCommunityIcons
                                                name={icon as any}
                                                size={24}
                                                color={accentColor}
                                            />
                                        </View>
                                        <View style={styles.accountInfo}>
                                            <Text style={styles.accountName}>
                                                {(() => {
                                                    const words = account.name.split(' ');
                                                    if (words.length > 2) {
                                                        return words.slice(0, 2).join(' ') + '\n' + words.slice(2).join(' ');
                                                    }
                                                    return account.name;
                                                })()}
                                            </Text>
                                            <Text style={styles.accountSubtext}>
                                                {account.account_number_last_4 ? `**** ${account.account_number_last_4} • ` : ""}
                                                {account.type === 'bank' ? 'Debit' : (account.type === 'cash' ? 'Cash on hand' : 'Visa')}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.accountBalanceContainer}>
                                        <Text style={[
                                            styles.accountBalance,
                                            isCredit
                                                ? { color: account.balance < 0 ? "#F87171" : theme.colors.text }
                                                : { color: theme.colors.text }
                                        ]}>
                                            {formatCurrency(account.balance)}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Text style={[
                                                styles.detailsButton,
                                                isCredit && account.balance <= 0 ? { color: "#F87171" } : {}
                                            ]}>
                                                {isCredit
                                                    ? (account.balance <= 0 ? 'PAY NOW' : 'DETAILS')
                                                    : (account.type === 'cash' ? 'MANAGE' : 'DETAILS')
                                                }
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}
                </View>

                {/* Add Button */}
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push("/setup-account")}
                >
                    <MaterialCommunityIcons name="plus-circle" size={24} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>Add New Account</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
