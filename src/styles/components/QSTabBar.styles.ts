import { Dimensions, Platform, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");
const TAB_BAR_HEIGHT = 70;
const FAB_SIZE = 56;

export const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 0,
        width: width,
        backgroundColor: colors.background,
    },
    tabsContainer: {
        flexDirection: "row",
        height: TAB_BAR_HEIGHT,
        alignItems: "center",
        justifyContent: "space-around",
        paddingBottom: 10,
    },
    tabItem: {
        alignItems: "center",
        justifyContent: "center",
        width: width / 5,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: "600",
        marginTop: 4,
    },
    fab: {
        position: "absolute",
        top: -32, // Adjusted higher so it floats above the curve
        left: (width - FAB_SIZE) / 2,
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        alignItems: "center",
        justifyContent: "center",
        elevation: 8,
        ...Platform.select({
            web: {
                boxShadow: "0px 4px 8px rgba(19, 127, 236, 0.3)",
            },
            default: {
                shadowColor: "#137fec",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            }
        }),
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: TAB_BAR_HEIGHT + 20,
    },
    menuContainer: {
        width: width - 48,
        borderRadius: 24,
        padding: 24,
        gap: 16,
        elevation: 10,
        ...Platform.select({
            web: {
                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            },
            default: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            }
        }),
    },
    menuOption: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    optionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: "600",
    },
});
