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
          sub_category_id: string | null;
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
          sub_category_id?: string | null;
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
          sub_category_id?: string | null;
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
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          is_event: boolean;
          event_type: 'birthday' | 'marriage' | 'anniversary' | 'festival' | 'travel' | 'other' | null;
          event_date: string | null;
          budget: number | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          is_event?: boolean;
          event_type?: 'birthday' | 'marriage' | 'anniversary' | 'festival' | 'travel' | 'other' | null;
          event_date?: string | null;
          budget?: number | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          is_event?: boolean;
          event_type?: 'birthday' | 'marriage' | 'anniversary' | 'festival' | 'travel' | 'other' | null;
          event_date?: string | null;
          budget?: number | null;
          description?: string | null;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          amount: number;
          type: 'income' | 'expense' | 'transfer';
          date: string;
          trip_id: string | null;
          to_account_id: string | null;
          receipt_url: string | null;
          recurring_id: string | null;
          savings_id: string | null;
          loan_id: string | null;
          tag_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          amount: number;
          type: 'income' | 'expense' | 'transfer';
          date: string;
          trip_id?: string | null;
          to_account_id?: string | null;
          receipt_url?: string | null;
          recurring_id?: string | null;
          savings_id?: string | null;
          loan_id?: string | null;
          tag_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          category_id?: string | null;
          name?: string;
          description?: string | null;
          amount?: number;
          type?: 'income' | 'expense' | 'transfer';
          date?: string;
          trip_id?: string | null;
          to_account_id?: string | null;
          receipt_url?: string | null;
          recurring_id?: string | null;
          savings_id?: string | null;
          loan_id?: string | null;
          tag_id?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
