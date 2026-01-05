import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { QSBottomSheet } from "./QSBottomSheet";

interface Account {
    id: string;
    name: string;
    type: 'bank' | 'cash' | 'card';
    balance: number;
    currency: string;
}

interface QSAccountPickerProps {
    visible: boolean;
    onClose: () => void;
    accounts: Account[];
    selectedId?: string;
    onSelect: (account: Account | null) => void;
    excludeId?: string; // For transfer: exclude the "from" account
}

export function QSAccountPicker({
    visible,
    onClose,
    accounts,
    selectedId,
    onSelect,
    excludeId,
}: QSAccountPickerProps) {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredAccounts = accounts
        .filter(acc => acc.id !== excludeId)
        .filter(acc => acc.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleSelect = (account: Account) => {
        onSelect(account);
        onClose();
    };

    const getAccountIcon = (type: string) => {
        switch (type) {
            case 'bank': return 'bank';
            case 'cash': return 'cash';
            case 'card': return 'credit-card';
            default: return 'wallet';
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <QSBottomSheet
            visible={visible}
            onClose={onClose}
            title="Select Account"
            showSearch
            searchPlaceholder="Search accounts..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
        >
            <View style={styles.list}>
                {selectedId && (
                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => {
                            onSelect(null);
                            onClose();
                        }}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: theme.colors.error + '20' }]}>
                            <MaterialCommunityIcons name="close-circle-outline" size={24} color={theme.colors.error} />
                        </View>
                        <View style={styles.accountInfo}>
                            <Text style={[styles.itemText, { color: theme.colors.text }]}>Clear Selection</Text>
                            <Text style={[styles.balanceText, { color: theme.isDark ? '#94A3B8' : '#64748B' }]}>
                                Deselect current account
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
                {filteredAccounts.map((account) => {
                    const isSelected = account.id === selectedId;
                    return (
                        <TouchableOpacity
                            key={account.id}
                            style={[
                                styles.item,
                                isSelected && {
                                    backgroundColor: theme.colors.primary + '10',
                                    borderColor: theme.colors.primary + '30',
                                }
                            ]}
                            onPress={() => handleSelect(account)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#10B981' + '20' }]}>
                                <MaterialCommunityIcons name={getAccountIcon(account.type) as any} size={24} color="#10B981" />
                            </View>
                            <View style={styles.accountInfo}>
                                <Text style={[styles.itemText, { color: theme.colors.text }]}>
                                    {account.name}
                                </Text>
                                <Text style={[styles.balanceText, { color: theme.isDark ? '#94A3B8' : '#64748B' }]}>
                                    {formatCurrency(account.balance, account.currency)}
                                </Text>
                            </View>
                            {isSelected && (
                                <MaterialCommunityIcons name="check-circle" size={28} color={theme.colors.primary} />
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
    accountInfo: {
        flex: 1,
    },
    itemText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    balanceText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
