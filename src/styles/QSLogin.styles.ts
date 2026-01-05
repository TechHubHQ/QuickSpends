import { Dimensions, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");

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
        minHeight: height,
        paddingBottom: 20,
        justifyContent: "center",
    },
    // Background Decorations
    accentBlueBlob: {
        position: "absolute",
        top: -80,
        right: -80,
        width: 320,
        height: 320,
        borderRadius: 160,
        backgroundColor: "rgba(14, 165, 233, 0.1)", // accent-blue/10
    },
    primaryBlob: {
        position: "absolute",
        bottom: -80,
        left: -80,
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: "rgba(14, 165, 233, 0.1)", // matches accentBlueBlob
    },

    // Header Content
    headerContainer: {
        paddingBottom: 32,
        paddingHorizontal: 16,
        zIndex: 10,
        alignItems: "center",
    },
    mainCardContainer: {
        width: "100%",
        paddingHorizontal: 24,
        marginBottom: 16, // Reduced from 32 to keep text visible
        alignItems: "center",
    },
    imageContainer: {
        width: "100%",
        aspectRatio: 4 / 3,
        alignItems: "center",
        justifyContent: "center",
        transform: [{ scale: 0.85 }],
        overflow: "visible",
    },
    appName: {
        fontSize: 36,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 8,
        letterSpacing: -0.5,
        color: theme.text,
    },
    tagline: {
        fontSize: 16,
        fontWeight: "500",
        textAlign: "center",
        lineHeight: 24,
        color: theme.textSecondary,
    },

    // Form Content
    formContainer: {
        width: "100%",
        paddingHorizontal: 16,
        zIndex: 10,
        paddingBottom: 24,
        gap: 20,
    },
    inputGroup: {
        position: "relative",
    },
    inputIconContainer: {
        position: "absolute",
        left: 16,
        top: 18, // center vertical for 56px height
        zIndex: 10,
    },
    input: {
        height: 56,
        borderRadius: 28, // rounded-full
        borderWidth: 1,
        paddingLeft: 48, // pl-12
        paddingRight: 16,
        fontSize: 16,
        backgroundColor: theme.inputBg,
        borderColor: theme.inputBorder,
        color: theme.text,
        textAlign: 'left',
        textAlignVertical: 'center',
    },
    passwordInput: {
        paddingRight: 48,
    },
    eyeIconContainer: {
        position: "absolute",
        right: 16,
        top: 16,
        padding: 2,
    },
    forgotPasswordContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    forgotPasswordText: {
        fontSize: 14,
        fontWeight: "600",
        color: isDark ? theme.primary : theme.textSecondary,
    },
    faceIdContainer: {
        alignItems: "center",
        paddingTop: 8,
    },
    faceIdButton: {
        padding: 12,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: "transparent",
        backgroundColor: isDark ? theme.surface : "#F1F5F9",
    },

    // Footer / Divider
    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: theme.inputBorder,
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 12,
        fontWeight: "500",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: theme.textSecondary,
    },

    socialGrid: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 32,
    },
    socialButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 24,
        borderWidth: 1,
        backgroundColor: theme.surface,
        borderColor: theme.inputBorder,
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: theme.text,
    },

    signupContainer: {
        alignItems: "center",
        paddingBottom: 8,
    },
    signupText: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    signupLink: {
        fontWeight: "700",
        textDecorationLine: "underline",
        color: theme.primary,
    },
});
