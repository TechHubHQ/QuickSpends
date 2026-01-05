import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { QSButton } from "../src/components/QSButton";
import { QSHeader } from "../src/components/QSHeader";
import { useAuth } from "../src/context/AuthContext";
import { Loan, useLoans } from "../src/hooks/useLoans";
import { useTheme } from "../src/theme/ThemeContext";

export default function LoansScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const { getLoans, deleteLoan, updateLoan } = useLoans();

    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchLoans = async () => {
        if (!user) return;
        setLoading(true);
        const data = await getLoans(user.id);
        setLoans(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchLoans();
    }, [user]);

    const renderLoan = ({ item, index }: { item: Loan; index: number }) => {
        const isLent = item.type === 'lent';

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 100).springify()}
                style={[styles.loanCard, { backgroundColor: theme.colors.surface, borderColor: theme.isDark ? '#334155' : '#E2E8F0' }]}
            >
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push({ pathname: "/loan-details/[id]", params: { id: item.id } })}
                >
                    <View style={styles.loanHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: isLent ? '#10B98120' : '#EF444420' }]}>
                            <MaterialCommunityIcons
                                name={isLent ? "hand-coin" : "hand-peace"}
                                size={24}
                                color={isLent ? '#10B981' : '#EF4444'}
                            />
                        </View>
                        <View style={styles.loanTitleInfo}>
                            <Text style={[styles.loanName, { color: theme.colors.text }]}>{item.person_name}</Text>
                            <Text style={[styles.typeText, { color: isLent ? '#10B981' : '#EF4444' }]}>
                                {isLent ? "You Lent" : "You Borrowed"}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); deleteLoan(item.id).then(fetchLoans); }}>
                            <MaterialCommunityIcons name="delete-outline" size={24} color="#EF4444" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.amountSection}>
                        <View style={styles.amountRow}>
                            <Text style={[styles.amountLabel, { color: theme.isDark ? '#94A3B8' : '#64748B' }]}>Remaining</Text>
                            <Text style={[styles.amountValue, { color: theme.colors.text }]}>₹{item.remaining_amount.toLocaleString()}</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, {
                                width: `${(item.remaining_amount / item.total_amount) * 100}%`,
                                backgroundColor: isLent ? '#10B981' : '#EF4444'
                            }]} />
                        </View>
                        <View style={styles.amountRow}>
                            <Text style={[styles.amountLabel, { color: theme.isDark ? '#94A3B8' : '#64748B' }]}>Total: ₹{item.total_amount.toLocaleString()}</Text>
                            <Text style={[styles.interestText, { color: theme.colors.primary }]}>{item.interest_rate}% Interest</Text>
                        </View>
                    </View>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: 'rgba(148, 163, 184, 0.05)' }]}
                            onPress={(e) => {
                                e.stopPropagation();
                                router.push({ pathname: "/add-transaction", params: { initialType: isLent ? 'income' : 'expense', loanId: item.id } });
                            }}
                        >
                            <MaterialCommunityIcons name="cash-register" size={18} color={theme.colors.primary} />
                            <Text style={[styles.actionText, { color: theme.colors.primary }]}>Record Payment</Text>
                        </TouchableOpacity>

                        {item.remaining_amount > 0 && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: theme.colors.primary + '10' }]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    updateLoan(item.id, { status: 'closed', remaining_amount: 0 }).then(fetchLoans);
                                }}
                            >
                                <MaterialCommunityIcons name="check-all" size={18} color={theme.colors.primary} />
                                <Text style={[styles.actionText, { color: theme.colors.primary }]}>Settle All</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <QSHeader title="My Loans" showBack onBackPress={() => router.back()} />

            <FlatList
                data={loans}
                renderItem={renderLoan}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="handshake-outline" size={80} color={theme.isDark ? '#334155' : '#E2E8F0'} />
                        <Text style={[styles.emptyText, { color: theme.isDark ? '#94A3B8' : '#64748B' }]}>
                            No active loans. Keep your debts clear!
                        </Text>
                        <QSButton
                            title="Add Loan"
                            onPress={() => router.push("/add-loan")}
                            variant="primary"
                            style={styles.emptyButton}
                        />
                    </View>
                }
                refreshing={loading}
                onRefresh={fetchLoans}
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                onPress={() => router.push("/add-loan")}
            >
                <MaterialCommunityIcons name="plus" size={32} color={theme.colors.onPrimary} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    loanCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    loanHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    loanTitleInfo: {
        flex: 1,
    },
    loanName: {
        fontSize: 18,
        fontWeight: '700',
    },
    typeText: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    amountSection: {
        marginBottom: 16,
    },
    amountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    amountLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    amountValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    interestText: {
        fontSize: 12,
        fontWeight: '600',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
        paddingHorizontal: 40,
        lineHeight: 24,
    },
    emptyButton: {
        marginTop: 24,
        width: '60%',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});
