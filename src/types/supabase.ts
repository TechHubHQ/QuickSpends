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
          is_system: boolean;
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
          is_system?: boolean;
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
          is_system?: boolean;
          event_type?: 'birthday' | 'marriage' | 'anniversary' | 'festival' | 'travel' | 'other' | null;
          event_date?: string | null;
          budget?: number | null;
          description?: string | null;
          created_at?: string;
        };
      };
      transaction_tags: {
        Row: {
          transaction_id: string;
          tag_id: string;
        };
        Insert: {
          transaction_id: string;
          tag_id: string;
        };
        Update: {
          transaction_id?: string;
          tag_id?: string;
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
          nws_type: 'needs' | 'wants' | 'savings' | null;
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
          nws_type?: 'needs' | 'wants' | 'savings' | null;
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
          nws_type?: 'needs' | 'wants' | 'savings' | null;
          created_at?: string;
        };
      };
      vision_scenarios: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          is_default: boolean;
          assumptions: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          is_default?: boolean;
          assumptions?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          is_default?: boolean;
          assumptions?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      vision_plans: {
        Row: {
          id: string;
          user_id: string;
          plan_type: 'goal' | 'future_expense' | 'safety_buffer' | 'debt_payoff' | 'small_wish';
          title: string;
          target_amount: number;
          current_amount: number;
          monthly_allocation: number;
          target_date: string | null;
          priority: number;
          status: 'active' | 'paused' | 'completed' | 'archived';
          notes: string | null;
          icon: string | null;
          color: string | null;
          handling_strategy: string | null;
          linked_savings_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_type?: 'goal' | 'future_expense' | 'safety_buffer' | 'debt_payoff' | 'small_wish';
          title: string;
          target_amount?: number;
          current_amount?: number;
          monthly_allocation?: number;
          target_date?: string | null;
          priority?: number;
          status?: 'active' | 'paused' | 'completed' | 'archived';
          notes?: string | null;
          icon?: string | null;
          color?: string | null;
          handling_strategy?: string | null;
          linked_savings_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_type?: 'goal' | 'future_expense' | 'safety_buffer' | 'debt_payoff' | 'small_wish';
          title?: string;
          target_amount?: number;
          current_amount?: number;
          monthly_allocation?: number;
          target_date?: string | null;
          priority?: number;
          status?: 'active' | 'paused' | 'completed' | 'archived';
          notes?: string | null;
          icon?: string | null;
          color?: string | null;
          handling_strategy?: string | null;
          linked_savings_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
