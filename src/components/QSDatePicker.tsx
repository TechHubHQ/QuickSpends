import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { useTheme } from "../theme/ThemeContext";
import { QSBottomSheet } from "./QSBottomSheet";

interface QSDatePickerProps {
    visible: boolean;
    onClose: () => void;
    selectedDate: Date;
    onSelect: (date: Date) => void;
}

export function QSDatePicker({
    visible,
    onClose,
    selectedDate,
    onSelect,
}: QSDatePickerProps) {
    const { theme } = useTheme();
    const [tempDate, setTempDate] = useState(selectedDate);
    const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});

    useEffect(() => {
        setTempDate(selectedDate);
    }, [selectedDate, visible]);

    const getLocalDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        const dateString = getLocalDateString(tempDate);
        setMarkedDates({
            [dateString]: {
                selected: true,
                selectedColor: theme.colors.primary,
                textColor: '#FFFFFF'
            }
        });
    }, [tempDate, theme.colors.primary]);

    const handleConfirm = () => {
        onSelect(tempDate);
        onClose();
    };

    const handleDayPress = (day: DateData) => {
        // Create date from YYYY-MM-DD string to avoid timezone issues
        const [year, month, dayNum] = day.dateString.split('-').map(Number);
        const newDate = new Date(year, month - 1, dayNum);
        setTempDate(newDate);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const setQuickDate = (offsetDays: number) => {
        const date = new Date();
        date.setDate(date.getDate() + offsetDays);
        setTempDate(date);
    };

    return (
        <QSBottomSheet
            visible={visible}
            onClose={onClose}
            title="Select Date"
            showDoneButton
            onDone={handleConfirm}
        >
            <View style={styles.container}>
                <View style={[styles.selectedDateCard, { backgroundColor: theme.colors.primary + '10' }]}>
                    <MaterialCommunityIcons name="calendar" size={24} color={theme.colors.primary} />
                    <Text style={[styles.selectedDateText, { color: theme.colors.text }]}>
                        {formatDate(tempDate)}
                    </Text>
                </View>

                <Calendar
                    current={getLocalDateString(tempDate)}
                    onDayPress={handleDayPress}
                    markedDates={markedDates}
                    theme={{
                        backgroundColor: 'transparent',
                        calendarBackground: 'transparent',
                        textSectionTitleColor: theme.isDark ? '#94A3B8' : '#64748B',
                        selectedDayBackgroundColor: theme.colors.primary,
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: theme.colors.primary,
                        dayTextColor: theme.colors.text,
                        textDisabledColor: theme.isDark ? '#334155' : '#CBD5E1',
                        dotColor: theme.colors.primary,
                        selectedDotColor: '#ffffff',
                        arrowColor: theme.colors.primary,
                        monthTextColor: theme.colors.text,
                        indicatorColor: theme.colors.primary,
                        textDayFontWeight: '500',
                        textMonthFontWeight: 'bold',
                        textDayHeaderFontWeight: '500',
                        textDayFontSize: 16,
                        textMonthFontSize: 18,
                        textDayHeaderFontSize: 14
                    }}
                    style={styles.calendar}
                />

                {/* Quick Date Selection */}
                <View style={styles.quickSelectContainer}>
                    <Text style={[styles.quickSelectLabel, { color: theme.isDark ? '#94A3B8' : '#64748B' }]}>
                        Quick Select
                    </Text>
                    <View style={styles.quickSelectButtons}>
                        <TouchableOpacity
                            style={[styles.quickButton, { backgroundColor: theme.colors.surface }]}
                            onPress={() => setQuickDate(0)}
                        >
                            <Text style={[styles.quickButtonText, { color: theme.colors.text }]}>Today</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.quickButton, { backgroundColor: theme.colors.surface }]}
                            onPress={() => setQuickDate(-1)}
                        >
                            <Text style={[styles.quickButtonText, { color: theme.colors.text }]}>Yesterday</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.quickButton, { backgroundColor: theme.colors.surface }]}
                            onPress={() => setQuickDate(-7)}
                        >
                            <Text style={[styles.quickButtonText, { color: theme.colors.text }]}>Last Week</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </QSBottomSheet>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 24,
    },
    selectedDateCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    selectedDateText: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    calendar: {
        marginBottom: 24,
        borderRadius: 12,
        overflow: 'hidden',
    },
    quickSelectContainer: {
        gap: 12,
    },
    quickSelectLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    quickSelectButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    quickButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    quickButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
