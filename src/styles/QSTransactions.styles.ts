import { Platform, StyleSheet } from "react-native";
import { Theme } from "../theme/theme";

export const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    // Top App Bar
    header: {
        backgroundColor: theme.colors.background,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.m,
        paddingBottom: theme.spacing.s,
        paddingTop: Platform.OS === 'android' ? 40 : 60, // Increased for safe area
        zIndex: 30,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
        flex: 1,
        textAlign: 'center',
        letterSpacing: -0.015,
    },
    iconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },

    // Search Bar
    searchContainer: {
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.s,
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.xl,
        height: 48,
        ...theme.shadows.small,
        borderWidth: 1,
        borderColor: theme.isDark ? theme.colors.border : 'transparent',
    },
    searchIconContainer: {
        paddingLeft: theme.spacing.m,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        height: '100%',
        paddingHorizontal: theme.spacing.m,
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text,
        textAlign: 'left',
        textAlignVertical: 'center',
    },

    // Chips
    chipsContainer: {
        // Wrapper items
        flexGrow: 0,
        paddingVertical: theme.spacing.m,
    },
    chipsContent: {
        paddingHorizontal: theme.spacing.m,
        gap: 12, // Increased gap
        flexDirection: 'row',
        alignItems: 'center',
    },
    chip: {
        flexDirection: 'row',
        height: 36, // Slightly taller for better touch target
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        paddingHorizontal: 16, // More breathing room
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        minWidth: 80, // Ensure decent individual width
    },
    activeChip: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
        ...theme.shadows.small,
    },
    chipText: {
        fontSize: 14, // Readable size
        fontWeight: '500',
        color: theme.colors.textSecondary,
        marginRight: 4,
    },
    activeChipText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },

    // Divider
    divider: {
        height: 1,
        width: '100%',
        backgroundColor: theme.colors.border,
        opacity: 0.5,
    },

    // Stats Card
    statsCard: {
        marginHorizontal: theme.spacing.m,
        marginBottom: theme.spacing.m,
        padding: 20,
        borderRadius: theme.borderRadius.l,
        overflow: 'hidden', // For background gradient/image
        elevation: 4,
        shadowColor: '#000000',
        ...Platform.select({
            web: {
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            },
            default: {
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            }
        }),
    },
    statsLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        opacity: 0.9,
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
    },
    statsAmount: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    statsTrendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        gap: 4,
    },
    statsTrendText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    statsComparison: {
        fontSize: 12,
        fontWeight: '500',
        color: '#FFFFFF',
        opacity: 0.7,
        marginTop: 4,
    },

    // Content
    listContent: {
        paddingBottom: 80,
    },
    sectionHeader: {
        paddingHorizontal: theme.spacing.m,
        paddingBottom: theme.spacing.s,
        paddingTop: theme.spacing.m,
        backgroundColor: theme.colors.background, // Sticky effect
    },
    sectionHeaderText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Transaction Item
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.m,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border + '40', // Very subtle
    },
    transactionLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.m,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    itemName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 2,
    },
    itemSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.textSecondary,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
    },
});
