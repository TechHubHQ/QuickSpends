import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { QSBottomSheet } from "./QSBottomSheet";

interface Group {
    id: string;
    name: string;
    created_by: string;
}

interface QSGroupPickerProps {
    visible: boolean;
    onClose: () => void;
    groups: Group[];
    selectedId?: string;
    onSelect: (group: Group) => void;
}

export function QSGroupPicker({
    visible,
    onClose,
    groups,
    selectedId,
    onSelect,
}: QSGroupPickerProps) {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredGroups = groups.filter(grp =>
        grp.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (group: Group) => {
        onSelect(group);
        onClose();
    };

    return (
        <QSBottomSheet
            visible={visible}
            onClose={onClose}
            title="Select Group"
            showSearch
            searchPlaceholder="Search groups..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            showDoneButton
        >
            <View style={styles.list}>
                {/* Create New Group */}
                <TouchableOpacity style={styles.createButton}>
                    <View style={[styles.createIconContainer, { backgroundColor: theme.colors.primary + '10' }]}>
                        <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.createText, { color: theme.colors.primary }]}>
                        Create New Group
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={theme.isDark ? '#475569' : '#94A3B8'} />
                </TouchableOpacity>

                {/* Group List */}
                {filteredGroups.map((group) => {
                    const isSelected = group.id === selectedId;
                    return (
                        <TouchableOpacity
                            key={group.id}
                            style={[
                                styles.item,
                                isSelected && {
                                    backgroundColor: theme.colors.primary + '10',
                                    borderColor: theme.colors.primary + '30',
                                }
                            ]}
                            onPress={() => handleSelect(group)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                                <MaterialCommunityIcons name="account-group" size={24} color={theme.colors.primary} />
                            </View>
                            <View style={styles.groupInfo}>
                                <Text style={[styles.itemText, { color: theme.colors.text }]}>
                                    {group.name}
                                </Text>
                                <Text style={[styles.memberCount, { color: theme.isDark ? '#94A3B8' : '#64748B' }]}>
                                    Members
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
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(148, 163, 184, 0.2)',
        borderStyle: 'dashed',
        marginBottom: 8,
    },
    createIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
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
    groupInfo: {
        flex: 1,
    },
    itemText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    memberCount: {
        fontSize: 14,
        fontWeight: '500',
    },
});
