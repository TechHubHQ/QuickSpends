import { StyleSheet } from "react-native";
import { Theme } from "../theme/theme";

export const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        padding: 20,
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
        color: theme.colors.text,
    },
    currency: {
        fontSize: 18,
        fontWeight: '700',
        marginRight: 8,
        color: theme.colors.primary,
    },
    selectText: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
    },
    buttonContainer: {
        marginTop: 20,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    switchLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoContent: {
        padding: 20,
        gap: 16,
    },
    infoSection: {
        gap: 8,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    infoText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        lineHeight: 20,
    },
    assetList: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 12,
        gap: 8,
    },
    assetItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    assetItemText: {
        fontSize: 14,
        color: theme.colors.text,
        fontWeight: '500',
    },
});
