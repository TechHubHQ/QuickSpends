import { StyleSheet } from "react-native";
import { Theme } from "../theme/theme";

export const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.l,
        paddingBottom: 120,
    },

    // Type Segmented Control
    typeContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.borderRadius.xl,
        padding: 4,
        marginBottom: theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: theme.borderRadius.l,
    },
    activeTypeButton: {
        backgroundColor: theme.colors.primary,
        ...theme.shadows.small,
    },
    typeText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    activeTypeText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },

    // Amount Section
    amountSection: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.xl,
    },
    amountLabel: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.s,
    },
    amountInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: '700',
        color: theme.colors.textTertiary,
        marginRight: 4,
    },
    amountInput: {
        fontSize: 48,
        fontWeight: '700',
        color: theme.colors.text,
        textAlign: 'center',
        minWidth: 120,
        padding: 0,
    },

    // Input Group
    inputGroup: {
        marginBottom: theme.spacing.l,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.textSecondary,
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.m,
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.xl,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.small,
    },
    inputWrapperFocused: {
        borderColor: theme.colors.primary,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text,
        padding: 0,
        textAlign: 'left',
        textAlignVertical: 'top',
    },
    multilineInput: {
        minHeight: 100,
        paddingTop: 12,
    },
    toolbar: {
        flexDirection: 'row',
        gap: theme.spacing.s,
        marginBottom: theme.spacing.s,
        paddingHorizontal: 4,
    },
    toolbarButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.borderRadius.s,
        borderWidth: 1,
        borderColor: theme.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    toolbarButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    selectButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    selectPlaceholder: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.textTertiary,
    },

    // Recurring Section
    recurringToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    recurringContainer: {
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.borderRadius.xl,
        padding: 4,
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    recurringButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: theme.borderRadius.l,
    },
    activeRecurringButton: {
        backgroundColor: theme.colors.primary,
        ...theme.shadows.small,
    },
    inactiveRecurringButton: {
        backgroundColor: 'transparent',
    },
    recurringText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    activeRecurringText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },

    // Modern Link Pills (replacing Switch toggle cards)
    linkPillsSection: {
        marginBottom: theme.spacing.l,
    },
    linkPillsLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.textSecondary,
        marginBottom: 10,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    linkPillsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    linkPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.card,
    },
    linkPillActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '12',
    },
    linkPillDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    linkPillText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    linkPillTextActive: {
        color: theme.colors.primary,
    },

    // Save Button
    saveButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: theme.spacing.l,
        paddingBottom: theme.spacing.xl + 10,
        backgroundColor: theme.colors.background,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    saveButton: {
    },
});
