import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { QSButton } from "../components/QSButton";
import { QSHeader } from "../components/QSHeader";
import { useAuth } from "../context/AuthContext";
import { useSettlements, Settlement } from "../hooks/useSettlements";
import { useTheme } from "../theme/ThemeContext";
import { createStyles } from "../styles/QSSettlement.styles";
import { useFocusEffect } from 'expo-router';

export default function QSSettlementsScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const { getSettlements, getSettlementProgress, loading } = useSettlements();
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const styles = createStyles(theme);

    const fetchSettlements = useCallback(async () => {
        if (!user) return;
        const data = await getSettlements(user.id);
        setSettlements(data);
    }, [user, getSettlements]);

    useFocusEffect(useCallback(() => {
        fetchSettlements();
    }, [fetchSettlements]));

    const renderSettlement = ({ item }: { item: Settlement }) => {
        const progress = getSettlementProgress(item);
        const remaining = item.total_amount - item.settled_amount;
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push({ pathname: "/settlement-details/[id]" as any, params: { id: item.id } })}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <View style={[styles.iconCircle, { backgroundColor: item.type === 'lent' ? '#4F46E5' : '#EC4899' }]}>
                            <MaterialCommunityIcons
                                name={item.type === 'lent' ? 'cash-remove' : 'cash-plus'}
                                size={20}
                                color="#FFFFFF"
                            />
                        </View>
                        <View>
                            <Text style={styles.cardTitle}>{item.name}</Text>
                            <Text style={styles.cardSubtitle}>{item.person_name}</Text>
                        </View>
                    </View>
                    <View style={styles.statusBadge}>
                        <Text style={[styles.statusText, { color: item.status === 'active' ? theme.colors.warning : theme.colors.success }]}>
                            {item.status}
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
                        <Text style={styles.footerAmount}>₹{item.total_amount.toFixed(2)}</Text>
                    </View>
                    <View>
                        <Text style={styles.footerLabel}>Remaining</Text>
                        <Text style={[styles.footerAmount, { color: remaining > 0 ? theme.colors.error : theme.colors.success }]}>₹{remaining.toFixed(2)}</Text>
                    </View>
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{item.type === 'lent' ? 'To Collect' : 'To Pay'}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <QSHeader title="Settlements" showBack onBackPress={() => router.back()} />
            <FlatList
                data={settlements}
                renderItem={renderSettlement}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchSettlements} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialCommunityIcons name="handshake-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={styles.emptyTitle}>No Settlements</Text>
                        <Text style={styles.emptySubtitle}>Track money owed to or by others</Text>
                    </View>
                }
            />
            <View style={styles.fab}>
                <QSButton
                    title="New Settlement"
                    onPress={() => router.push("/add-settlement" as any)}
                    variant="primary"
                />
            </View>
        </View>
    );
}
