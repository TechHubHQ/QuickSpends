import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

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
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getTripsByUser = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch trips
            // We want all trips visible to the user (owned + shared) if fetching for self.
            // If fetching for another user, we strictly filter by their ownership.
            let query = supabase.from('trips').select('*');

            if (!user || user.id !== userId) {
                query = query.eq('user_id', userId);
            }

            const { data: tripsData, error: tripsError } = await query.order('created_at', { ascending: false });

            if (tripsError) throw tripsError;

            const now = new Date();
            now.setHours(0, 0, 0, 0);

            const trips: Trip[] = await Promise.all((tripsData || []).map(async (trip) => {
                // Fetch total spending for this trip
                const { data: spendingData, error: spendingError } = await supabase
                    .from('transactions')
                    .select('amount')
                    .eq('trip_id', trip.id)
                    .eq('type', 'expense');

                if (spendingError) throw spendingError;
                const totalSpent = (spendingData || []).reduce((sum, t) => sum + t.amount, 0);

                const startDate = new Date(trip.start_date);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(trip.end_date);
                endDate.setHours(23, 59, 59, 999);

                let status: 'upcoming' | 'active' | 'completed';
                if (now < startDate) status = 'upcoming';
                else if (now > endDate) status = 'completed';
                else status = 'active';

                return {
                    id: trip.id,
                    name: trip.name,
                    startDate: trip.start_date,
                    endDate: trip.end_date,
                    totalSpent: Math.abs(totalSpent),
                    budget: trip.budget_amount || 0,
                    image: trip.image_url || 'https://loremflickr.com/800/600/travel,landscape',
                    currency: trip.base_currency || 'INR',
                    status,
                    type: trip.group_id ? 'group' : 'solo',
                    locations: trip.locations ? JSON.parse(trip.locations) : [],
                    tripMode: trip.trip_mode as 'single' | 'multi',
                    groupId: trip.group_id
                };
            }));

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
            const { data: newTrip, error } = await supabase
                .from('trips')
                .insert({
                    ...trip,
                    locations: trip.locations ? JSON.stringify(trip.locations) : null
                })
                .select()
                .single();

            if (error) throw error;

            // Notify group members if it's a group trip
            if (trip.group_id && newTrip) {
                const { data: group } = await supabase.from('groups').select('name').eq('id', trip.group_id).single();
                const { data: creator } = await supabase.from('profiles').select('username').eq('id', trip.user_id).single();
                const { data: members } = await supabase.from('group_members').select('user_id').eq('group_id', trip.group_id);

                if (members && members.length > 0) {
                    const membersToNotify = members.filter(m => m.user_id !== trip.user_id);
                    const notificationPromises = membersToNotify.map(m =>
                        supabase.from('notifications').insert({
                            user_id: m.user_id,
                            type: 'info',
                            title: 'New Group Trip',
                            message: `${creator?.username || 'A member'} added a new trip "${trip.name}" to "${group?.name || 'your group'}".`,
                            data: { tripId: newTrip.id, groupId: trip.group_id },
                            is_read: false
                        })
                    );
                    await Promise.all(notificationPromises);
                }
            }

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
            const { data: trip, error: tripError } = await supabase
                .from('trips')
                .select('*')
                .eq('id', tripId)
                .single();

            if (tripError || !trip) return null;

            // Fetch total spending for this trip
            const { data: spendingData, error: spendingError } = await supabase
                .from('transactions')
                .select('amount')
                .eq('trip_id', tripId)
                .eq('type', 'expense');

            if (spendingError) throw spendingError;
            const totalSpent = (spendingData || []).reduce((sum, t) => sum + t.amount, 0);

            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const startDate = new Date(trip.start_date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(trip.end_date);
            endDate.setHours(23, 59, 59, 999);

            let status: 'upcoming' | 'active' | 'completed';
            if (now < startDate) status = 'upcoming';
            else if (now > endDate) status = 'completed';
            else status = 'active';

            return {
                id: trip.id,
                name: trip.name,
                startDate: trip.start_date,
                endDate: trip.end_date,
                totalSpent: Math.abs(totalSpent),
                budget: trip.budget_amount || 0,
                image: trip.image_url || 'https://loremflickr.com/800/600/travel,landscape',
                currency: trip.base_currency || 'INR',
                status,
                type: trip.group_id ? 'group' : 'solo',
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
            const dbUpdates: any = {};
            if (updates.name) dbUpdates.name = updates.name;
            if (updates.budget !== undefined) dbUpdates.budget_amount = updates.budget;
            if (updates.startDate) dbUpdates.start_date = updates.startDate;
            if (updates.endDate) dbUpdates.end_date = updates.endDate;
            if (updates.image_url) dbUpdates.image_url = updates.image_url;
            if (updates.currency) dbUpdates.base_currency = updates.currency;
            if (updates.locations) dbUpdates.locations = JSON.stringify(updates.locations);
            if (updates.tripMode) dbUpdates.trip_mode = updates.tripMode;

            if (Object.keys(dbUpdates).length === 0) return { success: true };

            const { error } = await supabase
                .from('trips')
                .update(dbUpdates)
                .eq('id', tripId);

            if (error) throw error;
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

            // 2. Fetch transactions to revert balances
            const { data: transactions, error: transError } = await supabase
                .from('transactions')
                .select('id, amount, type, account_id')
                .eq('trip_id', tripId);

            if (transError) throw transError;

            // 3. Revert balances
            for (const txn of (transactions || [])) {
                const { data: acc } = await supabase.from('accounts').select('balance').eq('id', txn.account_id).single();
                if (acc) {
                    const change = txn.type === 'expense' ? txn.amount : -txn.amount;
                    await supabase.from('accounts').update({ balance: acc.balance + change }).eq('id', txn.account_id);
                }
            }

            // 4. Delete transactions
            await supabase.from('transactions').delete().eq('trip_id', tripId);

            // 5. Delete Trip
            const { error: tripDeleteError } = await supabase.from('trips').delete().eq('id', tripId);
            if (tripDeleteError) throw tripDeleteError;

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
