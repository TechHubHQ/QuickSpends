import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

export const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        padding: 20,
        gap: 24,
    },
    heroSection: {
        backgroundColor: theme.colors.card,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    heroRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    detailsSection: {
        gap: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: 12,
    },
    detailIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    payeeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
        gap: 12,
        justifyContent: 'space-between',
    },
    footer: {
        padding: 20,
        backgroundColor: theme.colors.background,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    saveButton: {
        marginBottom: 20,
    }
});
