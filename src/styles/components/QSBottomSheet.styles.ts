import { Platform, StyleSheet } from "react-native";

export const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end', // Default for bottom sheet
    },
    floatingOverlay: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        width: '100%',
        elevation: 10,
        ...Platform.select({
            web: {
                boxShadow: "0px -4px 12px rgba(0, 0, 0, 0.25)",
            },
            default: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
            }
        }),
        overflow: 'hidden', // Ensure children don't overlap rounded corners
    },
    floatingContainer: {
        borderRadius: 24,
        maxHeight: '80%',
        width: '100%',
        maxWidth: 400,
        borderWidth: 1.5,
        borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
        elevation: 12,
        ...Platform.select({
            web: {
                boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.3)",
            },
            default: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
            }
        }),
        overflow: 'hidden', // Essential for floating card rounded corners
    },
    header: {
        paddingTop: 12,
        paddingBottom: 8,
        backgroundColor: colors.background,
    },
    dragHandle: {
        width: 48,
        height: 6,
        backgroundColor: isDark ? '#475569' : '#CBD5E1',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 16,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
    },
    closeButton: {
        padding: 4,
    },
    searchContainer: {
        paddingHorizontal: 24,
        paddingVertical: 8,
        backgroundColor: colors.background,
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '500',
        color: colors.text,
        padding: 0,
        textAlign: 'left',
        textAlignVertical: 'center',
    },
    content: {
        paddingHorizontal: 24,
        paddingVertical: 8,
    },
    footer: {
        padding: 24,
        paddingTop: 8,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    doneButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        ...Platform.select({
            web: {
                boxShadow: `0px 4px 8px ${colors.primary}33`,
            },
            default: {
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            }
        }),
    },
    doneButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});
