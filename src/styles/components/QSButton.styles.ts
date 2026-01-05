import { StyleSheet } from "react-native";
import { Theme } from "../../theme/theme";

export const createStyles = (theme: Theme) => StyleSheet.create({
    primaryButton: {
        width: "100%",
        height: 56,
        borderRadius: theme.borderRadius.xl,
        backgroundColor: theme.colors.primary,
        alignItems: "center",
        justifyContent: "center",
        ...theme.shadows.medium,
        shadowColor: theme.colors.primary,
    },
    secondaryButton: {
        width: "100%",
        height: 56,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1.5,
        backgroundColor: "transparent",
        alignItems: "center",
        justifyContent: "center",
    },
    secondaryButtonDark: {
        borderColor: theme.colors.border,
    },
    secondaryButtonLight: {
        borderColor: theme.colors.border,
    },
    primaryButtonText: {
        color: theme.colors.onPrimary,
        ...theme.typography.button,
    },
    secondaryButtonText: {
        ...theme.typography.button,
        color: theme.colors.text,
    },
    disabledButton: {
        opacity: 0.5,
        shadowOpacity: 0,
        elevation: 0,
    },
});
