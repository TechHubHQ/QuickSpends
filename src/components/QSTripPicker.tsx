import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { QSBottomSheet } from "./QSBottomSheet";

interface Trip {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'active' | 'completed';
    groupId?: string;
}

interface QSTripPickerProps {
    visible: boolean;
    onClose: () => void;
    trips: Trip[];
    selectedId?: string;
    onSelect: (trip: Trip) => void;
}

export function QSTripPicker({
    visible,
    onClose,
    trips,
    selectedId,
    onSelect,
}: QSTripPickerProps) {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredTrips = trips.filter(trip =>
        trip.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (trip: Trip) => {
        onSelect(trip);
        onClose();
    };

    return (
        <QSBottomSheet
            visible={visible}
            onClose={onClose}
            title="Select Trip"
            showSearch
            searchPlaceholder="Search trips..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            showDoneButton
        >
            <View style={styles.list}>
                {filteredTrips.map((trip) => {
                    const isSelected = trip.id === selectedId;
                    const isActive = trip.status === 'active';
                    return (
                        <TouchableOpacity
                            key={trip.id}
                            style={[
                                styles.item,
                                isSelected && {
                                    backgroundColor: theme.colors.primary + '10',
                                    borderColor: theme.colors.primary + '30',
                                }
                            ]}
                            onPress={() => handleSelect(trip)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#FBBF24' + '20' }]}>
                                <MaterialCommunityIcons name="airplane-takeoff" size={24} color="#FBBF24" />
                            </View>
                            <View style={styles.tripInfo}>
                                <Text style={[styles.itemText, { color: theme.colors.text }]}>
                                    {trip.name}
                                </Text>
                                <Text style={[styles.dateText, { color: theme.isDark ? '#94A3B8' : '#64748B' }]}>
                                    {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                                </Text>
                            </View>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: isActive ? '#10B981' + '20' : '#6B7280' + '20' }
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    { color: isActive ? '#10B981' : '#6B7280' }
                                ]}>
                                    {trip.status}
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
        gap: 12,
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
    tripInfo: {
        flex: 1,
    },
    itemText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    dateText: {
        fontSize: 13,
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
});
