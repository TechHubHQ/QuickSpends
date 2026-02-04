import { Dimensions, Platform, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;

export const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: 180, // Increased to account for absolute CTA
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 24,
    width: "100%",
  },
  headerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(14, 165, 233, 0.2)", // primary/20
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: theme.text,
  },
  mainContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 24,
  },
  mainCardContainer: {
    width: "100%",
    paddingHorizontal: 24,
    marginBottom: 32,
    alignItems: "center",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 4 / 3, // Maintain height/placement
    alignItems: "center",
    justifyContent: "center",
    transform: [{ scale: 0.7 }], // Reduced scale as requested
    overflow: "visible",
  },
  appName: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1.5,
    color: theme.text,
    marginTop: -30, // Pull closer to the logo due to scale
    marginBottom: 8,
    textTransform: "none",
  },
  liveSyncBadge: {
    position: "absolute",
    bottom: 16,
    left: 16,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: "rgba(11, 17, 33, 0.6)", // background-dark/60
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0EA5E9", // primary
    marginRight: 8,
  },
  liveText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  textSection: {
    width: "100%",
    paddingHorizontal: 24,
    marginBottom: 16,
    alignItems: "center",
  },
  mainHeading: {
    fontSize: isSmallDevice ? 28 : 36, // text-3xl md:text-4xl
    fontWeight: "800",
    textAlign: "center",
    lineHeight: isSmallDevice ? 34 : 44,
    marginBottom: 12,
    color: theme.text,
  },
  description: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
    color: theme.textSecondary,
  },
  featuresScroll: {
    paddingLeft: 24,
    paddingBottom: 16,
  },
  featuresContainer: {
    width: "100%",
    marginBottom: 32,
  },
  highlightText: {
    color: "#0EA5E9",
  },
  featureCard: {
    width: 256, // w-64
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 16,
    flexDirection: "column",
    gap: 12,
    backgroundColor: theme.cardBg,
    borderColor: theme.cardBorder,
    // Shadows
    shadowRadius: 4,
    elevation: 2,
    ...Platform.select({
      web: {
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.05)",
      },
    }),
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
    color: theme.text,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.textSecondary,
  },
  avatarsSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  avatarStack: {
    flexDirection: "row",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  trustedText: {
    fontSize: 12,
    marginLeft: 16,
    fontWeight: "500",
  },
  trustedCount: {
    fontWeight: "700",
  },
  ctaContainer: {
    width: "100%",
    padding: 24,
    paddingBottom: 24, // Adjust for safe area if needed or rely on parent
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  ctaContent: {
    width: "100%",
    gap: 12,
    backgroundColor: "transparent",
  },
  footerText: {
    textAlign: "center",
    fontSize: 10,
    marginTop: 16,
    paddingHorizontal: 32,
  },
  footerLink: {
    textDecorationLine: "underline",
  },
  bottomIndicator: {
    width: 128,
    height: 4,
    backgroundColor: isDark ? "#334155" : "#CBD5E1",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 24,
    marginBottom: 4,
  },
  gradientFade: {
    top: -40,
    height: 40,
  },
});
