import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { QSBottomSheet } from "./QSBottomSheet";

interface Loan {
    id: string;
    person_name: string;
    type: 'lent' | 'borrowed';
    remaining_amount: number;
    total_amount: number;
}

interface QSLoanPickerProps {
    visible: boolean;
    onClose: () => void;
    loans: Loan[];
    selectedId?: string;
    onSelect: (loan: Loan) => void;
}

export function QSLoanPicker({
    visible,
    onClose,
    loans,
    selectedId,
    onSelect,
}: QSLoanPickerProps) {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredLoans = loans.filter(loan =>
        loan.person_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (loan: Loan) => {
        onSelect(loan);
        onClose();
    };

    return (
        <QSBottomSheet
            visible={visible}
            onClose={onClose}
            title="Select Loan"
            showSearch
            searchPlaceholder="Search loans..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
        >
            <View style={styles.list}>
                {filteredLoans.map((loan) => {
                    const isSelected = loan.id === selectedId;
                    return (
                        <TouchableOpacity
                            key={loan.id}
                            style={[
                                styles.item,
                                isSelected && {
                                    backgroundColor: theme.colors.primary + '10',
                                    borderColor: theme.colors.primary + '30',
                                }
                            ]}
                            onPress={() => handleSelect(loan)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: loan.type === 'lent' ? '#10B98120' : '#EF444420' }]}>
                                <MaterialCommunityIcons
                                    name={loan.type === 'lent' ? "hand-coin" : "hand-peace"}
                                    size={24}
                                    color={loan.type === 'lent' ? '#10B981' : '#EF4444'}
                                />
                            </View>
                            <View style={styles.loanInfo}>
                                <Text style={[styles.itemText, { color: theme.colors.text }]}>
                                    {loan.person_name}
                                </Text>
                                <Text style={[styles.typeText, { color: loan.type === 'lent' ? '#10B981' : '#EF4444' }]}>
                                    {loan.type.charAt(0).toUpperCase() + loan.type.slice(1)}
                                </Text>
                                <Text style={[styles.amountText, { color: theme.isDark ? '#94A3B8' : '#64748B' }]}>
                                    Remaining: ₹{loan.remaining_amount.toLocaleString()}
                                </Text>
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
    loanInfo: {
        flex: 1,
    },
    itemText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    typeText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    amountText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
