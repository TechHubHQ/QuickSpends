import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import Toast from "react-native-toast-message";
import { Avatar } from "../components/Avatar";
import { QSAccountPicker } from "../components/QSAccountPicker";
import { QSButton } from "../components/QSButton";
import { QSDatePicker } from "../components/QSDatePicker";
import { QSHeader } from "../components/QSHeader";
import { useAuth } from "../context/AuthContext";
import { useAccounts } from "../hooks/useAccounts";
import { useGroups } from "../hooks/useGroups";
import { useTransactions } from "../hooks/useTransactions";
import { createStyles } from "../styles/QSSettleUp.styles";
import { useTheme } from "../theme/ThemeContext";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PayeeSelection {
    userId: string;
    amount: string;
    maxAmount: number;
}

export default function QSSettleUpScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const { user } = useAuth();

    const { getGroupDetails, saveSplits } = useGroups();
    const { addTransaction } = useTransactions();
    const { getAccountsByUser } = useAccounts();

    const [group, setGroup] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [payerId, setPayerId] = useState<string>("");
    const [date, setDate] = useState(new Date());
    const [userAccounts, setUserAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<any>(null); // State for selected account

    // Multi-Select State
    const [payees, setPayees] = useState<PayeeSelection[]>([]);

    // UI State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showAccountPicker, setShowAccountPicker] = useState(false); // State for picker visibility

    useEffect(() => {
        if (id && user) {
            loadGroupDetails();
            loadAccounts();
        }
    }, [id, user]);

    const loadAccounts = async () => {
        if (!user) return;
        const accs = await getAccountsByUser(user.id);
        setUserAccounts(accs);
        if (accs.length > 0) {
            setSelectedAccount(accs[0]); // Default to first account
        }
    };

    const loadGroupDetails = async () => {
        if (!user) return;
        const details = await getGroupDetails(id as string, user.id);
        setGroup(details);
        setPayerId(user.id);
        setLoading(false);
    };

    const members = useMemo(() => group?.members || [], [group]);
    const payer = members.find((m: any) => m.id === payerId);

    // Filter potential payees (everyone except payer)
    // We prioritize people I owe money to (bilateral_balance < 0)
    const potentialPayees = useMemo(() => {
        return members.filter((m: any) => m.id !== payerId)
            .sort((a: any, b: any) => (a.bilateral_balance || 0) - (b.bilateral_balance || 0)); // Sort by who I owe most (most negative)
    }, [members, payerId]);

    const handleTogglePayee = (member: any) => {
        setPayees(current => {
            const exists = current.find(p => p.userId === member.id);
            if (exists) {
                return current.filter(p => p.userId !== member.id);
            } else {
                // Auto-fill Logic: STRICTLY Bilateral Debt
                // If I owe them (bilateral_balance < 0), suggest that amount.
                // Otherwise suggest 0 (or don't select? But user clicked, so select with 0 or full balance?)
                // User requirement: "auto select ... amount we are owed to that user"
                const bilateral = member.bilateral_balance || 0;
                let suggested = 0;

                if (bilateral < 0) {
                    suggested = Math.abs(bilateral);
                }

                return [...current, {
                    userId: member.id,
                    amount: suggested > 0 ? suggested.toFixed(0) : '',
                    maxAmount: 999999
                }];
            }
        });
    };

    const updatePayeeAmount = (userId: string, text: string) => {
        setPayees(current => current.map(p => {
            if (p.userId === userId) {
                return { ...p, amount: text };
            }
            return p;
        }));
    };

    const handleSelectAll = () => {
        const owedUsers = potentialPayees.filter((m: any) => (m.bilateral_balance || 0) < 0);

        const allOwedSelected = owedUsers.every((m: any) => payees.some(p => p.userId === m.id));

        if (allOwedSelected) {
            setPayees([]);
        } else {
            const newPayees = owedUsers.map((m: any) => {
                const suggested = Math.abs(m.bilateral_balance || 0);
                return {
                    userId: m.id,
                    amount: suggested.toFixed(0),
                    maxAmount: 999999
                };
            });
            setPayees(newPayees);
        }
    };

    const totalAmount = payees.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const handleSave = async () => {
        if (payees.length === 0) {
            Toast.show({
                type: 'info',
                text1: 'No Payees',
                text2: 'Please select at least one person to pay.'
            });
            return;
        }
        if (totalAmount <= 0) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Amount',
                text2: 'Total payment amount must be greater than 0.'
            });
            return;
        }
        if (!selectedAccount) {
            Toast.show({
                type: 'info',
                text1: 'Select Account',
                text2: 'Please select an account to pay from.'
            });
            return;
        }

        setSaving(true);
        try {
            // Determine Account ID
            const accountId = selectedAccount?.id || 'external_account'; // Fallback shouldn't happen due to check, but safe

            // 1. Create Transaction (Parent)
            const txnId = await addTransaction({
                user_id: payerId,
                account_id: accountId,
                type: 'expense',
                name: 'Settlement',
                amount: totalAmount,
                date: date.toISOString(),
                group_id: id as string,
                category_id: 'settlement',
                category_name: 'Settlement',
                category_icon: 'handshake',
                category_color: '#10B981',
                description: `Settled with ${payees.length} members`,
            });

            if (txnId) {
                // 2. Create Splits
                // We create a split for each payee with their specific amount
                const splits = payees.map(p => ({
                    transactionId: txnId,
                    userId: p.userId,
                    amount: parseFloat(p.amount) || 0
                }));

                await saveSplits(id as string, splits);

                await saveSplits(id as string, splits);

                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Settlement recorded!'
                });
                router.back();
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to record transaction.'
                });
            }
        } catch (e) {
            console.error(e);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'An error occurred.'
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <QSHeader title="Settle Up" showBack onBackPress={() => router.back()} />
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                </View>

            ) : (
                <>
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <QSHeader title="Settle Up" showBack onBackPress={() => router.back()} />
                        {/* Payer Section */}
                        <View style={styles.heroSection}>
                            <Text style={{ color: theme.colors.textSecondary, marginBottom: 8, fontWeight: '600' }}>PAYING FROM</Text>
                            <View style={styles.heroRow}>
                                <View style={styles.avatarContainer}>
                                    <Avatar
                                        seed={payer?.avatar || payer?.username || "User"}
                                        size={48} // Assuming avatar size from styles if not explicit, but 48 fits well
                                        variant="beam"
                                    />
                                </View>
                                <View style={{ flex: 1, alignItems: 'flex-start' }}>
                                    <Text style={[styles.userName, { textAlign: 'left' }]}>{payer?.id === user?.id ? "You" : payer?.username.split(' ')[0]}</Text>
                                    <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                                        Total Balance: {payer?.balance < 0 ? `Owes ₹${Math.abs(payer.balance).toFixed(0)}` : `Gets ₹${payer?.balance?.toFixed(0)}`}
                                    </Text>
                                </View>
                            </View>

                            {/* Account Selection */}
                            <TouchableOpacity
                                style={[styles.detailRow, { backgroundColor: 'rgba(255,255,255,0.05)', marginTop: 8, borderRadius: 12, padding: 12 }]}
                                onPress={() => setShowAccountPicker(true)}
                            >
                                <View style={[styles.detailIcon, { backgroundColor: '#10B981' + '20' }]}>
                                    <MaterialCommunityIcons name={selectedAccount ? (selectedAccount.type === 'bank' ? 'bank' : 'wallet') : 'bank-plus'} size={20} color="#10B981" />
                                </View>
                                <View style={styles.detailContent}>
                                    <Text style={styles.detailLabel}>Pay Using</Text>
                                    <Text style={[styles.detailValue, { color: selectedAccount ? theme.colors.text : theme.colors.textTertiary }]}>
                                        {selectedAccount ? selectedAccount.name : "Select Account"}
                                    </Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Payees List */}
                        <View style={styles.detailsSection}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <Text style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>PAYING TO</Text>
                                {potentialPayees.some((m: any) => (m.bilateral_balance || 0) < 0) && (
                                    <TouchableOpacity onPress={handleSelectAll}>
                                        <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
                                            {potentialPayees.filter((m: any) => (m.bilateral_balance || 0) < 0).every((m: any) => payees.some(p => p.userId === m.id)) && payees.length > 0 ? "Deselect All" : "Select All I Owe"}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {!potentialPayees.some((m: any) => (m.bilateral_balance || 0) < 0) ? (
                                <View style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
                                    <MaterialCommunityIcons name="check-circle-outline" size={48} color={theme.colors.success} />
                                    <Text style={{ marginTop: 12, fontSize: 16, color: theme.colors.textSecondary, fontWeight: '500' }}>You have nothing to settle!</Text>
                                </View>
                            ) : (
                                potentialPayees.map((member: any) => {
                                    const isSelected = payees.some(p => p.userId === member.id);
                                    const selection = payees.find(p => p.userId === member.id);
                                    const bilateral = member.bilateral_balance || 0;
                                    const iOweThem = bilateral < 0;

                                    // Optional: Hide people I don't owe? The user request was "when user has nothing to settle...".
                                    // If I owe someone, I probably only want to see them.
                                    // But let's stick to the specific "nothing to settle" block first.
                                    // For better UX, maybe we should only show people I owe?
                                    // Let's keep showing everyone but emphasized.

                                    return (
                                        <View key={member.id} style={[
                                            styles.payeeRow,
                                            {
                                                backgroundColor: theme.colors.card,
                                                borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                                                borderWidth: isSelected ? 2 : 1
                                            }
                                        ]}>
                                            <TouchableOpacity
                                                style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}
                                                onPress={() => handleTogglePayee(member)}
                                            >
                                                <MaterialIcons
                                                    name={isSelected ? "check-circle" : "radio-button-unchecked"}
                                                    size={24}
                                                    color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                                                />
                                                <View>
                                                    <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 16 }}>
                                                        {member.username}
                                                    </Text>
                                                    {iOweThem ? (
                                                        <Text style={{ color: theme.colors.error, fontSize: 12, fontWeight: '600' }}>
                                                            You owe ₹{Math.abs(bilateral).toFixed(0)}
                                                        </Text>
                                                    ) : (
                                                        <Text style={{ color: theme.colors.success, fontSize: 12 }}>
                                                            {bilateral > 0 ? `Owes you ₹${bilateral.toFixed(0)}` : 'Settled'}
                                                        </Text>
                                                    )}
                                                </View>
                                            </TouchableOpacity>

                                            {isSelected && (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                    <Text style={{ fontSize: 16, color: theme.colors.text, fontWeight: '600' }}>₹</Text>
                                                    <TextInput
                                                        style={{
                                                            fontSize: 18,
                                                            fontWeight: 'bold',
                                                            color: theme.colors.text,
                                                            minWidth: 60,
                                                            textAlign: 'center',
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: theme.colors.border
                                                        }}
                                                        placeholder="0"
                                                        value={selection?.amount}
                                                        onChangeText={(t) => updatePayeeAmount(member.id, t)}
                                                        keyboardType="numeric"
                                                    />
                                                </View>
                                            )}
                                        </View>
                                    );
                                })
                            )}
                        </View>

                        {/* Date Picker */}
                        <TouchableOpacity style={[styles.detailRow, { marginTop: 8 }]} onPress={() => setShowDatePicker(true)}>
                            <View style={styles.detailIcon}>
                                <MaterialCommunityIcons name="calendar" size={20} color="#FB923C" />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Date</Text>
                                <Text style={styles.detailValue}>
                                    {date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
                        </TouchableOpacity>

                        <View style={{ height: 100 }} />
                    </ScrollView>

                    <View style={styles.footer}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, paddingHorizontal: 4 }}>
                            <Text style={{ color: theme.colors.textSecondary }}>Total Payable</Text>
                            <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '700' }}>₹{totalAmount.toFixed(0)}</Text>
                        </View>
                        <QSButton
                            title={`Pay ₹${totalAmount.toFixed(0)}`}
                            onPress={handleSave}
                            loading={saving}
                            disabled={payees.length === 0}
                            variant="primary"
                            style={styles.saveButton}
                        />
                    </View>

                    <QSDatePicker
                        visible={showDatePicker}
                        onClose={() => setShowDatePicker(false)}
                        selectedDate={date}
                        onSelect={setDate}
                    />

                    <QSAccountPicker
                        visible={showAccountPicker}
                        onClose={() => setShowAccountPicker(false)}
                        accounts={userAccounts}
                        selectedId={selectedAccount?.id}
                        onSelect={setSelectedAccount}
                    />
                </>
            )}
        </View>
    );
}
