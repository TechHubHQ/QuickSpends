import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { QSBottomSheet } from "./QSBottomSheet";

interface SavingsGoal {
    id: string;
    name: string;
    target_amount: number;
    current_amount: number;
}

interface QSSavingsPickerProps {
    visible: boolean;
    onClose: () => void;
    goals: SavingsGoal[];
    selectedId?: string;
    onSelect: (goal: SavingsGoal) => void;
}

export function QSSavingsPicker({
    visible,
    onClose,
    goals,
    selectedId,
    onSelect,
}: QSSavingsPickerProps) {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredGoals = goals.filter(goal =>
        goal.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (goal: SavingsGoal) => {
        onSelect(goal);
        onClose();
    };

    return (
        <QSBottomSheet
            visible={visible}
            onClose={onClose}
            title="Select Savings Goal"
            showSearch
            searchPlaceholder="Search goals..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
        >
            <View style={styles.list}>
                {filteredGoals.map((goal) => {
                    const isSelected = goal.id === selectedId;
                    const progress = (goal.current_amount / goal.target_amount) * 100;
                    return (
                        <TouchableOpacity
                            key={goal.id}
                            style={[
                                styles.item,
                                isSelected && {
                                    backgroundColor: theme.colors.primary + '10',
                                    borderColor: theme.colors.primary + '30',
                                }
                            ]}
                            onPress={() => handleSelect(goal)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                                <MaterialCommunityIcons name="piggy-bank" size={24} color={theme.colors.primary} />
                            </View>
                            <View style={styles.goalInfo}>
                                <Text style={[styles.itemText, { color: theme.colors.text }]}>
                                    {goal.name}
                                </Text>
                                <Text style={[styles.amountText, { color: theme.isDark ? '#94A3B8' : '#64748B' }]}>
                                    ₹{goal.current_amount.toLocaleString()} / ₹{goal.target_amount.toLocaleString()}
                                </Text>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${Math.min(100, progress)}%`, backgroundColor: theme.colors.primary }]} />
                                </View>
                            </View>
                            {isSelected ? (
                                <MaterialCommunityIcons name="check-circle" size={28} color={theme.colors.primary} />
                            ) : (
                                <MaterialCommunityIcons name="radiobox-blank" size={28} color={theme.isDark ? '#475569' : '#CBD5E1'} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </QSBottomSheet>
    );
}

const styles = StyleSheet.create({
    list: {
        gap: 8,
        paddingBottom: 24,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    goalInfo: {
        flex: 1,
    },
    itemText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    amountText: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 6,
    },
    progressBarBg: {
        height: 4,
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
    },
});
