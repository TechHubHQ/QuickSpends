import { StyleSheet } from "react-native";
import { Theme } from "../theme/theme";

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
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
      alignItems: "center",
    },
    netWorthLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: "600",
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    netWorthAmount: {
      fontSize: 40,
      fontWeight: "800",
      color: theme.colors.text,
      marginBottom: theme.spacing.s,
      letterSpacing: -1,
    },
    trendRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: theme.colors.backgroundSecondary,
      gap: 6,
    },
    trendText: {
      fontSize: 13,
      fontWeight: "700",
    },
    sectionCard: {
      marginHorizontal: theme.spacing.l,
      marginBottom: theme.spacing.l,
      padding: theme.spacing.l,
      borderRadius: 24,
      backgroundColor: theme.colors.card,
      ...theme.shadows.small,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: theme.spacing.l,
    },
    // Filter Styles
    filterContainer: {
      flexGrow: 1,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: theme.spacing.l,
      marginBottom: theme.spacing.s,
      paddingHorizontal: theme.spacing.l,
      gap: 10,
    },
    filterChip: {
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterChipNarrow: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 16,
      width: "48%",
      minWidth: 0,
      alignItems: "center",
    },
    activeFilterChip: {
      backgroundColor: theme.colors.text,
      borderColor: theme.colors.text,
      ...theme.shadows.small,
    },
    filterText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.textSecondary,
    },
    filterTextNarrow: {
      fontSize: 11,
      fontWeight: "700",
    },
    filterContainerNarrow: {
      paddingHorizontal: theme.spacing.m,
      gap: 8,
    },
    filterContainerWrap: {
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 8,
    },
    filterButton: {
      marginHorizontal: theme.spacing.l,
      marginTop: theme.spacing.l,
      marginBottom: theme.spacing.s,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      alignSelf: "flex-start",
      maxWidth: "90%",
      ...theme.shadows.small,
    },
    filterButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingRight: 8,
    },
    filterButtonLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.textSecondary,
    },
    filterButtonDivider: {
      fontSize: 12,
      color: theme.colors.textTertiary,
    },
    filterButtonValue: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.colors.text,
    },
    filterOption: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    filterOptionActive: {
      backgroundColor: theme.colors.primary + "12",
      borderColor: theme.colors.primary + "55",
    },
    filterOptionText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
    },
    filterOptionTextActive: {
      color: theme.colors.primary,
      fontWeight: "700",
    },
    activeFilterText: {
      color: theme.colors.background, // Inverted contrast
    },
    // Tab Styles
    tabContainer: {
      flexDirection: "row",
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
      alignItems: "center",
      borderRadius: 12,
    },
    activeTabItem: {
      backgroundColor: theme.colors.primary,
      ...theme.shadows.medium,
      transform: [{ scale: 1.02 }],
    },
    tabLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.textSecondary,
    },
    activeTabLabel: {
      color: "#FFFFFF", // White text on primary background
      fontWeight: "700",
    },
    // List Styles
    budgetList: {
      gap: theme.spacing.m,
    },
    budgetItem: {
      gap: 10,
    },
    budgetInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    budgetCategory: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.colors.text,
    },
    budgetAmount: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontVariant: ["tabular-nums"],
    },
    categoryList: {
      marginTop: theme.spacing.m,
      gap: 16,
    },
    categoryItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 4,
    },
    categoryLeft: {
      flexDirection: "row",
      alignItems: "center",
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
      fontWeight: "500",
    },
    categoryValue: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.colors.text,
      fontVariant: ["tabular-nums"],
    },
    summaryGrid: {
      flexDirection: "row",
      gap: theme.spacing.m,
      marginTop: theme.spacing.xl,
      width: "100%",
    },
    summaryItem: {
      flex: 1,
      padding: theme.spacing.m,
      borderRadius: 16,
      backgroundColor: theme.colors.backgroundSecondary,
      alignItems: "center",
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
    historyIcon: {
      marginTop: 4,
      opacity: 0.8,
    },
    transactionList: {
      gap: 12,
    },
    transactionItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: theme.colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.colors.border + "30",
      gap: 14,
    },
    transactionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
    },
    transactionDetails: {
      flex: 1,
      gap: 4,
    },
    transactionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.text,
    },
    transactionSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    transactionAccount: {
      fontSize: 12,
      color: theme.colors.textTertiary,
      marginTop: 2,
    },
    amountContainer: {
      alignItems: "flex-end",
      gap: 4,
    },
    transactionAmount: {
      fontSize: 18,
      fontWeight: "800",
    },
  });
