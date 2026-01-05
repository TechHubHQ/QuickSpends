import React from "react";
import {
    ActivityIndicator,
    Text,
    TextStyle,
    TouchableOpacity,
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

    const containerStyles = [
        variant === "primary" ? styles.primaryButton : styles.secondaryButton,
        variant === "secondary" && isDark && styles.secondaryButtonDark,
        variant === "secondary" && !isDark && styles.secondaryButtonLight,
        disabled && styles.disabledButton,
        style,
    ];

    const labelStyles = [
        variant === "primary" ? styles.primaryButtonText : styles.secondaryButtonText,
        textStyle,
    ];

    return (
        <TouchableOpacity
            style={containerStyles}
            onPress={onPress}
            activeOpacity={0.9}
            disabled={disabled || loading}
        >
            {loading ? (
                <ActivityIndicator color={variant === "primary" ? theme.colors.onPrimary : theme.colors.primary} />
            ) : (
                <Text style={labelStyles}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};


