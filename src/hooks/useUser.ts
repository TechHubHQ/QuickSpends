import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface User {
    id: string;
    username: string;
    email: string;
    created_at: string;
    avatar?: string;
}

export const useUser = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getUserByEmail = useCallback(async (email: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', email)
                .maybeSingle();

            if (error) throw error;
            return data as User;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        getUserByEmail,
        loading,
        error,
    };
};
