import { Platform, StyleSheet } from "react-native";

export const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 20 : 40,
    paddingBottom: 24,
    paddingHorizontal: 24,
    width: "100%",
    backgroundColor: "transparent",
    zIndex: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
  },
  backIcon: {
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
    color: theme.text,
  },
  headerSpacer: {
    width: 40,
  },
  formSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 20,
  },
  titleSection: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 40,
    marginBottom: 8,
    letterSpacing: -0.5,
    color: theme.text,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
    color: theme.textSecondary,
  },
  inputContainer: {
    marginTop: 0,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
    color: theme.text,
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  inputIcon: {
    position: "absolute",
    left: 16,
    top: 18, // approximate center for 56px height
    zIndex: 10,
  },
  input: {
    height: 56,
    borderRadius: 9999, // rounded-full
    borderWidth: 1,
    paddingLeft: 48, // pl-12
    paddingRight: 16,
    fontSize: 16,
    fontWeight: "400",
    backgroundColor: theme.surface,
    borderColor: theme.inputBorder,
    color: theme.text,
    textAlign: 'left',
    textAlignVertical: 'center',
  },
  inputError: {
    borderColor: "red",
  },
  passwordInput: {
    height: 56,
    borderRadius: 9999,
    borderWidth: 1,
    paddingLeft: 48,
    paddingRight: 48, // space for eye icon
    fontSize: 16,
    fontWeight: "400",
    backgroundColor: theme.surface,
    borderColor: theme.inputBorder,
    color: theme.text,
  },
  inputSuccessIcon: {
    position: "absolute",
    right: 16,
    top: 18,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 2,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    color: "red",
  },
  termsText: {
    fontSize: 12,
    marginTop: 8,
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  dividerSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialButtonsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  socialButton: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
    borderWidth: 1,
    gap: 8,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  footerSection: {
    flexDirection: "row",
    justifyContent: "center",
    paddingTop: 32,
    gap: 4,
  },
  footerText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  footerLinkText: {
    fontSize: 14,
    color: theme.text,
    fontWeight: "bold",
  },
  bottomSpacer: {
    height: 20,
  },
});
