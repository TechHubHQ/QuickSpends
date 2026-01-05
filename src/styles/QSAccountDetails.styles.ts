import { StyleSheet } from 'react-native';
import { ThemeColors } from '../theme/theme';

export const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        paddingVertical: 10,
    },
    cardSection: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    statusInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        gap: 6,
    },
    statusText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    actionButtonsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        marginVertical: 20,
    },
    actionButton: {
        alignItems: 'center',
        gap: 8,
    },
    actionIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: isDark ? 'rgba(30, 144, 255, 0.15)' : 'rgba(30, 144, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.text,
    },
    section: {
        marginTop: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    seeAllButton: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
    },
    transactionList: {
        paddingHorizontal: 20,
        gap: 8, // Reduced gap
    },
    transactionItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 8, // Reduced padding
    },
    transactionLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12, // Reduced gap from 16
    },
    transactionIconBox: {
        width: 40, // Reduced from 48
        height: 40,
        borderRadius: 10,
        backgroundColor: colors.backgroundSecondary,
        alignItems: "center",
        justifyContent: "center",
    },
    transactionName: {
        fontSize: 14, // Slightly smaller
        fontWeight: "600",
        color: colors.text,
    },
    transactionTime: {
        fontSize: 11,
        color: colors.textSecondary,
    },
    transactionAmount: {
        fontSize: 14,
        fontWeight: "700",
    },
    footerActions: {
        marginTop: 40,
        paddingHorizontal: 20,
        gap: 16,
        alignItems: 'center',
    },
    editButton: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    deleteButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#F56565',
    }
});
