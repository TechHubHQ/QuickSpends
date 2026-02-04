import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { QSBottomSheet } from "./QSBottomSheet";
import { QSDatePicker } from "./QSDatePicker";

interface QSCustomRangePickerProps {
    visible: boolean;
    onClose: () => void;
    onApply: (startDate: Date, endDate: Date) => void;
    initialStartDate?: Date;
    initialEndDate?: Date;
}

export function QSCustomRangePicker({
    visible,
    onClose,
    onApply,
    initialStartDate,
    initialEndDate
}: QSCustomRangePickerProps) {
    const { theme } = useTheme();
    const [startDate, setStartDate] = useState(initialStartDate || new Date());
    const [endDate, setEndDate] = useState(initialEndDate || new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const handleApply = () => {
        onApply(startDate, endDate);
        onClose();
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <QSBottomSheet
            visible={visible}
            onClose={onClose}
            title="Custom Range"
            showDoneButton
            onDone={handleApply}
        >
            <View style={styles.container}>
                <View style={styles.rangeContainer}>
                    <TouchableOpacity
                        style={[styles.dateButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                        onPress={() => setShowStartPicker(true)}
                    >
                        <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>From</Text>
                        <View style={styles.dateValueRow}>
                            <MaterialCommunityIcons name="calendar-import" size={20} color={theme.colors.primary} />
                            <Text style={[styles.dateValue, { color: theme.colors.text }]}>{formatDate(startDate)}</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.separator}>
                        <MaterialCommunityIcons name="arrow-right" size={20} color={theme.colors.textTertiary} />
                    </View>

                    <TouchableOpacity
                        style={[styles.dateButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                        onPress={() => setShowEndPicker(true)}
                    >
                        <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>To</Text>
                        <View style={styles.dateValueRow}>
                            <MaterialCommunityIcons name="calendar-export" size={20} color={theme.colors.primary} />
                            <Text style={[styles.dateValue, { color: theme.colors.text }]}>{formatDate(endDate)}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <QSDatePicker
                    visible={showStartPicker}
                    onClose={() => setShowStartPicker(false)}
                    selectedDate={startDate}
                    onSelect={setStartDate}
                />

                <QSDatePicker
                    visible={showEndPicker}
                    onClose={() => setShowEndPicker(false)}
                    selectedDate={endDate}
                    onSelect={setEndDate}
                />
            </View>
        </QSBottomSheet>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 20,
    },
    rangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateButton: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    dateLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    dateValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    separator: {
        width: 32,
        alignItems: 'center',
    }
});
