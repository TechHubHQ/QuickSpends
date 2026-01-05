import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getDatabase } from '../lib/database';

const SESSION_KEY = 'user_session';

export interface UserSession {
    id: string;
    phone: string;
    username: string;
    avatar?: string;
    profile_url?: string; // Legacy/Auth
}

interface AuthContextType {
    user: UserSession | null;
    isLoading: boolean;
    signIn: (userData: UserSession) => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (data: Partial<UserSession>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSession();
    }, []);

    async function loadSession() {
        try {
            const session = await SecureStore.getItemAsync(SESSION_KEY);
            if (session) {
                const sessionUser = JSON.parse(session);
                // Verify with DB to get latest
                const db = await getDatabase();
                const dbUser = await db.getFirstAsync<UserSession>(
                    'SELECT id, username, phone, avatar FROM users WHERE id = ?',
                    [sessionUser.id]
                );

                if (dbUser) {
                    setUser(dbUser);
                    // Update session with fresh data
                    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(dbUser));
                } else {
                    // User deleted or invalid? Fallback to session or logout
                    setUser(sessionUser);
                }
            }
        } catch (error) {
            console.error("Failed to load session:", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function signIn(userData: UserSession) {
        try {
            await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(userData));
            setUser(userData);
        } catch (error) {

        }
    }

    async function signOut() {
        try {
            await SecureStore.deleteItemAsync(SESSION_KEY);
            setUser(null);
        } catch (error) {

        }
    }

    async function updateProfile(data: Partial<UserSession>) {
        if (!user) return;

        try {
            const updatedUser = { ...user, ...data };

            // 1. Update SQLite
            const db = await getDatabase();
            // Dynamically build update query? Or just specific fields we allow
            if (data.username || data.phone || data.avatar) {
                await db.runAsync(
                    'UPDATE users SET username = ?, avatar = ? WHERE id = ?',
                    [updatedUser.username, updatedUser.avatar || null, user.id]
                );
            }

            // 2. Update SecureStore
            await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(updatedUser));

            // 3. Update State
            setUser(updatedUser);
        } catch (error) {
            console.error('Failed to update profile', error);
            throw error;
        }
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signOut, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
