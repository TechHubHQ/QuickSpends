import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { ReactNode, useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
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
    variant?: 'bottom' | 'floating';
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
    variant = 'floating' // Default to floating
}: QSBottomSheetProps) {
    const { theme } = useTheme();
    const styles = createStyles(theme.colors, theme.isDark);
    const [showModal, setShowModal] = useState(visible);

    const opacity = useSharedValue(0);
    const scale = useSharedValue(variant === 'floating' ? 0.8 : 1);
    const translateY = useSharedValue(variant === 'bottom' ? 600 : 0);

    useEffect(() => {
        if (visible) {
            setShowModal(true);
            opacity.value = withTiming(1, { duration: 250 });
            if (variant === 'floating') {
                scale.value = withSpring(1, { damping: 15 });
            } else {
                translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
            }
        } else {
            opacity.value = withTiming(0, { duration: 200 }, (finished) => {
                if (finished) runOnJS(setShowModal)(false);
            });
            if (variant === 'floating') {
                scale.value = withTiming(0.8, { duration: 200 });
            } else {
                translateY.value = withTiming(600, { duration: 200 });
            }
        }
    }, [visible, variant]);

    const animatedBackdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const animatedContentStyle = useAnimatedStyle(() => {
        if (variant === 'floating') {
            return {
                opacity: opacity.value,
                transform: [{ scale: scale.value }],
            };
        }
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    return (
        <Modal
            visible={showModal}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={[styles.overlay, variant === 'floating' && styles.floatingOverlay]}>
                <Animated.View style={[StyleSheet.absoluteFill, animatedBackdropStyle, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                </Animated.View>

                <Animated.View style={[
                    styles.container,
                    variant === 'floating' && styles.floatingContainer,
                    animatedContentStyle
                ]}>
                    {/* Drag Handle & Header */}
                    <View style={styles.header}>
                        {variant === 'bottom' && <View style={styles.dragHandle} />}
                        <View style={styles.headerContent}>
                            <Text style={styles.title}>{title}</Text>
                            <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.7 : 1 }]}>
                                <MaterialCommunityIcons name="close" size={24} color={theme.isDark ? '#94A3B8' : '#64748B'} />
                            </Pressable>
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

                    {showDoneButton && (
                        <View style={styles.footer}>
                            <Pressable
                                style={({ pressed }) => [styles.doneButton, { opacity: pressed ? 0.8 : 1 }]}
                                onPress={onDone || onClose}
                            >
                                <Text style={styles.doneButtonText}>Done</Text>
                            </Pressable>
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
}
