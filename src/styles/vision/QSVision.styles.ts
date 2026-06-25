import { StyleSheet } from "react-native";
import { Theme } from "../../theme/theme";

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      paddingBottom: 120,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "800",
      color: theme.colors.text,
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 4,
      fontWeight: "500",
    },
    visionEyebrow: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: 6,
    },
    visionHeroTitle: {
      fontSize: 26,
      fontWeight: "800",
      color: theme.colors.text,
      lineHeight: 32,
      marginBottom: 18,
    },
    portfolioBackPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: `${theme.colors.primary}15`,
    },
    portfolioBackText: {
      fontSize: 12,
      fontWeight: "800",
    },

    // === Surplus Hero ===
    commandHero: {
      marginHorizontal: 16,
      marginTop: 10,
      borderRadius: 24,
      padding: 20,
      backgroundColor: theme.colors.card,
      ...theme.shadows.medium,
    },
    commandHeroTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    commandHeroValue: {
      fontSize: 36,
      fontWeight: "800",
      color: theme.colors.text,
      letterSpacing: -1,
    },
    commandHeroCaption: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontWeight: "600",
      marginTop: 2,
    },
    heroIconButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: `${theme.colors.primary}12`,
    },
    cashflowGrid: {
      flexDirection: "row",
      gap: 10,
      marginTop: 18,
    },
    cashflowTile: {
      flex: 1,
      minHeight: 80,
      borderRadius: 16,
      padding: 12,
      backgroundColor: theme.colors.backgroundSecondary,
      justifyContent: "space-between",
    },
    cashflowLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    cashflowValue: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.colors.text,
      marginTop: 6,
    },
    cashflowInput: {
      minHeight: 34,
      paddingHorizontal: 0,
      fontSize: 17,
      fontWeight: "800",
      color: theme.colors.text,
    },
    saveCashflowButton: {
      height: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 14,
      backgroundColor: theme.colors.primary,
    },
    saveCashflowText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "800",
    },

    // === Capacity Strip ===
    capacityStrip: {
      marginHorizontal: 16,
      marginTop: 12,
      padding: 16,
      borderRadius: 20,
      backgroundColor: theme.colors.backgroundSecondary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    capacityStripLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.colors.textSecondary,
    },
    capacityStripValue: {
      fontSize: 22,
      fontWeight: "800",
      marginTop: 2,
      letterSpacing: -0.5,
    },
    capacityBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
    },
    capacityBadgeText: {
      fontSize: 12,
      fontWeight: "800",
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingRight: 20,
      marginTop: 8,
    },
    sectionLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    sectionLinkText: {
      fontSize: 13,
      fontWeight: "800",
    },

    // === Section Title ===
    sectionTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.colors.text,
      paddingHorizontal: 20,
      marginTop: 24,
      marginBottom: 14,
      letterSpacing: -0.3,
    },

    // === Plan / Goal Cards ===
    visionPlanCard: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 20,
      padding: 16,
      backgroundColor: theme.colors.card,
      ...theme.shadows.medium,
    },
    goalCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    goalIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    goalName: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.text,
      flex: 1,
    },
    goalMeta: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 3,
    },
    planMonthlyPill: {
      overflow: "hidden",
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
      fontSize: 12,
      fontWeight: "800",
    },
    planProgressTrack: {
      height: 8,
      borderRadius: 4,
      overflow: "hidden",
      backgroundColor: theme.colors.backgroundSecondary,
      marginTop: 14,
    },
    planProgressFill: {
      height: "100%",
      borderRadius: 4,
    },
    planCardFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 10,
    },
    statLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: "500",
    },

    // === Empty State ===
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      paddingHorizontal: 40,
    },
    emptyIcon: {
      marginBottom: 16,
      opacity: 0.5,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.text,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: "center",
      marginTop: 8,
      lineHeight: 20,
      paddingHorizontal: 20,
    },
    emptyInlineText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: "center",
      paddingVertical: 16,
    },

    // === Pressure Card ===
    pressureCard: {
      marginHorizontal: 16,
      padding: 16,
      borderRadius: 20,
      backgroundColor: theme.colors.card,
      ...theme.shadows.medium,
    },
    pressureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
    },
    pressureIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: `${theme.colors.warning}15`,
    },
    pressureTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.text,
    },
    pressureMeta: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    pressureAmount: {
      fontSize: 15,
      fontWeight: "800",
      color: theme.colors.text,
    },

    // === What-If Panel ===
    whatIfPanel: {
      marginHorizontal: 16,
      marginBottom: 20,
      padding: 8,
      borderRadius: 24,
      backgroundColor: theme.colors.backgroundSecondary,
      flexDirection: "row",
      gap: 8,
    },
    whatIfMetric: {
      flex: 1,
      minHeight: 80,
      borderRadius: 18,
      padding: 12,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.card,
      ...theme.shadows.small,
    },
    whatIfNumber: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.colors.text,
    },
    whatIfLabel: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      fontWeight: "600",
      marginTop: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    // === FAB ===
    visionActionPill: {
      position: "absolute",
      right: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 20,
      height: 52,
      borderRadius: 26,
      zIndex: 100,
      ...theme.shadows.large,
    },
    visionActionText: {
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "800",
    },
    fab: {
      position: "absolute",
      right: 20,
      bottom: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
    },

    // === Mode Toggle ===
    modeToggle: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginTop: 4,
      marginBottom: 12,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: 16,
      padding: 4,
    },
    modeBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 13,
    },
    modeBtnActive: {
      backgroundColor: theme.colors.card,
      ...theme.shadows.small,
    },
    modeBtnText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.textSecondary,
    },
    modeBtnTextActive: {
      color: theme.colors.text,
    },

    // === Goal Detail ===
    detailHero: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 28,
      alignItems: "center",
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
    },
    detailIconWrap: {
      width: 80,
      height: 80,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    detailTitle: {
      fontSize: 26,
      fontWeight: "800",
      color: theme.colors.text,
      textAlign: "center",
      letterSpacing: -0.5,
    },
    detailTargetRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 10,
    },
    detailTargetLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: "500",
    },
    detailTargetValue: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.colors.text,
    },
    progressRingWrap: {
      alignItems: "center",
      marginVertical: 20,
      marginHorizontal: 16,
      padding: 24,
      borderRadius: 24,
      backgroundColor: theme.colors.card,
      ...theme.shadows.medium,
    },
    progressRingLabels: {
      alignItems: "center",
      marginTop: 12,
    },
    progressPercent: {
      fontSize: 36,
      fontWeight: "800",
      color: theme.colors.text,
      letterSpacing: -1,
    },
    progressDetail: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },

    // === Chart Card ===
    chartCard: {
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 24,
      padding: 20,
      backgroundColor: theme.colors.card,
      ...theme.shadows.medium,
    },
    chartCardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: 14,
    },
    chartWrap: {
      alignItems: "center",
      height: 200,
    },
    completionBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "center",
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 16,
      marginTop: 14,
      gap: 8,
    },
    completionText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#ffffff",
    },

    // === What-If Section ===
    whatIfSection: {
      paddingHorizontal: 16,
      marginTop: 12,
    },
    whatIfCard: {
      borderRadius: 24,
      padding: 20,
      backgroundColor: theme.colors.card,
      marginBottom: 14,
      ...theme.shadows.medium,
    },
    whatIfTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: 16,
    },
    sliderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginBottom: 18,
    },
    sliderIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    sliderContent: {
      flex: 1,
    },
    sliderLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.text,
    },
    sliderValue: {
      fontSize: 17,
      fontWeight: "800",
      color: theme.colors.primary,
      minWidth: 60,
      textAlign: "right",
    },
    sliderTrack: {
      height: 6,
      borderRadius: 3,
      marginTop: 8,
    },
    sliderThumb: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 3,
      borderColor: "#ffffff",
    },
    impactBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      alignSelf: "flex-start",
      marginTop: 6,
    },
    impactText: {
      fontSize: 12,
      fontWeight: "700",
    },

    // === Scenario Comparison ===
    comparisonWrap: {
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 24,
      padding: 20,
      backgroundColor: theme.colors.card,
      ...theme.shadows.medium,
    },
    scenarioChip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      marginRight: 8,
      borderWidth: 1.5,
    },
    scenarioChipActive: {
      borderWidth: 2,
    },
    scenarioLabel: {
      fontSize: 13,
      fontWeight: "600",
    },

    // === Create Goal Wizard ===
    planTypeList: {
      gap: 12,
    },
    planTypeCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      backgroundColor: theme.colors.card,
      ...theme.shadows.medium,
    },
    planTypeIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    planTypeTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.colors.text,
    },
    planTypeDescription: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 3,
      lineHeight: 16,
    },
    switchPlanButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      paddingVertical: 8,
      marginBottom: 8,
    },
    switchPlanText: {
      fontSize: 13,
      fontWeight: "800",
    },
    planFormHero: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      backgroundColor: theme.colors.card,
      marginBottom: 20,
      ...theme.shadows.small,
    },
    planFormTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.colors.text,
    },
    planFormSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      lineHeight: 17,
      marginTop: 2,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.colors.textSecondary,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    input: {
      height: 54,
      borderRadius: 16,
      paddingHorizontal: 16,
      fontSize: 17,
      fontWeight: "700",
      color: theme.colors.text,
      backgroundColor: theme.colors.backgroundSecondary,
    },
    inputFocused: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    row: {
      flexDirection: "row",
      gap: 12,
    },
    halfInput: {
      flex: 1,
    },
    wizardNav: {
      flexDirection: "row",
      gap: 12,
      paddingTop: 8,
    },
    wizardBtn: {
      flex: 1,
      height: 52,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    wizardBtnText: {
      fontSize: 16,
      fontWeight: "700",
    },
    planNotesInput: {
      minHeight: 100,
      paddingTop: 16,
      textAlignVertical: "top",
    },
    planPreviewCard: {
      borderRadius: 20,
      padding: 18,
      backgroundColor: theme.colors.card,
      marginTop: 4,
      ...theme.shadows.medium,
    },
    previewRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
    },
    planPreviewLabel: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontWeight: "600",
    },
    planPreviewValue: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: "800",
    },
    planPreviewWarning: {
      fontSize: 12,
      color: theme.colors.warning,
      fontWeight: "700",
      marginTop: 10,
      lineHeight: 17,
    },
    planBottomBar: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 70,
      paddingHorizontal: 20,
      paddingTop: 12,
      backgroundColor: theme.colors.background,
    },
    planCreateButton: {
      height: 54,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      ...theme.shadows.medium,
    },
    planCreateButtonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "800",
    },

    // === Scenarios Screen ===
    scenarioCard: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 20,
      padding: 18,
      backgroundColor: theme.colors.card,
      ...theme.shadows.medium,
    },
    scenarioHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    scenarioName: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.text,
    },
    defaultBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: `${theme.colors.primary}20`,
    },
    defaultBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    scenarioAssumptions: {
      marginTop: 14,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    assumptionChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: theme.colors.backgroundSecondary,
    },
    assumptionText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: "600",
    },

    // === Comparison row (on goal detail) ===
    comparisonRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: 18,
    },
    comparisonItem: {
      alignItems: "center",
      flex: 1,
    },
    comparisonDate: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.colors.text,
      marginTop: 4,
      textAlign: "center",
    },
    comparisonLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },

    // === Quick Stats Row ===
    quickStatsRow: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginTop: -10,
      marginBottom: 8,
      gap: 8,
    },
    quickStatItem: {
      flex: 1,
      borderRadius: 18,
      padding: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.card,
      ...theme.shadows.medium,
    },
    quickStatValue: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.colors.text,
      marginTop: 4,
    },
    quickStatLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    // === Glass card mix-in ===
    glassCard: {
      borderRadius: 24,
      backgroundColor: theme.isDark
        ? "rgba(255,255,255,0.05)"
        : "rgba(255,255,255,0.7)",
      borderWidth: 1,
      borderColor: theme.isDark
        ? "rgba(255,255,255,0.08)"
        : "rgba(255,255,255,0.3)",
    },
  });
