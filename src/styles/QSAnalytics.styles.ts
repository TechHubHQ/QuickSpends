import { StyleSheet } from "react-native";
import { Theme } from "../theme/theme";

export const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        paddingBottom: 100,
        paddingTop: theme.spacing.s,
    },
    netWorthCard: {
        marginHorizontal: theme.spacing.l,
        padding: theme.spacing.xl,
        borderRadius: 24,
        backgroundColor: theme.colors.card,
        ...theme.shadows.medium,
        marginTop: theme.spacing.s,
        alignItems: 'center',
    },
    netWorthLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    netWorthAmount: {
        fontSize: 40,
        fontWeight: '800',
        color: theme.colors.text,
        marginBottom: theme.spacing.s,
        letterSpacing: -1,
    },
    trendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: theme.colors.backgroundSecondary,
        gap: 6,
    },
    trendText: {
        fontSize: 13,
        fontWeight: '700',
    },
    sectionCard: {
        marginHorizontal: theme.spacing.l,
        marginBottom: theme.spacing.l,
        padding: theme.spacing.l,
        borderRadius: 24,
        backgroundColor: theme.colors.card,
        ...theme.shadows.small,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: theme.spacing.l,
    },
    // Filter Styles
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: theme.spacing.l,
        marginBottom: theme.spacing.s,
        marginHorizontal: theme.spacing.l,
        gap: 10,
    },
    filterChip: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 25,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    activeFilterChip: {
        backgroundColor: theme.colors.text,
        borderColor: theme.colors.text,
        ...theme.shadows.small,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    activeFilterText: {
        color: theme.colors.background, // Inverted contrast
    },
    // Tab Styles
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: theme.spacing.l,
        marginVertical: theme.spacing.l,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: 16,
        padding: 6,
        gap: 6,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    activeTabItem: {
        backgroundColor: theme.colors.primary,
        ...theme.shadows.medium,
        transform: [{ scale: 1.02 }],
    },
    tabLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    activeTabLabel: {
        color: '#FFFFFF', // White text on primary background
        fontWeight: '700',
    },
    // List Styles
    budgetList: {
        gap: theme.spacing.m,
    },
    budgetItem: {
        gap: 10,
    },
    budgetInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    budgetCategory: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text,
    },
    budgetAmount: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        fontVariant: ['tabular-nums'],
    },
    categoryList: {
        marginTop: theme.spacing.m,
        gap: 16,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    categoryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    categoryDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    categoryName: {
        fontSize: 15,
        color: theme.colors.text,
        fontWeight: '500',
    },
    categoryValue: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text,
        fontVariant: ['tabular-nums'],
    },
    summaryGrid: {
        flexDirection: 'row',
        gap: theme.spacing.m,
        marginTop: theme.spacing.xl,
        width: '100%',
    },
    summaryItem: {
        flex: 1,
        padding: theme.spacing.m,
        borderRadius: 16,
        backgroundColor: theme.colors.backgroundSecondary,
        alignItems: 'center',
        gap: 6,
    },
    progressBarBackground: {
        height: 8,
        width: "100%",
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: 4,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        borderRadius: 4,
    },
});
