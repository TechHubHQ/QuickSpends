import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { useTheme } from "../theme/ThemeContext";
import { QSBottomSheet } from "./QSBottomSheet";

type ViewMode = 'calendar' | 'month' | 'year';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

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
    const [viewMode, setViewMode] = useState<ViewMode>('calendar');
    const [tempDate, setTempDate] = useState(selectedDate);
    const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});

    useEffect(() => {
        setTempDate(selectedDate);
        setViewMode('calendar');
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

    const renderMonthPicker = () => (
        <View style={styles.gridContainer}>
            {MONTHS.map((month, index) => (
                <Pressable
                    key={month}
                    style={({ pressed }) => [
                        styles.gridItem,
                        tempDate.getMonth() === index && { backgroundColor: theme.colors.primary },
                        { opacity: pressed ? 0.7 : 1 }
                    ]}
                    onPress={() => {
                        const newDate = new Date(tempDate);
                        newDate.setMonth(index);
                        setTempDate(newDate);
                        setViewMode('calendar');
                    }}
                >
                    <Text style={[
                        styles.gridItemText,
                        { color: tempDate.getMonth() === index ? '#FFFFFF' : theme.colors.text }
                    ]}>
                        {month.substring(0, 3)}
                    </Text>
                </Pressable>
            ))}
        </View>
    );

    const renderYearPicker = () => {
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 41 }, (_, i) => currentYear - 20 + i);
        return (
            <View style={styles.gridContainer}>
                {years.map((year) => (
                    <Pressable
                        key={year}
                        style={({ pressed }) => [
                            styles.gridItem,
                            tempDate.getFullYear() === year && { backgroundColor: theme.colors.primary },
                            { opacity: pressed ? 0.7 : 1 }
                        ]}
                        onPress={() => {
                            const newDate = new Date(tempDate);
                            newDate.setFullYear(year);
                            setTempDate(newDate);
                            setViewMode('month');
                        }}
                    >
                        <Text style={[
                            styles.gridItemText,
                            { color: tempDate.getFullYear() === year ? '#FFFFFF' : theme.colors.text }
                        ]}>
                            {year}
                        </Text>
                    </Pressable>
                ))}
            </View>
        );
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

                {viewMode === 'calendar' ? (
                    <Calendar
                        current={getLocalDateString(tempDate)}
                        onDayPress={handleDayPress}
                        markedDates={markedDates}
                        renderHeader={(date: any) => {
                            const d = new Date(date);
                            return (
                                <View style={styles.calendarHeader}>
                                    <Pressable onPress={() => setViewMode('month')} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                                        <Text style={[styles.headerText, { color: theme.colors.text }]}>
                                            {MONTHS[d.getMonth()]}
                                        </Text>
                                    </Pressable>
                                    <Pressable onPress={() => setViewMode('year')} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                                        <Text style={[styles.headerText, { color: theme.colors.text }]}>
                                            {d.getFullYear()}
                                        </Text>
                                    </Pressable>
                                </View>
                            );
                        }}
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
                ) : viewMode === 'month' ? (
                    renderMonthPicker()
                ) : (
                    renderYearPicker()
                )}

                {/* Quick Date Selection */}
                {viewMode === 'calendar' && (
                    <View style={styles.quickSelectContainer}>
                        <Text style={[styles.quickSelectLabel, { color: theme.isDark ? '#94A3B8' : '#64748B' }]}>
                            Quick Select
                        </Text>
                        <View style={styles.quickSelectButtons}>
                            <Pressable
                                style={({ pressed }) => [styles.quickButton, { backgroundColor: theme.colors.surface }, { opacity: pressed ? 0.7 : 1 }]}
                                onPress={() => setQuickDate(0)}
                            >
                                <Text style={[styles.quickButtonText, { color: theme.colors.text }]}>Today</Text>
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [styles.quickButton, { backgroundColor: theme.colors.surface }, { opacity: pressed ? 0.7 : 1 }]}
                                onPress={() => setQuickDate(-1)}
                            >
                                <Text style={[styles.quickButtonText, { color: theme.colors.text }]}>Yesterday</Text>
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [styles.quickButton, { backgroundColor: theme.colors.surface }, { opacity: pressed ? 0.7 : 1 }]}
                                onPress={() => setQuickDate(-7)}
                            >
                                <Text style={[styles.quickButtonText, { color: theme.colors.text }]}>Last Week</Text>
                            </Pressable>
                        </View>
                    </View>
                )}
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
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        paddingBottom: 24,
    },
    gridItem: {
        width: '22%',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    gridItemText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
