import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { ReactNode } from "react";
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { createStyles } from "../styles/components/QSBottomSheet.styles";
import { useTheme } from "../theme/ThemeContext";

interface QSBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    showSearch?: boolean;
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (text: string) => void;
    showDoneButton?: boolean;
    onDone?: () => void;
}

export function QSBottomSheet({
    visible,
    onClose,
    title,
    children,
    showSearch = false,
    searchPlaceholder = "Search...",
    searchValue = "",
    onSearchChange,
    showDoneButton = false,
    onDone,
}: QSBottomSheetProps) {
    const { theme } = useTheme();
    const styles = createStyles(theme.colors, theme.isDark);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Drag Handle & Header */}
                    <View style={styles.header}>
                        <View style={styles.dragHandle} />
                        <View style={styles.headerContent}>
                            <Text style={styles.title}>{title}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <MaterialCommunityIcons name="close" size={24} color={theme.isDark ? '#94A3B8' : '#64748B'} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Search Bar */}
                    {showSearch && (
                        <View style={styles.searchContainer}>
                            <View style={styles.searchWrapper}>
                                <MaterialCommunityIcons name="magnify" size={24} color={theme.isDark ? '#64748B' : '#94A3B8'} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder={searchPlaceholder}
                                    placeholderTextColor={theme.isDark ? '#64748B' : '#94A3B8'}
                                    value={searchValue}
                                    onChangeText={onSearchChange}
                                />
                            </View>
                        </View>
                    )}

                    {/* Scrollable Content */}
                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                    >
                        {children}
                    </ScrollView>

                    {/* Done Button */}
                    {showDoneButton && (
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.doneButton}
                                onPress={onDone || onClose}
                            >
                                <Text style={styles.doneButtonText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}
