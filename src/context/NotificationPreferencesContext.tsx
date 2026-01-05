import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

export interface NotificationPreferences {
    budgetAlerts: boolean;
    tripAlerts: boolean;
    billReminders: boolean; // recurring
    lowBalanceAlerts: boolean;
    splitReminders: boolean;
    monthlySummary: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
    budgetAlerts: true,
    tripAlerts: true,
    billReminders: true,
    lowBalanceAlerts: true,
    splitReminders: true,
    monthlySummary: true,
};

interface NotificationPreferencesContextType {
    preferences: NotificationPreferences;
    togglePreference: (key: keyof NotificationPreferences) => Promise<void>;
    loading: boolean;
}

const NotificationPreferencesContext = createContext<NotificationPreferencesContextType | undefined>(undefined);

export const NotificationPreferencesProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
    const [loading, setLoading] = useState(true);

    const STORAGE_KEY = user ? `notification_prefs_${user.id}` : null;

    useEffect(() => {
        const loadPreferences = async () => {
            if (!STORAGE_KEY) {
                setLoading(false);
                return;
            }

            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (stored) {
                    setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
                } else {
                    setPreferences(DEFAULT_PREFERENCES);
                }
            } catch (error) {
                console.error('Failed to load notification preferences', error);
            } finally {
                setLoading(false);
            }
        };

        loadPreferences();
    }, [STORAGE_KEY]);

    const togglePreference = useCallback(async (key: keyof NotificationPreferences) => {
        if (!STORAGE_KEY) return;

        setPreferences(prev => {
            const updated = { ...prev, [key]: !prev[key] };
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(err => {
                console.error('Failed to save preferences', err);
            });
            return updated;
        });
    }, [STORAGE_KEY]);

    return (
        <NotificationPreferencesContext.Provider value={{ preferences, togglePreference, loading }}>
            {children}
        </NotificationPreferencesContext.Provider>
    );
};

export const useNotificationPreferences = () => {
    const context = useContext(NotificationPreferencesContext);
    if (!context) {
        throw new Error('useNotificationPreferences must be used within a NotificationPreferencesProvider');
    }
    return context;
};
