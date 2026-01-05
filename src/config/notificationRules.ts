import { NotificationPreferences } from '../context/NotificationPreferencesContext';

export interface NotificationRuleContext {
    db: any;
    userId: string;
    preferences: NotificationPreferences;
    createNotification: (title: string, message: string, type: 'alert' | 'info' | 'invite' | 'success' | 'security', data?: any) => Promise<void>;
}

export interface NotificationRule {
    id: string;
    name: string;
    description: string;
    preferenceKey: keyof NotificationPreferences;
    check: (context: NotificationRuleContext) => Promise<void>;
}

export const notificationRules: NotificationRule[] = [
    {
        id: 'bill-reminders',
        name: 'Recurring Bill Reminders',
        description: 'Notify when a recurring payment is due soon',
        preferenceKey: 'billReminders',
        check: async ({ db, userId, createNotification }) => {
            const configs = await db.getAllAsync('SELECT * FROM recurring_configs WHERE user_id = ?', [userId]);

            for (const config of configs) {
                const lastExecuted = new Date(config.last_executed || config.start_date);
                const frequency = config.frequency;

                const getNextDueDate = (current: Date) => {
                    const next = new Date(current);
                    if (frequency === 'daily') next.setDate(next.getDate() + 1);
                    if (frequency === 'weekly') next.setDate(next.getDate() + 7);
                    if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
                    if (frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
                    return next;
                };

                const nextDueDate = getNextDueDate(lastExecuted);
                const now = new Date();
                const diffTime = nextDueDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 1 && diffDays >= 0) {
                    const lastNotified = config.last_notified_at ? new Date(config.last_notified_at) : null;
                    const isToday = lastNotified && lastNotified.toDateString() === now.toDateString();

                    if (!isToday) {
                        await createNotification('Recurring Payment Due', `"${config.name}" of ₹${config.amount} is due soon.`, 'info', { recurringId: config.id });
                        await db.runAsync('UPDATE recurring_configs SET last_notified_at = ? WHERE id = ?', [now.toISOString(), config.id]);
                    }
                }
            }
        }
    },
    {
        id: 'budget-alerts',
        name: 'Budget Utilization Alerts',
        description: 'Notify when a category budget reaches 90% utilization',
        preferenceKey: 'budgetAlerts',
        check: async ({ db, userId, createNotification }) => {
            const budgets = await db.getAllAsync(
                `SELECT b.*, c.name as category_name FROM budgets b JOIN categories c ON b.category_id = c.id WHERE b.user_id = ?`,
                [userId]
            );

            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            for (const budget of budgets) {
                if (budget.alert_month === currentMonth) continue;

                const result = await db.getFirstAsync(
                    `SELECT SUM(amount) as total FROM transactions 
                     WHERE user_id = ? AND category_id = ? AND type = 'expense' AND date >= ?`,
                    [userId, budget.category_id, startOfMonth]
                );

                const spent = result?.total || 0;
                if (spent >= (budget.amount * 0.9)) {
                    await createNotification(
                        'Budget Alert',
                        `You've used 90% of your ${budget.category_name} budget (₹${spent}/${budget.amount}).`,
                        'alert',
                        { budgetId: budget.id }
                    );
                    await db.runAsync('UPDATE budgets SET alert_month = ? WHERE id = ?', [currentMonth, budget.id]);
                }
            }
        }
    },
    {
        id: 'trip-alerts',
        name: 'Trip Budget Alerts',
        description: 'Notify when a trip budget reaches 90% utilization',
        preferenceKey: 'tripAlerts',
        check: async ({ db, userId, createNotification }) => {
            const trips = await db.getAllAsync('SELECT * FROM trips WHERE user_id = ? AND alert_sent = 0 AND budget_amount IS NOT NULL', [userId]);

            for (const trip of trips) {
                const result = await db.getFirstAsync(
                    `SELECT SUM(amount) as total FROM transactions WHERE trip_id = ? AND type = 'expense'`,
                    [trip.id]
                );
                const spent = result?.total || 0;

                if (spent >= (trip.budget_amount * 0.9)) {
                    await createNotification(
                        'Trip Budget Alert',
                        `You've used 90% of your budget for "${trip.name}" (₹${spent}/${trip.budget_amount}).`,
                        'alert',
                        { tripId: trip.id }
                    );
                    await db.runAsync('UPDATE trips SET alert_sent = 1 WHERE id = ?', [trip.id]);
                }
            }
        }
    },
    {
        id: 'split-reminders',
        name: 'Pending Split Reminders',
        description: 'Notify about pending splits older than 3 days',
        preferenceKey: 'splitReminders',
        check: async ({ db, userId, createNotification }) => {
            const pendingSplits = await db.getAllAsync(
                `SELECT s.*, t.description as trans_desc, t.date as trans_date 
                 FROM splits s 
                 JOIN transactions t ON s.transaction_id = t.id 
                 WHERE s.user_id = ? AND s.status = 'pending'`,
                [userId]
            );

            const now = new Date();
            for (const split of pendingSplits) {
                const transDate = new Date(split.trans_date);
                const diffTime = now.getTime() - transDate.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays >= 3 && !split.alert_sent) {
                    await createNotification(
                        'Pending Payment',
                        `You have a pending split of ₹${split.amount} for "${split.trans_desc || 'Expense'}"`,
                        'info',
                        { splitId: split.id }
                    );
                    await db.runAsync('UPDATE splits SET alert_sent = 1 WHERE id = ?', [split.id]);
                }
            }
        }
    },
    {
        id: 'low-balance-alerts',
        name: 'Low Balance Alerts',
        description: 'Notify when bank/cash balance is low or credit card use is high',
        preferenceKey: 'lowBalanceAlerts',
        check: async ({ db, userId, createNotification }) => {
            const accounts = await db.getAllAsync('SELECT * FROM accounts WHERE user_id = ? AND is_active = 1', [userId]);

            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];

            for (const acc of accounts) {
                let shouldAlert = false;
                let message = '';

                if ((acc.type === 'bank' || acc.type === 'cash')) {
                    if (acc.balance < 1000) {
                        shouldAlert = true;
                        message = `Your balance in ${acc.name} is low (₹${acc.balance}).`;
                    }
                } else if (acc.type === 'card' && acc.card_type === 'credit') {
                    if (acc.credit_limit) {
                        const outstanding = acc.credit_limit - acc.balance;
                        if (acc.balance < (acc.credit_limit * 0.1)) {
                            shouldAlert = true;
                            message = `High outstanding dues on ${acc.name}. You've used ${((outstanding / acc.credit_limit) * 100).toFixed(0)}% of your limit.`;
                        }
                    }
                }

                if (shouldAlert) {
                    const lastAlert = acc.last_low_balance_alert;
                    const lastAlertDate = lastAlert ? new Date(lastAlert).toISOString().split('T')[0] : null;

                    if (lastAlertDate !== todayStr) {
                        await createNotification('Low Balance Alert', message, 'alert', { accountId: acc.id });
                        await db.runAsync('UPDATE accounts SET last_low_balance_alert = ? WHERE id = ?', [now.toISOString(), acc.id]);
                    }
                }
            }
        }
    },
    {
        id: 'monthly-summary',
        name: 'Monthly Spending Summary',
        description: 'Provide an expense summary on the 1st of every month',
        preferenceKey: 'monthlySummary',
        check: async ({ db, userId, createNotification }) => {
            const now = new Date();
            if (now.getDate() === 1) {
                const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const previousMonthStr = previousMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
                const previousMonthKey = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;

                const userObj = await db.getFirstAsync(
                    'SELECT last_monthly_summary FROM users WHERE id = ?',
                    [userId]
                );

                if (userObj?.last_monthly_summary !== previousMonthKey) {
                    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
                    const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

                    const res = await db.getFirstAsync(
                        `SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'expense' AND date >= ? AND date <= ?`,
                        [userId, start, end]
                    );

                    await createNotification(
                        'Monthly Summary',
                        `You spent ₹${res?.total || 0} in ${previousMonthStr}.`,
                        'info',
                        { month: previousMonthStr }
                    );

                    await db.runAsync('UPDATE users SET last_monthly_summary = ? WHERE id = ?', [previousMonthKey, userId]);
                }
            }
        }
    },
    {
        id: 'loan-due-reminders',
        name: 'Loan Due Date Reminders',
        description: 'Notify 3 days before a loan payment is due',
        preferenceKey: 'loanDueReminders',
        check: async ({ db, userId, createNotification }) => {
            const loans = await db.getAllAsync(
                `SELECT * FROM loans WHERE user_id = ? AND status = 'active'`,
                [userId]
            );

            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];

            for (const loan of loans) {
                // Determine relevant due date: prefer next_due_date, fallback to due_date
                const targetDateStr = loan.next_due_date || loan.due_date;
                if (!targetDateStr) continue;

                const dueDate = new Date(targetDateStr);
                const diffTime = dueDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Notify if due within 3 days (inclusive of today/overdue slightly for reminder)
                if (diffDays <= 3 && diffDays >= 0) {
                    const lastReminder = loan.last_reminder_date ? new Date(loan.last_reminder_date).toISOString().split('T')[0] : null;

                    if (lastReminder !== todayStr) {
                        const amountStr = loan.emi_amount ? `EMI of ₹${loan.emi_amount}` : 'payment';
                        await createNotification(
                            'Loan Payment Due',
                            `Reminder: Your ${amountStr} for "${loan.name || loan.person_name}" is due on ${dueDate.toLocaleDateString()}.`,
                            'alert',
                            { loanId: loan.id, type: 'loan_due' }
                        );
                        await db.runAsync('UPDATE loans SET last_reminder_date = ? WHERE id = ?', [now.toISOString(), loan.id]);
                    }
                }
            }
        }
    },
    {
        id: 'loan-clearance',
        name: 'Loan Clearance Alerts',
        description: 'Notify when a loan is fully paid off',
        preferenceKey: 'loanPaidAlerts',
        check: async ({ db, userId, createNotification }) => {
            const clearedLoans = await db.getAllAsync(
                `SELECT * FROM loans WHERE user_id = ? AND (remaining_amount <= 0 OR status = 'closed') AND paid_notification_sent = 0`,
                [userId]
            );

            for (const loan of clearedLoans) {
                await createNotification(
                    'Loan Cleared! 🎉',
                    `Congratulations! You have fully paid off your loan "${loan.name || loan.person_name}".`,
                    'success',
                    { loanId: loan.id, type: 'loan_cleared' }
                );
                await db.runAsync('UPDATE loans SET paid_notification_sent = 1 WHERE id = ?', [loan.id]);
            }
        }
    },
    {
        id: 'savings-goal',
        name: 'Savings Goal Achieved',
        description: 'Notify when savings goal is reached',
        preferenceKey: 'savingsGoalAlerts',
        check: async ({ db, userId, createNotification }) => {
            const achievedSavings = await db.getAllAsync(
                `SELECT * FROM savings WHERE user_id = ? AND current_amount >= target_amount AND goal_reached_notification_sent = 0`,
                [userId]
            );

            for (const saving of achievedSavings) {
                await createNotification(
                    'Goal Achieved! 🏆',
                    `You've reached your savings goal for "${saving.name}" (₹${saving.current_amount}).`,
                    'success',
                    { savingsId: saving.id, type: 'savings_goal' }
                );
                await db.runAsync('UPDATE savings SET goal_reached_notification_sent = 1 WHERE id = ?', [saving.id]);
            }
        }
    }
];
