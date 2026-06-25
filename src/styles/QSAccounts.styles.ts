import { Platform, StyleSheet } from "react-native";

export const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    netWorthCard: {
        marginHorizontal: 24,
        borderRadius: 32,
        overflow: "hidden",
        marginBottom: 24,
    },
    netWorthContent: {
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
        position: 'relative',
        zIndex: 10,
    },
    nwDecoration: {
        position: 'absolute',
        borderRadius: 999,
    },
    netWorthLabel: {
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.8)",
        fontWeight: "600",
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    netWorthAmount: {
        fontSize: 40,
        fontWeight: "800",
        color: "#FFFFFF",
        letterSpacing: -1,
        marginBottom: 16,
    },
    trendBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.2)",
    },
    trendText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#FFFFFF",
    },

    // Quick Stats Row
    quickStatsRow: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 12,
        marginBottom: 24,
    },
    quickStatCard: {
        flex: 1,
        backgroundColor: theme.card,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
    },
    quickStatLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: theme.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 8,
    },
    quickStatAmount: {
        fontSize: 18,
        fontWeight: "700",
        color: theme.text,
        marginTop: 4,
    },
    quickStatIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Tabs
    tabContainer: {
        paddingHorizontal: 24,
        marginBottom: 24,
        flexDirection: 'row',
        gap: 8,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        backgroundColor: theme.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabItemActive: {
        backgroundColor: theme.primary,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tabText: {
        fontSize: 13,
        fontWeight: "600",
        color: theme.textSecondary,
        textAlign: 'center',
    },
    tabTextActive: {
        color: "#FFFFFF",
    },

    // Lists
    accountList: {
        paddingHorizontal: 24,
        gap: 12,
        minHeight: 200,
    },
    accountCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderRadius: 20,
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
    },
    accountIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    accountInfo: {
        flex: 1,
        marginLeft: 16,
    },
    accountName: {
        fontSize: 16,
        fontWeight: "600",
        color: theme.text,
    },
    accountSubtext: {
        fontSize: 12,
        color: theme.textTertiary,
        marginTop: 2,
    },
    accountBalanceContainer: {
        alignItems: "flex-end",
        gap: 4,
    },
    accountBalance: {
        fontSize: 18,
        fontWeight: "700",
        color: theme.text,
    },
    detailsButton: {
        fontSize: 10,
        fontWeight: "800",
        color: theme.primary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    addButton: {
        marginTop: 32,
        marginHorizontal: 24,
        height: 64,
        borderRadius: 24,
        backgroundColor: theme.primary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        elevation: 4,
        ...Platform.select({
            web: {
                boxShadow: `0px 8px 16px ${theme.primary}4D`,
            },
            default: {
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
            }
        }),
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFFFFF",
    },

    // Filter Bottom Sheet - modern toggle chips
    filterSection: {
        padding: 20,
        gap: 8,
    },
    filterTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: theme.textSecondary,
        marginBottom: 4,
    },
    filterChipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
        backgroundColor: theme.card,
    },
    filterChipActive: {
        borderColor: theme.primary,
        backgroundColor: theme.primary + '15',
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: "600",
        color: theme.textSecondary,
    },
    filterChipTextActive: {
        color: theme.primary,
    },
    filterChipBullet: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
});
