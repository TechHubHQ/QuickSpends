export interface Database {
  public: {
    Tables: {
      upcoming_bills: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          category_id: string | null;
          account_id: string | null;
          bill_type: 'transfer' | 'expense';
          to_account_id: string | null;
          due_date: string;
          frequency: 'once' | 'monthly' | 'quarterly' | 'yearly';
          next_due_date: string | null;
          description: string | null;
          is_active: boolean;
          auto_pay: boolean;
          reminder_days: number;
          last_reminder_sent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          amount: number;
          category_id?: string | null;
          account_id?: string | null;
          bill_type?: 'transfer' | 'expense';
          to_account_id?: string | null;
          due_date: string;
          frequency?: 'once' | 'monthly' | 'quarterly' | 'yearly';
          next_due_date?: string | null;
          description?: string | null;
          is_active?: boolean;
          auto_pay?: boolean;
          reminder_days?: number;
          last_reminder_sent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          amount?: number;
          category_id?: string | null;
          account_id?: string | null;
          bill_type?: 'transfer' | 'expense';
          to_account_id?: string | null;
          due_date?: string;
          frequency?: 'once' | 'monthly' | 'quarterly' | 'yearly';
          next_due_date?: string | null;
          description?: string | null;
          is_active?: boolean;
          auto_pay?: boolean;
          reminder_days?: number;
          last_reminder_sent?: string | null;
          created_at?: string;
        };
      };
    };
  };
}