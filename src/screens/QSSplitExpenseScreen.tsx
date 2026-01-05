import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import { QSHeader } from "../components/QSHeader";
import { useAuth } from "../context/AuthContext";
import { useGroups } from "../hooks/useGroups";
import { useTransactions } from "../hooks/useTransactions";
import { useTheme } from "../theme/ThemeContext";

export default function QSSplitExpenseScreen() {
    const { id: groupId } = useLocalSearchParams();
    const router = useRouter();
    const { theme } = useTheme();
    const { user } = useAuth();
    const { getGroupDetails, saveSplits } = useGroups();
    const { getRecentTransactions } = useTransactions();

    const [loading, setLoading] = useState(true);
    const [group, setGroup] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());

    // Split State
    const [splitMethod, setSplitMethod] = useState<'equal' | 'custom'>('equal');
    const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadData = async () => {
            if (groupId && user) {
                const details = await getGroupDetails(groupId as string, user.id);
                if (details) {
                    setGroup(details);
                    setMembers(details.members);

                    // Filter transactions where I AM THE PAYER and NOT ALREADY SPLIT
                    const myTxns = details.transactions.filter((t: any) => t.user_id === user.id && !t.is_split);
                    setTransactions(myTxns);

                    // Default select all
                    const ids = new Set(myTxns.map((t: any) => t.id));
                    setSelectedTransactionIds(ids as Set<string>);
                }
                setLoading(false);
            }
        };
        loadData();
    }, [groupId, user]);

    // Derived State
    const totalSelectedAmount = useMemo(() => {
        return transactions
            .filter(t => selectedTransactionIds.has(t.id))
            .reduce((sum, t) => sum + t.amount, 0);
    }, [transactions, selectedTransactionIds]);

    const memberCount = members.length;

    // Calculate Splits
    const calculatedSplits = useMemo(() => {
        if (memberCount === 0) return {};

        const splits: Record<string, number> = {};

        if (splitMethod === 'equal') {
            const splitAmount = totalSelectedAmount / memberCount;
            members.forEach(m => {
                splits[m.id] = splitAmount;
            });
        } else {
            // Custom
            members.forEach(m => {
                splits[m.id] = parseFloat(customSplits[m.id] || '0') || 0;
            });
        }
        return splits;
    }, [totalSelectedAmount, memberCount, members, splitMethod, customSplits]);

    const myShare = calculatedSplits[user?.id || ''] || 0;
    const othersShare = totalSelectedAmount - myShare;
    const newClaim = othersShare;

    const handleSave = async () => {
        // Validation for Custom Split
        if (splitMethod === 'custom') {
            const totalCustom = Object.values(calculatedSplits).reduce((a, b) => a + b, 0);
            if (Math.abs(totalCustom - totalSelectedAmount) > 1) {
                Toast.show({
                    type: 'error',
                    text1: 'Invalid Amounts',
                    text2: `Total split (${totalCustom.toFixed(0)}) must equal selected amount (${totalSelectedAmount.toFixed(0)})`
                });
                return;
            }
        }

        try {
            setLoading(true);
            const splitsToSave: { transactionId: string; userId: string; amount: number; }[] = [];

            for (const txnId of selectedTransactionIds) {
                const txn = transactions.find(t => t.id === txnId);
                if (!txn) continue;

                members.forEach(m => {
                    const memberTotalShare = calculatedSplits[m.id];
                    const ratio = memberTotalShare / totalSelectedAmount;
                    const shareForTxn = txn.amount * ratio;

                    splitsToSave.push({
                        transactionId: txn.id,
                        userId: m.id,
                        amount: shareForTxn
                    });
                });
            }

            if (groupId) {
                await saveSplits(Array.isArray(groupId) ? groupId[0] : groupId, splitsToSave);
                router.back();
            }

        } catch (err) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to save splits'
            });
            setLoading(false);
        }
    };

    const toggleTransaction = (id: string) => {
        const next = new Set(selectedTransactionIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedTransactionIds(next);
    };

    if (loading) return (
        <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <QSHeader title="Split Expenses" showBack onBackPress={() => router.back()} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Hero Card */}
                <View style={styles.heroCardContainer}>
                    <LinearGradient
                        colors={theme.isDark ? ['#1e3a8a', '#3b82f6'] : ['#2563ea', '#3b82f6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroCard}
                    >
                        <View>
                            <Text style={styles.heroLabel}>Total Selected Spend</Text>
                            <Text style={styles.heroAmount}>₹{totalSelectedAmount.toFixed(0)}</Text>
                        </View>
                        <View style={styles.heroStatsRow}>
                            <View style={styles.heroStat}>
                                <Text style={styles.heroStatLabel}>Your Share</Text>
                                <Text style={styles.heroStatValue}>₹{myShare.toFixed(0)}</Text>
                            </View>
                            <View style={styles.dividerVertical} />
                            <View style={styles.heroStat}>
                                <Text style={styles.heroStatLabel}>Collectable</Text>
                                <Text style={[styles.heroStatValue, { color: '#a7f3d0' }]}>₹{newClaim.toFixed(0)}</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Split Method Segmented Control */}
                <View style={styles.segmentContainer}>
                    <TouchableOpacity
                        style={[styles.segmentButton, splitMethod === 'equal' && styles.segmentActive, { backgroundColor: splitMethod === 'equal' ? theme.colors.card : 'transparent' }]}
                        onPress={() => setSplitMethod('equal')}
                    >
                        <Text style={[styles.segmentText, { color: theme.colors.text, opacity: splitMethod === 'equal' ? 1 : 0.5 }]}>Equally</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.segmentButton, splitMethod === 'custom' && styles.segmentActive, { backgroundColor: splitMethod === 'custom' ? theme.colors.card : 'transparent' }]}
                        onPress={() => setSplitMethod('custom')}
                    >
                        <Text style={[styles.segmentText, { color: theme.colors.text, opacity: splitMethod === 'custom' ? 1 : 0.5 }]}>Custom</Text>
                    </TouchableOpacity>
                </View>

                {/* Member List */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Share Breakdown</Text>
                    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        {members.map((m, index) => (
                            <View key={m.id} style={[styles.memberRow, index < members.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
                                <View style={styles.memberInfo}>
                                    {m.avatar ? (
                                        <React.Fragment>
                                            {/* Need to import Image from react-native first if not imported, checking... already imported at top */}
                                            {/* Wait, the view_file shows Image is imported in line 5? No, line 5 has: ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View. Image is NOT imported. */}
                                            {/* I must add Image to imports first? No, I can use replace_file_content to add it or assumes it is there? */}
                                            {/* Let's check imports again. Line 3: import { Image, ... }? No line 5. */}
                                            {/* Ah, I missed looking at imports in view_file? Line 5: import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"; */}
                                            {/* Image is missing. I should add it. But I can't do two distinct edits easily with one replace_file_content unless contiguous. */}
                                            {/* I will use the fully qualified React Native Image if possible? No, standard import is better. */}
                                            {/* I will add Image to the import in a separate step or just assume I can edit imports with another call. */}
                                            {/* For now, let's just put the View logic here and I'll add Image import in next step or use multi_replace? */}
                                            {/* Actually, I can use multi_replace. */}
                                            <View style={[styles.avatarPlaceholder, { backgroundColor: 'transparent', overflow: 'hidden' }]}>
                                                {/* Use require or uri */}
                                                <Image source={{ uri: m.avatar }} style={{ width: '100%', height: '100%' }} />
                                            </View>
                                        </React.Fragment>
                                    ) : (
                                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                                            <Text style={styles.avatarText}>{m.username.charAt(0).toUpperCase()}</Text>
                                        </View>
                                    )}
                                    <Text style={[styles.memberName, { color: theme.colors.text }]}>
                                        {m.username} {m.id === user?.id && <Text style={{ color: theme.colors.primary }}>(You)</Text>}
                                    </Text>
                                </View>

                                {splitMethod === 'equal' ? (
                                    <Text style={[styles.amountText, { color: theme.colors.text }]}>₹{calculatedSplits[m.id]?.toFixed(0)}</Text>
                                ) : (
                                    <View style={styles.inputWrapper}>
                                        <Text style={[styles.currencyPrefix, { color: theme.colors.textSecondary }]}>₹</Text>
                                        <TextInput
                                            style={[styles.input, { color: theme.colors.text }]}
                                            keyboardType="numeric"
                                            value={customSplits[m.id] || ''}
                                            placeholder="0"
                                            placeholderTextColor={theme.colors.textSecondary}
                                            onChangeText={(v) => setCustomSplits(prev => ({ ...prev, [m.id]: v }))}
                                        />
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Transaction Selection */}
                <View style={[styles.section, { marginBottom: 100 }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Included Expenses</Text>
                    {transactions.length > 0 ? transactions.map(t => {
                        const isSelected = selectedTransactionIds.has(t.id);
                        return (
                            <TouchableOpacity
                                key={t.id}
                                style={[
                                    styles.txnItem,
                                    {
                                        backgroundColor: theme.colors.card,
                                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                                        borderWidth: isSelected ? 2 : 1
                                    }
                                ]}
                                onPress={() => toggleTransaction(t.id)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.categoryIcon, { backgroundColor: (t.category_color || theme.colors.primary) + '20' }]}>
                                    <MaterialCommunityIcons name={t.category_icon || 'cash'} size={20} color={t.category_color || theme.colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.txnName, { color: theme.colors.text }]}>{t.name}</Text>
                                    <Text style={styles.txnDate}>{new Date(t.date).toLocaleDateString()}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                    <Text style={[styles.txnAmount, { color: theme.colors.text }]}>₹{t.amount}</Text>
                                    {isSelected && <MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.primary} />}
                                </View>
                            </TouchableOpacity>
                        );
                    }) : (
                        <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', marginTop: 20 }}>No expenses found paid by you.</Text>
                    )}
                </View>

            </ScrollView>

            {/* Floating Action Button Footer */}
            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={[
                        styles.fabButton,
                        {
                            backgroundColor: theme.colors.primary,
                            opacity: totalSelectedAmount > 0 ? 1 : 0.6,
                            shadowColor: theme.colors.primary
                        }
                    ]}
                    disabled={totalSelectedAmount === 0}
                    onPress={handleSave}
                >
                    <Text style={styles.fabText}>Confirm Split</Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    heroCardContainer: {
        marginBottom: 24,
        borderRadius: 24,
        shadowColor: "#2563ea",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    heroCard: {
        padding: 24,
        borderRadius: 24,
        gap: 20,
    },
    heroLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    heroAmount: {
        color: '#FFFFFF',
        fontSize: 36,
        fontWeight: '700',
    },
    heroStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 12,
    },
    heroStat: {
        flex: 1,
        alignItems: 'center',
    },
    dividerVertical: {
        width: 1,
        height: '80%',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    heroStatLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginBottom: 2,
    },
    heroStatValue: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    segmentContainer: {
        flexDirection: 'row',
        padding: 4,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 16,
        marginBottom: 24,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
    },
    segmentActive: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    segmentText: {
        fontWeight: '600',
        fontSize: 14,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    memberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    memberName: {
        fontSize: 14,
        fontWeight: '600',
    },
    amountText: {
        fontSize: 16,
        fontWeight: '700',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 8,
        paddingHorizontal: 8,
        height: 36,
        width: 100,
    },
    currencyPrefix: {
        fontSize: 14,
        fontWeight: '600',
        marginRight: 4,
    },
    input: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'right',
        padding: 0,
    },
    txnItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        gap: 16,
    },
    categoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    txnName: {
        fontWeight: '600',
        fontSize: 14,
        marginBottom: 2,
    },
    txnDate: {
        fontSize: 12,
        color: '#94a3b8',
    },
    txnAmount: {
        fontWeight: '700',
        fontSize: 14,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 32,
        left: 20,
        right: 20,
    },
    fabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 20,
        gap: 8,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    fabText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
