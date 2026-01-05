import { Dimensions, StyleSheet } from "react-native";
import { Theme } from "../theme/theme";

const { width } = Dimensions.get("window");
const HEADER_HEIGHT = 300;

export const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        height: HEADER_HEIGHT,
        width: width,
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    headerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    headerContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: theme.spacing.l,
        paddingBottom: theme.spacing.xl,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: theme.spacing.m,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    editButton: {
        position: 'absolute',
        top: 50,
        right: theme.spacing.m,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    tripTypeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginBottom: theme.spacing.s,
        gap: 6,
    },
    tripTypeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    tripTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    tripSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    contentCard: {
        flex: 1,
        marginTop: -30,
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: theme.spacing.xl,
    },
    section: {
        paddingHorizontal: theme.spacing.l,
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        ...theme.typography.h3,
        color: theme.colors.text,
        marginBottom: theme.spacing.m,
    },
    budgetCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.l,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.medium,
    },
    budgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: theme.spacing.m,
    },
    budgetAmountBox: {
        gap: 4,
    },
    budgetLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    budgetTotal: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.text,
    },
    budgetLimit: {
        fontSize: 14,
        color: theme.colors.textTertiary,
        fontWeight: '600',
    },
    percentageBox: {
        alignItems: 'flex-end',
        gap: 4,
    },
    percentageText: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.primary,
    },
    progressBarContainer: {
        height: 10,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: theme.spacing.m,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    budgetFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    budgetInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    budgetInfoIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    budgetInfoLabel: {
        fontSize: 11,
        color: theme.colors.textSecondary,
    },
    budgetInfoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text,
    },
    categoryScroll: {
        paddingLeft: theme.spacing.l,
        paddingRight: theme.spacing.l,
    },
    categoryItem: {
        width: 140,
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        marginRight: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
        gap: 10,
    },
    categoryIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryName: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text,
        textAlign: 'center',
    },
    categoryAmount: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text,
    },
    transactionList: {
        gap: theme.spacing.m,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.card,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.l,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    transactionLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.m,
        marginRight: 10, // Add some spacing from the amount
    },
    transactionIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    transactionInfo: {
        gap: 2,
    },
    transactionName: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text,
    },
    transactionDate: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.error,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: theme.spacing.l,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.large,
        shadowColor: theme.colors.primary,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xxl,
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.m,
    }
});
