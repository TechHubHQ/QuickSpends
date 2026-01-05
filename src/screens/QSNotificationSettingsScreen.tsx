import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { QSHeader } from '../components/QSHeader';
import { useNotificationPreferences } from '../context/NotificationPreferencesContext';
import { useTheme } from '../theme/ThemeContext';
import { Theme } from '../theme/theme';

const QSNotificationSettingsScreen = () => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const { preferences, togglePreference } = useNotificationPreferences();
    const router = useRouter();

    const renderToggle = (
        label: string,
        description: string,
        key: keyof typeof preferences,
        icon: keyof typeof MaterialCommunityIcons.glyphMap,
        iconColor: string
    ) => {
        return (
            <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                    <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
                        <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.settingLabel}>{label}</Text>
                        <Text style={styles.settingDescription}>{description}</Text>
                    </View>
                </View>
                <Switch
                    value={preferences[key]}
                    onValueChange={() => togglePreference(key)}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor={'#FFF'}
                />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <QSHeader title="Notification Preferences" showBack onBackPress={() => router.back()} />

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Alerts & Reminders</Text>
                    {renderToggle(
                        'Budget Alerts',
                        'Get notified when you exceed 90% of your budget',
                        'budgetAlerts',
                        'chart-box-outline',
                        '#F59E0B' // Amber
                    )}
                    {renderToggle(
                        'Trip Budget Alerts',
                        'Get notified when trip spending is high',
                        'tripAlerts',
                        'airplane',
                        '#3B82F6' // Blue
                    )}
                    {renderToggle(
                        'Bill Reminders',
                        'Reminders for upcoming recurring payments',
                        'billReminders',
                        'calendar-clock',
                        '#10B981' // Green
                    )}
                    {renderToggle(
                        'Low Balance & High Dues',
                        'Alert when balance is low or credit card dues are high',
                        'lowBalanceAlerts',
                        'bank-outline',
                        '#EF4444' // Red
                    )}
                    {renderToggle(
                        'Split Payments',
                        'Reminders for pending split settlements',
                        'splitReminders',
                        'account-cash-outline',
                        '#8B5CF6' // Purple
                    )}
                    {renderToggle(
                        'Monthly Summary',
                        'Receive a summary of your spending each month',
                        'monthlySummary',
                        'file-document-outline',
                        theme.colors.text
                    )}
                </View>


            </ScrollView>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        padding: theme.spacing.m,
    },
    section: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.l,
        ...theme.shadows.small,
        overflow: 'hidden',
        paddingVertical: theme.spacing.s,
    },
    sectionTitle: {
        ...theme.typography.h3,
        color: theme.colors.text,
        marginHorizontal: theme.spacing.m,
        marginTop: theme.spacing.m,
        marginBottom: theme.spacing.s,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border + '40', // Very light border
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: theme.spacing.m,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.m,
    },
    textContainer: {
        flex: 1,
    },
    settingLabel: {
        ...theme.typography.body,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 2,
    },
    settingDescription: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        lineHeight: 16,
    },

});

export default QSNotificationSettingsScreen;
