import React from "react";
import {
    ActivityIndicator,
    Pressable,
    Text,
    TextStyle,
    ViewStyle
} from "react-native";
import { createStyles } from "../styles/components/QSButton.styles";
import { useTheme } from "../theme/ThemeContext";

interface QSButtonProps {
    title: string;
    onPress: () => void;
    variant?: "primary" | "secondary";
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;

}

export const QSButton: React.FC<QSButtonProps> = ({
    title,
    onPress,
    variant = "primary",
    loading = false,
    disabled = false,
    style,
    textStyle,
}) => {
    const { theme } = useTheme();
    const isDark = theme.isDark;
    const styles = createStyles(theme);

    const getContainerStyles = (pressed: boolean) => [
        variant === "primary" ? styles.primaryButton : styles.secondaryButton,
        variant === "secondary" && isDark && styles.secondaryButtonDark,
        variant === "secondary" && !isDark && styles.secondaryButtonLight,
        disabled && styles.disabledButton,
        style,
        pressed && { opacity: 0.9 }
    ];

    const labelStyles = [
        variant === "primary" ? styles.primaryButtonText : styles.secondaryButtonText,
        textStyle,
    ];

    return (
        <Pressable
            style={({ pressed }) => getContainerStyles(pressed)}
            onPress={onPress}
            disabled={disabled || loading}
        >
            {loading ? (
                <ActivityIndicator color={variant === "primary" ? theme.colors.onPrimary : theme.colors.primary} />
            ) : (
                <Text style={labelStyles}>{title}</Text>
            )}
        </Pressable>
    );
};
