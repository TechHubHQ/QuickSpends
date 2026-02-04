import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';

export interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface QSAlertModalProps {
    visible: boolean;
    title: string;
    message?: string;
    buttons?: AlertButton[];
    onClose: () => void;
}

const { width } = Dimensions.get('window');

export const QSAlertModal: React.FC<QSAlertModalProps> = ({
    visible,
    title,
    message,
    buttons = [],
    onClose,
}) => {
    const { theme } = useTheme();

    const [showModal, setShowModal] = useState(visible);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.8);

    useEffect(() => {
        if (visible) {
            setShowModal(true);
            opacity.value = withTiming(1, { duration: 200 });
            scale.value = withSpring(1, { damping: 15 });
        } else {
            opacity.value = withTiming(0, { duration: 150 }, (finished) => {
                if (finished) {
                    runOnJS(setShowModal)(false);
                }
            });
            scale.value = withTiming(0.8, { duration: 150 });
        }
    }, [visible]);

    const animatedBackdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const animatedContentStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    // if (!visible && opacity.value === 0) return null; // Removed to fix Reanimated warning

    // Defaults if no buttons provided
    const renderButtons = buttons.length > 0 ? buttons : [{ text: 'OK', onPress: onClose }];

    return (
        <Modal transparent visible={showModal} animationType="none" onRequestClose={onClose}>
            <View style={styles.container}>
                <Animated.View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }, animatedBackdropStyle]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.alertBox,
                        {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                            borderWidth: 1,
                            ...theme.shadows.large,
                        },
                        animatedContentStyle,
                    ]}
                >
                    <View style={styles.content}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
                        {message && <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>}
                    </View>

                    <View style={[styles.buttonRow, { borderTopColor: theme.colors.border }]}>
                        {renderButtons.map((btn, index) => {
                            const isLast = index === renderButtons.length - 1;
                            const isCancel = btn.style === 'cancel';
                            const isDestructive = btn.style === 'destructive';

                            let textColor = theme.colors.primary;
                            if (isCancel) textColor = theme.colors.textSecondary;
                            if (isDestructive) textColor = theme.colors.error;

                            return (
                                <Pressable
                                    key={index}
                                    style={({ pressed }) => [
                                        styles.button,
                                        !isLast && { borderRightColor: theme.colors.border, borderRightWidth: 1 },
                                        pressed && { opacity: 0.7, backgroundColor: theme.colors.border + '40' }
                                    ]}
                                    onPress={() => {
                                        if (btn.onPress) btn.onPress();
                                        onClose();
                                    }}
                                >
                                    <Text style={[styles.buttonText, { color: textColor, fontWeight: '600' }]}>
                                        {btn.text}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    alertBox: {
        width: Math.min(width * 0.85, 340),
        borderRadius: 20,
        overflow: 'hidden',
    },
    content: {
        padding: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        height: 50,
    },
    button: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
    },
});
