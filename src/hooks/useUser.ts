import { useCallback, useState } from 'react';
import { generateUUID, getDatabase } from '../lib/database';

export interface User {
    id: string;
    username: string;
    phone: string;
    password_hash: string;
    created_at: string;
    avatar?: string;
}

export const useUser = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createUser = useCallback(async (username: string, phone: string, passwordHash: string) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            const id = generateUUID();
            await db.runAsync(
                'INSERT INTO users (id, username, phone, password_hash) VALUES (?, ?, ?, ?)',
                [id, username, phone, passwordHash]
            );
            return id;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const getUserByPhone = useCallback(async (phone: string) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            const user = await db.getFirstAsync<User>(
                'SELECT * FROM users WHERE phone = ?',
                [phone]
            );
            return user;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        createUser,
        getUserByPhone,
        loading,
        error,
    };
};
