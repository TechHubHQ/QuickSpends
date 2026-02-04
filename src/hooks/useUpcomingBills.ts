import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface UpcomingBill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category_id?: string;
  account_id?: string;
  bill_type: 'transfer' | 'expense';
  to_account_id?: string;
  due_date: string;
  frequency: 'once' | 'monthly' | 'quarterly' | 'yearly';
  next_due_date?: string;
  description?: string;
  is_active: boolean;
  auto_pay: boolean;
  reminder_days: number;
  last_reminder_sent?: string;
  created_at: string;
}

export const useUpcomingBills = () => {
  const [bills, setBills] = useState<UpcomingBill[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchBills = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('upcoming_bills')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setBills(data || []);
    } catch (error) {
      console.error('Error fetching upcoming bills:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addBill = async (bill: Omit<UpcomingBill, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('upcoming_bills')
        .insert([{ ...bill, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setBills(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error adding bill:', error);
      throw error;
    }
  };

  const updateBill = async (id: string, updates: Partial<UpcomingBill>) => {
    try {
      const { data, error } = await supabase
        .from('upcoming_bills')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setBills(prev => prev.map(bill => bill.id === id ? data : bill));
      return data;
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  };

  const deleteBill = async (id: string) => {
    try {
      const { error } = await supabase
        .from('upcoming_bills')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setBills(prev => prev.filter(bill => bill.id !== id));
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  };

  const getUpcomingBills = (days: number = 7) => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return bills.filter(bill => {
      const dueDate = new Date(bill.due_date);
      return dueDate >= now && dueDate <= futureDate && bill.is_active;
    });
  };

  const getOverdueBills = () => {
    const now = new Date();
    return bills.filter(bill => {
      const dueDate = new Date(bill.due_date);
      return dueDate < now && bill.is_active;
    });
  };

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  return {
    bills,
    loading,
    addBill,
    updateBill,
    deleteBill,
    fetchBills,
    getUpcomingBills,
    getOverdueBills,
  };
};