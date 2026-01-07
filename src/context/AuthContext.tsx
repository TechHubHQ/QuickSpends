import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Logger } from '../services/logger';

const SESSION_KEY = 'user_session';

export interface UserSession {
    id: string;
    email: string;
    username: string;
    avatar?: string;
    profile_url?: string; // Legacy/Auth
}

interface AuthContextType {
    user: UserSession | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    updateProfile: (data: Partial<UserSession>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 1. Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                Logger.info('Session restored', { userId: session.user.id });
                setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    username: session.user.user_metadata?.username || '',
                    avatar: session.user.user_metadata?.avatar || '',
                });
            } else {
                Logger.debug('No active session found during initialization');
            }
            setIsLoading(false);
        });

        // 2. Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    username: session.user.user_metadata?.username || '',
                    avatar: session.user.user_metadata?.avatar || '',
                });
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    async function signOut() {
        try {
            Logger.info('User signing out', { userId: user?.id });
            await supabase.auth.signOut();
        } catch (error) {
            Logger.error("Sign out error", error);
            console.error("Sign out error:", error);
        }
    }

    async function updateProfile(data: Partial<UserSession>) {
        if (!user) return;

        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    username: data.username || user.username,
                    avatar: data.avatar || user.avatar,
                }
            });

            if (error) throw error;

            // Update profiles table as well (publicly searchable)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    username: data.username || user.username,
                    avatar: data.avatar || user.avatar,
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            setUser(prev => prev ? { ...prev, ...data } : null);
        } catch (error) {
            console.error('Failed to update profile', error);
            Logger.error('Failed to update profile', error);
            throw error;
        }
    }

    async function signIn(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        if (error) {
            Logger.error('Sign in failed', error, { email });
        } else {
            Logger.info('Sign in successful', { email });
        }
        return { error };
    }

    async function signUp(email: string, password: string, username: string) {
        const { error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    avatar: '',
                }
            }
        });
        if (error) {
            Logger.error('Sign up failed', error, { email });
        } else {
            Logger.info('Sign up successful', { email });
        }
        return { error };
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, updateProfile }}>
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
