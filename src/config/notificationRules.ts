import { SupabaseClient } from "@supabase/supabase-js";
import { NotificationPreferences } from "../context/NotificationPreferencesContext";

export interface NotificationRuleContext {
  supabase: SupabaseClient;
  userId: string;
  preferences: NotificationPreferences;
  createNotification: (
    title: string,
    message: string,
    type: "alert" | "info" | "invite" | "success" | "security",
    data?: any,
  ) => Promise<void>;
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
    id: "bill-reminders",
    name: "Recurring Bill Reminders",
    description: "Notify when a recurring payment is due soon",
    preferenceKey: "billReminders",
    check: async ({ supabase, userId, createNotification }) => {
      const { data: configs } = await supabase
        .from("recurring_configs")
        .select("*")
        .eq("user_id", userId)
        .eq("type", "expense"); // Only consider expense recurring configs for bill reminders

      for (const config of configs || []) {
        const lastExecuted = new Date(
          config.last_executed || config.start_date,
        );
        const frequency = config.frequency;

        const getNextDueDate = (current: Date) => {
          const next = new Date(current);
          if (frequency === "daily") next.setDate(next.getDate() + 1);
          if (frequency === "weekly") next.setDate(next.getDate() + 7);
          if (frequency === "monthly") next.setMonth(next.getMonth() + 1);
          if (frequency === "yearly") next.setFullYear(next.getFullYear() + 1);
          return next;
        };

        const nextDueDate = getNextDueDate(lastExecuted);
        const now = new Date();
        const diffTime = nextDueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 1 && diffDays >= 0) {
          const lastNotified = config.last_notified_at
            ? new Date(config.last_notified_at)
            : null;
          const isToday =
            lastNotified && lastNotified.toDateString() === now.toDateString();

          if (!isToday) {
            await createNotification(
              "Recurring Payment Due",
              `"${config.name}" of ₹${config.amount} is due soon.`,
              "info",
              { recurringId: config.id },
            );
            await supabase
              .from("recurring_configs")
              .update({ last_notified_at: now.toISOString() })
              .eq("id", config.id);
          }
        }
      }
    },
  },
  {
    id: "budget-alerts",
    name: "Budget Utilization Alerts",
    description: "Notify when a category budget reaches 90% utilization",
    preferenceKey: "budgetAlerts",
    check: async ({ supabase, userId, createNotification }) => {
      const { data: budgets } = await supabase
        .from("budgets")
        .select(
          `
                    *,
                    category:categories (name)
                `,
        )
        .eq("user_id", userId);

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).toISOString();

      for (const budget of budgets || []) {
        if (budget.alert_month === currentMonth) continue;

        const { data: transactions } = await supabase
          .from("transactions")
          .select("amount")
          .eq("user_id", userId)
          .eq("category_id", budget.category_id)
          .eq("type", "expense")
          .gte("date", startOfMonth);

        const spent = (transactions || []).reduce(
          (sum, t) => sum + t.amount,
          0,
        );
        if (spent >= budget.amount * 0.9) {
          await createNotification(
            "Budget Alert",
            `You've used 90% of your ${(budget.category as any)?.name} budget (₹${spent}/${budget.amount}).`,
            "alert",
            { budgetId: budget.id },
          );
          await supabase
            .from("budgets")
            .update({ alert_month: currentMonth })
            .eq("id", budget.id);
        }
      }
    },
  },
  {
    id: "trip-alerts",
    name: "Trip Budget Alerts",
    description: "Notify when a trip budget reaches 90% utilization",
    preferenceKey: "tripAlerts",
    check: async ({ supabase, userId, createNotification }) => {
      const { data: trips } = await supabase
        .from("trips")
        .select(`*, group:groups(*)`)
        .eq("user_id", userId)
        .eq("alert_sent", false)
        .not("budget_amount", "is", null);

      for (const trip of trips || []) {
        const { data: transactions } = await supabase
          .from("transactions")
          .select("amount")
          .eq("trip_id", trip.id)
          .eq("type", "expense");

        const spent = (transactions || []).reduce(
          (sum, t) => sum + t.amount,
          0,
        );

        if (spent >= trip.budget_amount * 0.9) {
          // Check if group trip
          if (trip.group) {
            const { data: groupMembers } = await supabase
              .from("group_members")
              .select("user_id")
              .eq("group_id", trip.group.id);

            if (groupMembers && groupMembers.length > 0) {
              const notificationPromises = groupMembers.map(async (member) => {
                await supabase.from("notifications").insert({
                  user_id: member.user_id,
                  type: "alert",
                  title: "Trip Budget Alert",
                  message: `You've used 90% of the budget for "${trip.name}" (₹${spent}/${trip.budget_amount}).`,
                  data: { tripId: trip.id },
                  is_read: false,
                });
              });
              await Promise.all(notificationPromises);
            }
          } else {
            // Solo trip
            await createNotification(
              "Trip Budget Alert",
              `You've used 90% of your budget for "${trip.name}" (₹${spent}/${trip.budget_amount}).`,
              "alert",
              { tripId: trip.id },
            );
          }

          await supabase
            .from("trips")
            .update({ alert_sent: true })
            .eq("id", trip.id);
        }
      }
    },
  },
  {
    id: "split-reminders",
    name: "Pending Split Reminders",
    description: "Notify about pending splits older than 3 days",
    preferenceKey: "splitReminders",
    check: async ({ supabase, userId, createNotification }) => {
      const { data: pendingSplits } = await supabase
        .from("splits")
        .select(
          `
                    *,
                    transaction:transactions (description, date)
                `,
        )
        .eq("user_id", userId)
        .eq("status", "pending")
        .eq("alert_sent", false);

      const now = new Date();
      for (const split of pendingSplits || []) {
        const transDate = new Date((split.transaction as any).date);
        const diffTime = now.getTime() - transDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 3) {
          await createNotification(
            "Pending Payment",
            `You have a pending split of ₹${split.amount} for "${(split.transaction as any).description || "Expense"}"`,
            "info",
            { splitId: split.id },
          );
          await supabase
            .from("splits")
            .update({ alert_sent: true })
            .eq("id", split.id);
        }
      }
    },
  },
  {
    id: "low-balance-alerts",
    name: "Low Balance Alerts",
    description:
      "Notify when bank/cash balance is low or credit card use is high",
    preferenceKey: "lowBalanceAlerts",
    check: async ({ supabase, userId, createNotification }) => {
      const { data: accounts } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true);

      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];

      for (const acc of accounts || []) {
        let shouldAlert = false;
        let message = "";

        if (acc.type === "bank" || acc.type === "cash") {
          if (acc.balance < 1000) {
            shouldAlert = true;
            message = `Your balance in ${acc.name} is low (₹${acc.balance}).`;
          }
        } else if (acc.type === "card" && acc.card_type === "credit") {
          if (acc.credit_limit) {
            const outstanding = acc.credit_limit - acc.balance;
            if (acc.balance < acc.credit_limit * 0.1) {
              shouldAlert = true;
              message = `High outstanding dues on ${acc.name}. You've used ${((outstanding / acc.credit_limit) * 100).toFixed(0)}% of your limit.`;
            }
          }
        }

        if (shouldAlert) {
          const lastAlert = acc.last_low_balance_alert;
          const lastAlertDate = lastAlert
            ? new Date(lastAlert).toISOString().split("T")[0]
            : null;

          if (lastAlertDate !== todayStr) {
            await createNotification("Low Balance Alert", message, "alert", {
              accountId: acc.id,
            });
            await supabase
              .from("accounts")
              .update({ last_low_balance_alert: now.toISOString() })
              .eq("id", acc.id);
          }
        }
      }
    },
  },
  {
    id: "monthly-summary",
    name: "Monthly Spending Summary",
    description: "Provide an expense summary on the 1st of every month",
    preferenceKey: "monthlySummary",
    check: async ({ supabase, userId, createNotification }) => {
      const now = new Date();
      if (now.getDate() === 1) {
        const previousMonthDate = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1,
        );
        const previousMonthStr = previousMonthDate.toLocaleString("default", {
          month: "long",
          year: "numeric",
        });
        const previousMonthKey = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}`;

        const { data: profile } = await supabase
          .from("profiles")
          .select("last_monthly_summary")
          .eq("id", userId)
          .single();

        if ((profile as any)?.last_monthly_summary !== previousMonthKey) {
          const start = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1,
          ).toISOString();
          const end = new Date(
            now.getFullYear(),
            now.getMonth(),
            0,
          ).toISOString();

          const { data: transactions } = await supabase
            .from("transactions")
            .select("amount")
            .eq("user_id", userId)
            .eq("type", "expense")
            .gte("date", start)
            .lte("date", end);

          const total = (transactions || []).reduce(
            (sum, t) => sum + t.amount,
            0,
          );

          await createNotification(
            "Monthly Summary",
            `You spent ₹${total} in ${previousMonthStr}.`,
            "info",
            { month: previousMonthStr },
          );

          await supabase
            .from("profiles")
            .update({ last_monthly_summary: previousMonthKey })
            .eq("id", userId);
        }
      }
    },
  },
  {
    id: "loan-due-reminders",
    name: "Loan Due Date Reminders",
    description: "Notify 3 days before a loan payment is due",
    preferenceKey: "loanDueReminders",
    check: async ({ supabase, userId, createNotification }) => {
      const { data: loans } = await supabase
        .from("loans")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active");

      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];

      for (const loan of loans || []) {
        const targetDateStr = loan.next_due_date || loan.due_date;
        if (!targetDateStr) continue;

        const dueDate = new Date(targetDateStr);
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 3 && diffDays >= 0) {
          const lastReminder = loan.last_reminder_date
            ? new Date(loan.last_reminder_date).toISOString().split("T")[0]
            : null;

          if (lastReminder !== todayStr) {
            const amountStr = loan.emi_amount
              ? `EMI of ₹${loan.emi_amount}`
              : "payment";
            await createNotification(
              "Loan Payment Due",
              `Reminder: Your ${amountStr} for "${loan.name || loan.person_name}" is due on ${dueDate.toLocaleDateString()}.`,
              "alert",
              { loanId: loan.id, type: "loan_due" },
            );
            await supabase
              .from("loans")
              .update({ last_reminder_date: now.toISOString() })
              .eq("id", loan.id);
          }
        }
      }
    },
  },
  {
    id: "loan-clearance",
    name: "Loan Clearance Alerts",
    description: "Notify when a loan is fully paid off",
    preferenceKey: "loanPaidAlerts",
    check: async ({ supabase, userId, createNotification }) => {
      const { data: clearedLoans } = await supabase
        .from("loans")
        .select("*")
        .eq("user_id", userId)
        .or("remaining_amount.lte.0,status.eq.closed")
        .eq("paid_notification_sent", false);

      for (const loan of clearedLoans || []) {
        await createNotification(
          "Loan Cleared! 🎉",
          `Congratulations! You have fully paid off your loan "${loan.name || loan.person_name}".`,
          "success",
          { loanId: loan.id, type: "loan_cleared" },
        );
        await supabase
          .from("loans")
          .update({ paid_notification_sent: true })
          .eq("id", loan.id);
      }
    },
  },
  {
    id: "savings-goal",
    name: "Savings Goal Achieved",
    description: "Notify when savings goal is reached",
    preferenceKey: "savingsGoalAlerts",
    check: async ({ supabase, userId, createNotification }) => {
      const { data: achievedSavings } = await supabase
        .from("savings")
        .select("*")
        .eq("user_id", userId)

        .eq("goal_reached_notification_sent", false);

      for (const saving of achievedSavings || []) {
        if (saving.current_amount >= saving.target_amount) {
          await createNotification(
            "Goal Achieved! 🏆",
            `You've reached your savings goal for "${saving.name}" (₹${saving.current_amount}).`,
            "success",
            { savingsId: saving.id, type: "savings_goal" },
          );
          await supabase
            .from("savings")
            .update({ goal_reached_notification_sent: true })
            .eq("id", saving.id);
        }
      }
    },
  },
  {
    id: "upcoming-bill-reminders",
    name: "Upcoming Bill Reminders",
    description: "Notify when bills are due today or tomorrow",
    preferenceKey: "upcomingBillReminders",
    check: async ({ supabase, userId, createNotification }) => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayStr = today.toISOString().split("T")[0];
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      const { data: bills } = await supabase
        .from("upcoming_bills")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .or(`due_date.eq.${todayStr},due_date.eq.${tomorrowStr}`)
        .or("last_reminder_sent.is.null,last_reminder_sent.lt." + todayStr);

      for (const bill of bills || []) {
        const dueDate = new Date(bill.due_date);
        const isToday = dueDate.toDateString() === today.toDateString();
        const isTomorrow = dueDate.toDateString() === tomorrow.toDateString();

        if (isToday || isTomorrow) {
          await createNotification(
            isToday ? "Bill Due Today!" : "Bill Due Tomorrow",
            `${bill.name} - ₹${bill.amount} is due ${isToday ? "today" : "tomorrow"}`,
            "alert",
            { billId: bill.id, dueDate: bill.due_date },
          );

          await supabase
            .from("upcoming_bills")
            .update({ last_reminder_sent: today.toISOString() })
            .eq("id", bill.id);
        }
      }
    },
  },
];
