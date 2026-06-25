import { StyleSheet } from 'react-native';
import { Theme } from '../theme/ThemeContext';

export const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    typeContainer: {
        flexDirection: 'row',
        backgroundColor: theme.isDark ? '#1E293B' : '#F1F5F9',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    typeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.isDark ? '#1E293B' : '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.isDark ? '#334155' : '#E2E8F0',
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: theme.colors.text,
    },
    currency: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.textSecondary,
        marginRight: 8,
    },
    buttonContainer: {
        marginTop: 24,
    },
});
