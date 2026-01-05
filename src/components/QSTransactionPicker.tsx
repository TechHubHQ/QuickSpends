import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { QSBottomSheet } from "./QSBottomSheet";

interface QSTransactionPickerProps {
    visible: boolean;
    onClose: () => void;
    transactions: any[];
    selectedIds: Set<string>;
    onToggle: (id: string, amount: number) => void;
}

export function QSTransactionPicker({
    visible,
    onClose,
    transactions,
    selectedIds,
    onToggle
}: QSTransactionPickerProps) {
    const { theme } = useTheme();
    const styles = createStyles(theme.colors, theme.isDark);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredTransactions = useMemo(() => {
        if (!searchQuery) return transactions;
        const lower = searchQuery.toLowerCase();
        return transactions.filter(t =>
            t.name.toLowerCase().includes(lower) ||
            (t.amount && t.amount.toString().includes(lower))
        );
    }, [transactions, searchQuery]);

    return (
        <QSBottomSheet
            visible={visible}
            onClose={onClose}
            title="Select Transactions"
            showSearch
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            showDoneButton
            onDone={onClose}
        >
            <View style={styles.list}>
                {filteredTransactions.length === 0 ? (
                    <Text style={styles.emptyText}>No eligible transactions found.</Text>
                ) : (
                    filteredTransactions.map((txn) => {
                        const isSelected = selectedIds.has(txn.id);
                        return (
                            <TouchableOpacity
                                key={txn.id}
                                style={[
                                    styles.item,
                                    isSelected && { backgroundColor: theme.colors.primary + '20' } // minimal tint
                                ]}
                                onPress={() => onToggle(txn.id, txn.amount)}
                            >
                                <MaterialCommunityIcons
                                    name={isSelected ? "checkbox-marked" : "checkbox-blank-outline"}
                                    size={24}
                                    color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                                />
                                <View style={styles.itemContent}>
                                    <Text style={styles.itemName} numberOfLines={1}>{txn.name}</Text>
                                    <Text style={styles.itemDate}>{new Date(txn.date).toLocaleDateString()}</Text>
                                </View>
                                <Text style={[styles.itemAmount, isSelected && { color: theme.colors.primary }]}>
                                    ₹{txn.amount}
                                </Text>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>
        </QSBottomSheet>
    );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    list: {
        paddingBottom: 24,
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#334155" : "#E2E8F0",
    },
    itemContent: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    itemName: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.text,
        marginBottom: 2,
    },
    itemDate: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    itemAmount: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.text,
    },
    emptyText: {
        textAlign: 'center',
        padding: 24,
        color: colors.textSecondary,
    }
});
