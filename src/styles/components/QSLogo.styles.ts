import { StyleSheet } from "react-native";

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
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
    },
});
