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
    typeContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
    },
    typeButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
    },
    typeText: {
        fontSize: 15,
        fontWeight: '700',
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
    buttonContainer: {
        marginTop: 20,
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    chipContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 4,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        height: 40,
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
    },
    emiDetails: {
        gap: 20,
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(148, 163, 184, 0.05)',
    },
    interestToggle: {
        flexDirection: 'row',
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        borderRadius: 8,
        padding: 2,
        marginLeft: 12,
    },
    toggleButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    toggleText: {
        fontSize: 12,
        fontWeight: '700',
    },
    convertButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.2)',
        marginBottom: 8,
        gap: 8,
    },
    convertButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.primary,
    }
});
