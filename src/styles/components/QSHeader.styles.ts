import { Platform, StyleSheet } from "react-native";
import { Theme } from "../../theme/theme";

export const createStyles = (theme: Theme) => StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: theme.spacing.l,
        paddingTop: Platform.OS === "ios" ? 20 : 40, // Keeping this for now as screens likely rely on it being under translucent status bar
        paddingBottom: theme.spacing.m,
        minHeight: 90, // Ensure minimum height to prevent squashing
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
    },
    centerTitleContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: Platform.OS === "ios" ? 20 : 40,
        paddingBottom: 16,
        pointerEvents: 'none',
        zIndex: 1,
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
        zIndex: 10,
    },
    iconButton: {
        width: 44,
        height: 44,
        minWidth: 44, // Prevent narrowing
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.small,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
        borderWidth: 1.5,
        borderColor: theme.colors.card,
    }
});
