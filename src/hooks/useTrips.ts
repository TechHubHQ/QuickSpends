import { useCallback, useState } from 'react';
import { generateUUID, getDatabase } from '../lib/database';

export interface Trip {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    totalSpent: number;
    budget: number;
    image: string;
    currency: string;
    status: 'upcoming' | 'active' | 'completed';
    type: 'solo' | 'group';
    locations?: string[];
    tripMode?: 'single' | 'multi';
    groupId?: string;
}

export const useTrips = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getTripsByUser = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();

            // Fetch trips (order by creation first, we'll sub-sort in JS for status)
            const tripsData = await db.getAllAsync<any>(
                'SELECT * FROM trips WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );

            const now = new Date();
            now.setHours(0, 0, 0, 0); // Normalize today for date-only comparison

            const trips: Trip[] = await Promise.all(tripsData.map(async (trip) => {
                // Fetch total spending for this trip
                const spending = await db.getFirstAsync<{ total: number }>(
                    'SELECT SUM(amount) as total FROM transactions WHERE trip_id = ? AND type = "expense"',
                    [trip.id]
                );

                const startDate = new Date(trip.start_date);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(trip.end_date);
                endDate.setHours(23, 59, 59, 999);

                let status: 'upcoming' | 'active' | 'completed';
                if (now < startDate) {
                    status = 'upcoming';
                } else if (now > endDate) {
                    status = 'completed';
                } else {
                    status = 'active';
                }

                const type = trip.group_id ? 'group' : 'solo';

                return {
                    id: trip.id,
                    name: trip.name,
                    startDate: trip.start_date,
                    endDate: trip.end_date,
                    totalSpent: Math.abs(spending?.total || 0),
                    budget: trip.budget_amount || 0,
                    image: trip.image_url || 'https://loremflickr.com/800/600/travel,landscape',
                    currency: trip.base_currency || 'INR',
                    status,
                    type: type as 'solo' | 'group',
                    locations: trip.locations ? JSON.parse(trip.locations) : [],
                    tripMode: trip.trip_mode as 'single' | 'multi',
                    groupId: trip.group_id
                };
            }));

            // Sort by Status Priority: Active (0) > Upcoming (1) > Completed (2)
            // Within same status, they are already ordered by created_at DESC from SQL
            const statusPriority = { active: 0, upcoming: 1, completed: 2 };
            return trips.sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);
        } catch (err: any) {

            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const addTrip = useCallback(async (trip: {
        name: string;
        user_id: string;
        group_id?: string;
        budget_amount?: number;
        start_date: string;
        end_date: string;
        image_url?: string;
        base_currency?: string;
        locations?: string[];
        trip_mode?: 'single' | 'multi';
    }): Promise<{ success: boolean; error?: string }> => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            const id = generateUUID();

            await db.runAsync(
                `INSERT INTO trips (id, name, user_id, group_id, budget_amount, start_date, end_date, image_url, base_currency, locations, trip_mode) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    trip.name,
                    trip.user_id,
                    trip.group_id || null,
                    trip.budget_amount || 0,
                    trip.start_date,
                    trip.end_date,
                    trip.image_url || null,
                    trip.base_currency || 'INR',
                    trip.locations ? JSON.stringify(trip.locations) : null,
                    trip.trip_mode || 'single'
                ]
            );

            return { success: true };
        } catch (err: any) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const getTripById = useCallback(async (tripId: string) => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();
            const trip = await db.getFirstAsync<any>(
                'SELECT * FROM trips WHERE id = ?',
                [tripId]
            );

            if (!trip) return null;

            // Fetch total spending for this trip
            const spending = await db.getFirstAsync<{ total: number }>(
                'SELECT SUM(amount) as total FROM transactions WHERE trip_id = ? AND type = "expense"',
                [trip.id]
            );

            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const startDate = new Date(trip.start_date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(trip.end_date);
            endDate.setHours(23, 59, 59, 999);

            let status: 'upcoming' | 'active' | 'completed';
            if (now < startDate) {
                status = 'upcoming';
            } else if (now > endDate) {
                status = 'completed';
            } else {
                status = 'active';
            }

            const type = trip.group_id ? 'group' : 'solo';

            return {
                id: trip.id,
                name: trip.name,
                startDate: trip.start_date,
                endDate: trip.end_date,
                totalSpent: Math.abs(spending?.total || 0),
                budget: trip.budget_amount || 0,
                image: trip.image_url || 'https://loremflickr.com/800/600/travel,landscape',
                currency: trip.base_currency || 'INR',
                status,
                type: type as 'solo' | 'group',
                locations: trip.locations ? JSON.parse(trip.locations) : [],
                tripMode: trip.trip_mode as 'single' | 'multi',
                groupId: trip.group_id
            } as Trip;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const editTrip = useCallback(async (tripId: string, updates: Partial<Trip> & { locations?: string[], image_url?: string }): Promise<{ success: boolean; error?: string }> => {
        setLoading(true);
        setError(null);
        try {
            const db = await getDatabase();

            // Build dynamic update query
            const fields: string[] = [];
            const values: any[] = [];

            if (updates.name) { fields.push('name = ?'); values.push(updates.name); }
            if (updates.budget !== undefined) { fields.push('budget_amount = ?'); values.push(updates.budget); }
            if (updates.startDate) { fields.push('start_date = ?'); values.push(updates.startDate); }
            if (updates.endDate) { fields.push('end_date = ?'); values.push(updates.endDate); }
            if (updates.image_url) { fields.push('image_url = ?'); values.push(updates.image_url); } // Note: mismatched key in Interface vs DB usually, but passed as param here
            if (updates.currency) { fields.push('base_currency = ?'); values.push(updates.currency); }
            if (updates.locations) { fields.push('locations = ?'); values.push(JSON.stringify(updates.locations)); }
            if (updates.tripMode) { fields.push('trip_mode = ?'); values.push(updates.tripMode); }
            // Add other fields as necessary

            if (fields.length === 0) return { success: true }; // Nothing to update

            values.push(tripId);

            await db.runAsync(
                `UPDATE trips SET ${fields.join(', ')} WHERE id = ?`,
                values
            );

            return { success: true };
        } catch (err: any) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteTrip = useCallback(async (tripId: string): Promise<{ success: boolean; error?: string }> => {
        setLoading(true);
        setError(null);
        try {
            // 1. Check Status
            const trip = await getTripById(tripId);
            if (!trip) throw new Error("Trip not found");

            if (trip.status === 'active') {
                throw new Error("Cannot delete an active trip. Please wait until it is completed or change dates.");
            }

            const db = await getDatabase();

            // 2. Delete Trip (Cascading delete for transactions is usually handled by DB, but we might need manual cleanup if FKs aren't strict)
            // Ideally transactions table should have ON DELETE CASCADE for trip_id

            // Manual cleanup just in case
            // 2. Delete Trip and Linked Transactions with Balance Revert

            // Fetch transactions first to revert balances
            const transactions = await db.getAllAsync<{
                id: string,
                amount: number,
                type: 'income' | 'expense' | 'transfer',
                account_id: string
            }>(
                `SELECT id, amount, type, account_id FROM transactions WHERE trip_id = ?`,
                [tripId]
            );

            await db.withTransactionAsync(async () => {
                // Revert balances
                for (const txn of transactions) {
                    if (txn.type === 'expense') {
                        await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [txn.amount, txn.account_id]);
                    } else if (txn.type === 'income') {
                        await db.runAsync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [txn.amount, txn.account_id]);
                    }
                }

                // Delete transactions
                await db.runAsync('DELETE FROM transactions WHERE trip_id = ?', [tripId]);

                // Delete Trip
                await db.runAsync('DELETE FROM trips WHERE id = ?', [tripId]);
            });

            return { success: true };
        } catch (err: any) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [getTripById]);

    return {
        getTripsByUser,
        getTripById,
        addTrip,
        editTrip,
        deleteTrip,
        loading,
        error
    };
};
