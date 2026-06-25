import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { QSButton } from "../components/QSButton";
import { QSHeader } from "../components/QSHeader";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import { Settlement, useSettlements } from "../hooks/useSettlements";
import { useTheme } from "../theme/ThemeContext";
import { createStyles } from "../styles/QSSettlement.styles";

export default function QSSettlementDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const { getSettlement, updateSettlement, deleteSettlement, getSettlementProgress, loading } = useSettlements();
    const { showAlert } = useAlert();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [settlement, setSettlement] = useState<Settlement | null>(null);
    const [addAmount, setAddAmount] = useState("");

    const fetchSettlement = useCallback(async () => {
        if (!id) return;
        const data = await getSettlement(id);
        setSettlement(data);
    }, [id, getSettlement]);

    React.useEffect(() => {
        fetchSettlement();
    }, [fetchSettlement]);

    const progress = settlement ? getSettlementProgress(settlement) : 0;
    const remaining = settlement ? settlement.total_amount - settlement.settled_amount : 0;

    const handleMarkPaid = async (amount: number) => {
        if (!settlement) return;
        const newSettled = Math.min(settlement.settled_amount + amount, settlement.total_amount);
        const newStatus = newSettled >= settlement.total_amount ? 'closed' : 'active';
        const success = await updateSettlement(settlement.id, { settled_amount: newSettled, status: newStatus });
        if (success) {
            Toast.show({ type: 'success', text1: 'Updated', text2: `₹${amount.toFixed(2)} marked as paid` });
            fetchSettlement();
        }
    };

    const handleDelete = () => {
        if (!settlement) return;
        showAlert("Delete Settlement", `Delete "${settlement.name}"? This cannot be undone.`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                const success = await deleteSettlement(settlement.id);
                if (success) {
                    Toast.show({ type: 'success', text1: 'Deleted', text2: 'Settlement removed' });
                    router.back();
                }
            }}
        ]);
    };

    if (!settlement) {
        return (
            <View style={styles.container}>
                <QSHeader title="Settlement Details" showBack onBackPress={() => router.back()} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <QSHeader title="Settlement Details" showBack onBackPress={() => router.back()} />
            <ScrollView contentContainerStyle={styles.list}>
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                            <View style={[styles.iconCircle, { backgroundColor: settlement.type === 'lent' ? '#4F46E5' : '#EC4899' }]}>
                                <MaterialCommunityIcons
                                    name={settlement.type === 'lent' ? 'cash-remove' : 'cash-plus'}
                                    size={24}
                                    color="#FFFFFF"
                                />
                            </View>
                            <View>
                                <Text style={[styles.cardTitle, { fontSize: 20 }]}>{settlement.name}</Text>
                                <Text style={styles.cardSubtitle}>{settlement.person_name}</Text>
                            </View>
                        </View>
                        <View style={styles.statusBadge}>
                            <Text style={[styles.statusText, { color: settlement.status === 'active' ? theme.colors.warning : theme.colors.success }]}>
                                {settlement.status}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: progress >= 100 ? theme.colors.success : theme.colors.primary }]} />
                        </View>
                        <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
                    </View>

                    <View style={styles.cardFooter}>
                        <View>
                            <Text style={styles.footerLabel}>Total</Text>
                            <Text style={styles.footerAmount}>₹{settlement.total_amount.toFixed(2)}</Text>
                        </View>
                        <View>
                            <Text style={styles.footerLabel}>Settled</Text>
                            <Text style={[styles.footerAmount, { color: theme.colors.success }]}>₹{settlement.settled_amount.toFixed(2)}</Text>
                        </View>
                        <View>
                            <Text style={styles.footerLabel}>Remaining</Text>
                            <Text style={[styles.footerAmount, { color: remaining > 0 ? theme.colors.error : theme.colors.success }]}>₹{remaining.toFixed(2)}</Text>
                        </View>
                    </View>

                    {settlement.notes && (
                        <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.isDark ? '#334155' : '#E2E8F0' }}>
                            <Text style={styles.footerLabel}>Notes</Text>
                            <Text style={{ color: theme.colors.text, marginTop: 4 }}>{settlement.notes}</Text>
                        </View>
                    )}
                </Animated.View>

                {settlement.status === 'active' && (
                    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.card}>
                        <Text style={[styles.cardTitle, { marginBottom: 16 }]}>Quick Actions</Text>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            {[remaining * 0.25, remaining * 0.5, remaining].filter(v => v > 0).map((amount, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={{
                                        flex: 1,
                                        backgroundColor: theme.isDark ? '#1E293B' : '#F8FAFC',
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: theme.isDark ? '#334155' : '#E2E8F0',
                                        padding: 12,
                                        alignItems: 'center',
                                    }}
                                    onPress={() => handleMarkPaid(amount)}
                                >
                                    <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 }}>
                                        {idx === 0 ? '25%' : idx === 1 ? '50%' : 'Full'}
                                    </Text>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.primary }}>
                                        ₹{amount.toFixed(0)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>
                )}

                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.card}>
                    <Text style={[styles.cardTitle, { marginBottom: 8 }]}>Details</Text>
                    <View style={{ gap: 8 }}>
                        <DetailRow icon="cash" label="Type" value={settlement.type === 'lent' ? 'I Lent' : 'I Borrowed'} theme={theme} />
                        <DetailRow icon="account" label="Person" value={settlement.person_name} theme={theme} />
                        {settlement.due_date && (
                            <DetailRow icon="calendar" label="Due Date" value={new Date(settlement.due_date).toLocaleDateString()} theme={theme} />
                        )}
                        <DetailRow icon="clock-outline" label="Created" value={new Date(settlement.created_at).toLocaleDateString()} theme={theme} />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).springify()}>
                    <TouchableOpacity
                        onPress={handleDelete}
                        disabled={loading}
                        style={{
                            backgroundColor: `${theme.colors.error}15`,
                            borderRadius: 12,
                            padding: 16,
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: `${theme.colors.error}30`,
                        }}
                    >
                        <Text style={{ color: theme.colors.error, fontWeight: '600', fontSize: 16 }}>
                            {loading ? 'Deleting...' : 'Delete Settlement'}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

function DetailRow({ icon, label, value, theme }: { icon: string; label: string; value: string; theme: any }) {
    const styles = createStyles(theme);
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name={icon as any} size={18} color={theme.colors.textSecondary} />
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>{label}</Text>
            </View>
            <Text style={{ color: theme.colors.text, fontWeight: '500', fontSize: 14 }}>{value}</Text>
        </View>
    );
}
