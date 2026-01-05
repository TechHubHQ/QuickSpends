import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { QSButton } from "../src/components/QSButton";
import { QSHeader } from "../src/components/QSHeader";
import { useAuth } from "../src/context/AuthContext";
import { SavingsGoal, useSavings } from "../src/hooks/useSavings";
import { useTheme } from "../src/theme/ThemeContext";

export default function SavingsScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const { getSavingsGoals, deleteSavingsGoal, getSavingsProgress } = useSavings();

    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchGoals = async () => {
        if (!user) return;
        setLoading(true);
        const data = await getSavingsGoals(user.id);
        setGoals(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchGoals();
    }, [user]);

    const renderGoal = ({ item, index }: { item: SavingsGoal; index: number }) => {
        const progress = getSavingsProgress(item);

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 100).springify()}
                style={[styles.goalCard, { backgroundColor: theme.colors.surface, borderColor: theme.isDark ? '#334155' : '#E2E8F0' }]}
            >
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push({ pathname: "/saving-details/[id]", params: { id: item.id } })}
                >
                    <View style={styles.goalHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: (item.category_color || theme.colors.primary) + '20' }]}>
                            <MaterialCommunityIcons
                                name={(item.category_icon as any) || "piggy-bank"}
                                size={24}
                                color={item.category_color || theme.colors.primary}
                            />
                        </View>
                        <View style={styles.goalTitleInfo}>
                            <Text style={[styles.goalName, { color: theme.colors.text }]}>{item.name}</Text>
                            <Text style={[styles.categoryName, { color: theme.isDark ? '#94A3B8' : '#64748B' }]}>
                                {item.category_name || "General Savings"}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); deleteSavingsGoal(item.id).then(fetchGoals); }}>
                            <MaterialCommunityIcons name="delete-outline" size={24} color="#EF4444" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.progressSection}>
                        <View style={styles.progressTextRow}>
                            <Text style={[styles.amountText, { color: theme.colors.text }]}>
                                ₹{item.current_amount.toLocaleString()} <Text style={styles.targetText}>/ ₹{item.target_amount.toLocaleString()}</Text>
                            </Text>
                            <Text style={[styles.progressPercentage, { color: theme.colors.primary }]}>
                                {Math.round(progress)}%
                            </Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: theme.colors.primary }]} />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.addTransactionButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            router.push({ pathname: "/add-transaction", params: { initialType: 'income', savingsId: item.id } });
                        }}
                    >
                        <MaterialCommunityIcons name="plus" size={20} color={theme.colors.primary} />
                        <Text style={[styles.addTransactionText, { color: theme.colors.primary }]}>Add Funds</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <QSHeader title="My Savings" showBack onBackPress={() => router.back()} />

            <FlatList
                data={goals}
                renderItem={renderGoal}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="piggy-bank-outline" size={80} color={theme.isDark ? '#334155' : '#E2E8F0'} />
                        <Text style={[styles.emptyText, { color: theme.isDark ? '#94A3B8' : '#64748B' }]}>
                            No savings goals yet. Start small, dream big!
                        </Text>
                        <QSButton
                            title="Create Goal"
                            onPress={() => router.push("/add-saving")}
                            variant="primary"
                            style={styles.emptyButton}
                        />
                    </View>
                }
                refreshing={loading}
                onRefresh={fetchGoals}
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                onPress={() => router.push("/add-saving")}
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
    goalCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    goalHeader: {
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
    goalTitleInfo: {
        flex: 1,
    },
    goalName: {
        fontSize: 18,
        fontWeight: '700',
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '500',
    },
    progressSection: {
        marginBottom: 16,
    },
    progressTextRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    amountText: {
        fontSize: 16,
        fontWeight: '700',
    },
    targetText: {
        fontSize: 14,
        fontWeight: '500',
        opacity: 0.6,
    },
    progressPercentage: {
        fontSize: 16,
        fontWeight: '700',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    addTransactionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(148, 163, 184, 0.05)',
        gap: 6,
    },
    addTransactionText: {
        fontSize: 15,
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
