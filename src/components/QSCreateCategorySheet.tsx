import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { QSBottomSheet } from "./QSBottomSheet";

interface QSCreateCategorySheetProps {
    visible: boolean;
    onClose: () => void;
    onSave: (name: string, icon: string, color: string) => void;
    parentId?: string; // If present, we are creating a sub-category
    type: 'income' | 'expense';
}

const ICONS = [
    // Food & Drink
    'silverware-fork-knife', 'food', 'coffee', 'glass-cocktail', 'cupcake',
    'ice-cream', 'pizza', 'hamburger', 'beer', 'food-apple',

    // Shopping & Lifestyle
    'shopping', 'cart', 'tshirt-crew', 'shoe-sneaker', 'glasses',
    'watch', 'diamond-stone', 'baby-carriage', 'hanger', 'gift',

    // Tech & Gadgets
    'laptop', 'cellphone', 'headphones', 'camera', 'controller-classic',
    'printer', 'home-automation', 'rocket-launch', 'robot', 'battery-charging',

    // Transport
    'car', 'bus', 'train', 'airplane', 'bike',
    'gas-station', 'parking', 'map-marker', 'compass', 'steering',

    // Home & Utilities
    'home', 'home-city', 'bed', 'lamp', 'sofa',
    'water', 'lightbulb', 'wifi', 'lightning-bolt', 'fire',

    // Health & Wellness
    'doctor', 'pill', 'dumbbell', 'yoga', 'flower',
    'heart-pulse', 'hospital-box', 'tooth', 'sunglasses', 'run',

    // Entertainment
    'movie', 'music', 'ticket', 'party-popper', 'palette',
    'cards-playing', 'dice-5', 'piano', 'microphone', 'book-open-variant',

    // Finance & Work
    'bank', 'cash', 'credit-card', 'finance', 'briefcase',
    'chart-line', 'piggy-bank', 'wallet', 'bitcoin', 'calculator',

    // Misc
    'school', 'paw', 'tree', 'face-man-profile', 'star',
    'shield-check', 'tools', 'hammer-wrench', 'broom', 'shape-outline',
    'cloud', 'umbrella', 'lock', 'bell', 'alert-circle', 'account-group'
];

const COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
    '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E',
    '#64748B', '#71717A'
];

export function QSCreateCategorySheet({
    visible,
    onClose,
    onSave,
    parentId,
    type
}: QSCreateCategorySheetProps) {
    const { theme } = useTheme();
    const [name, setName] = useState("");
    const [selectedIcon, setSelectedIcon] = useState('shape-outline');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);

    const handleSave = () => {
        if (!name.trim()) return;
        onSave(name, selectedIcon, selectedColor);
        setName("");
        setSelectedIcon('shape-outline');
        setSelectedColor(COLORS[0]);
        onClose();
    };

    return (
        <QSBottomSheet
            visible={visible}
            onClose={onClose}
            title={parentId ? "New Sub-Category" : "New Category"}
            showDoneButton
            onDone={handleSave}
        >
            <View style={styles.container}>
                {/* Name Input */}
                <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <View style={[styles.previewIcon, { backgroundColor: selectedColor }]}>
                        <MaterialCommunityIcons name={selectedIcon as any} size={24} color="#FFFFFF" />
                    </View>
                    <TextInput
                        style={[styles.input, { color: theme.colors.text }]}
                        placeholder="Category Name"
                        placeholderTextColor={theme.colors.textTertiary}
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />
                </View>

                {/* Color Picker */}
                <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Color</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorList}>
                    {COLORS.map((color) => (
                        <TouchableOpacity
                            key={color}
                            style={[
                                styles.colorItem,
                                { backgroundColor: color },
                                selectedColor === color && styles.selectedColorItem
                            ]}
                            onPress={() => setSelectedColor(color)}
                        >
                            {selectedColor === color && <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Icon Picker */}
                <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Icon</Text>
                <View style={styles.iconGrid}>
                    {ICONS.map((icon) => <TouchableOpacity
                        key={icon}
                        style={[
                            styles.iconItem,
                            selectedIcon === icon && styles.selectedIconItem,
                            selectedIcon === icon && { backgroundColor: selectedColor + '20' }
                        ]}
                        onPress={() => setSelectedIcon(icon)}
                    >
                        <MaterialCommunityIcons
                            name={icon as any}
                            size={24}
                            color={selectedIcon === icon ? selectedColor : (theme.isDark ? '#94A3B8' : '#64748B')}
                        />
                    </TouchableOpacity>
                    )}
                </View>
            </View>
        </QSBottomSheet>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
        gap: 12,
    },
    previewIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'left',
        textAlignVertical: 'center',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    colorList: {
        gap: 12,
        paddingBottom: 24,
    },
    colorItem: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedColorItem: {
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    iconItem: {
        width: '18%', // Approx 5 items per row
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedIconItem: {
        borderColor: 'rgba(0,0,0,0.1)',
    },
});
