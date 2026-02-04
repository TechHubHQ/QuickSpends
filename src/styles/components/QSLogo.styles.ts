import { Platform, StyleSheet } from "react-native";

export const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        // Base glow removed from container, moved to image to match Landing
    },
    logoImage: {
        width: "100%",
        height: "100%",
        // Glow effect matching Landing Screen
        ...Platform.select({
            web: {
                boxShadow: `0px 0px 20px ${colors.primary}`,
            },
            default: {
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 20,
            }
        }),
    },
});
