import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { getSafeIconName } from "../utils/iconMapping";
import { QSBottomSheet } from "./QSBottomSheet";

interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    parent_id?: string;
}

interface QSCategoryPickerProps {
    visible: boolean;
    onClose: () => void;
    categories: Category[];
    parentId?: string | null; // null for top-level, undefined for all? logic below
    onCreateNew?: () => void;
    selectedId?: string;
    onSelect: (category: Category) => void;
}

export function QSCategoryPicker({
    visible,
    onClose,
    categories,
    selectedId,
    onSelect,
    parentId,
    onCreateNew
}: QSCategoryPickerProps) {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredCategories = categories.filter(cat => {
        const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesParent = parentId !== undefined ? cat.parent_id === parentId : !cat.parent_id;

        const isCorrectLevel = parentId ? cat.parent_id === parentId : !cat.parent_id;

        return matchesSearch && isCorrectLevel;
    });

    const handleSelect = (category: Category) => {
        onSelect(category);
    };

    return (
        <QSBottomSheet
            visible={visible}
            onClose={onClose}
            title={parentId ? "Select Sub-Category" : "Select Category"}
            showSearch
            searchPlaceholder="Search categories..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            showDoneButton={!!parentId}
            onDone={onClose}
        >
            <View style={styles.list}>
                {onCreateNew && !parentId && (
                    <TouchableOpacity
                        style={[styles.item, { borderStyle: 'dashed', borderColor: theme.colors.border }]}
                        onPress={() => {
                            onClose();
                            onCreateNew();
                        }}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: theme.colors.surface }]}>
                            <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary} />
                        </View>
                        <Text style={[styles.itemText, { color: theme.colors.primary }]}>
                            Create New {parentId ? "Sub-Category" : "Category"}
                        </Text>
                    </TouchableOpacity>
                )}

                {filteredCategories.map((category) => {
                    const isSelected = category.id === selectedId;
                    return (
                        <TouchableOpacity
                            key={category.id}
                            style={[
                                styles.item,
                                isSelected && {
                                    backgroundColor: theme.colors.primary + '10',
                                    borderColor: theme.colors.primary + '30',
                                }
                            ]}
                            onPress={() => handleSelect(category)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: category.color + '20' }]}>
                                <MaterialCommunityIcons name={getSafeIconName(category.icon)} size={24} color={category.color} />
                            </View>
                            <Text style={[styles.itemText, { color: theme.colors.text }]}>
                                {category.name}
                            </Text>
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
    searchIcon: {
        marginRight: 8,
    },
    doneButton: {
        padding: 4,
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
    itemText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
});
