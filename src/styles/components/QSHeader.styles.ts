import { Platform, StyleSheet } from "react-native";
import { Theme } from "../../theme/theme";

export const createStyles = (theme: Theme) => StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: theme.spacing.l,
        paddingTop: Platform.OS === "ios" ? 20 : 40,
        paddingBottom: theme.spacing.m,
    },
    profileSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.m,
    },
    profileImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: "hidden",
        ...theme.shadows.small,
    },
    greetingLabel: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
        fontWeight: "500",
    },
    userName: {
        ...theme.typography.h3,
        color: theme.colors.text,
    },
    rightSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.m,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.small,
    },
});
