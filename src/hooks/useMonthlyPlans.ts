import { useCallback, useState } from "react";
import { supabase } from "../lib/supabase";

export interface MonthlyPlan {
  id: string;
  user_id: string;
  month: string;
  notes?: string;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export type CoverMethod = "credit_card" | "loan" | "savings" | "overdraft" | "borrowed" | "other";

export interface PlanItem {
  id: string;
  plan_id: string;
  source_type: "bill" | "recurring" | "loan" | "savings" | "manual" | "deficit_cover";
  source_id?: string;
  cover_method?: CoverMethod;
  reference_id?: string;
  label: string;
  type: "income" | "expense";
  amount: number;
  category_id?: string;
  due_date?: string;
  status: "pending" | "settled" | "paid";
  sort_order: number;
  created_at: string;
}

export interface ForecastMonth {
  month: string;
  income: number;
  bills: number;
  emis: number;
  estimatedSpend: number;
  savings: number;
  surplus: number;
  items: { label: string; amount: number; type: "income" | "expense" }[];
}

export interface PlanVsActual {
  month: string;
  plannedIncome: number;
  actualIncome: number;
  plannedExpenses: number;
  actualExpenses: number;
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    categoryIcon?: string;
    categoryColor?: string;
    planned: number;
    actual: number;
    variance: number;
  }[];
  estimationAccuracy: number;
}

export const useMonthlyPlans = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getOrCreatePlan = useCallback(
    async (userId: string, month: string): Promise<MonthlyPlan | null> => {
      setLoading(true);
      setError(null);
      try {
        const { data: existing, error: fetchError } = await supabase
          .from("monthly_plans")
          .select("*")
          .eq("user_id", userId)
          .eq("month", month)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (existing) return existing as MonthlyPlan;

        const { data: newPlan, error: insertError } = await supabase
          .from("monthly_plans")
          .insert({ user_id: userId, month })
          .select()
          .single();

        if (insertError) throw insertError;
        if (!newPlan) throw new Error("Failed to create plan");

        await autoGenerateItems(userId, newPlan.id, month);

        return newPlan as MonthlyPlan;
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getPlanById = useCallback(
    async (planId: string): Promise<MonthlyPlan | null> => {
      try {
        const { data, error } = await supabase
          .from("monthly_plans")
          .select("*")
          .eq("id", planId)
          .single();
        if (error) throw error;
        return data as MonthlyPlan;
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [],
  );

  const getPlansByUser = useCallback(
    async (userId: string): Promise<MonthlyPlan[]> => {
      try {
        const { data, error } = await supabase
          .from("monthly_plans")
          .select("*")
          .eq("user_id", userId)
          .order("month", { ascending: false });
        if (error) throw error;
        return (data || []) as MonthlyPlan[];
      } catch (err: any) {
        setError(err.message);
        return [];
      }
    },
    [],
  );

  const updatePlanNotes = useCallback(
    async (planId: string, notes: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("monthly_plans")
          .update({ notes, updated_at: new Date().toISOString() })
          .eq("id", planId);
        if (error) throw error;
        return true;
      } catch (err: any) {
        setError(err.message);
        return false;
      }
    },
    [],
  );

  const getPlanItems = useCallback(
    async (planId: string): Promise<PlanItem[]> => {
      try {
        const { data, error } = await supabase
          .from("plan_items")
          .select("*")
          .eq("plan_id", planId)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true });
        if (error) throw error;
        return (data || []) as PlanItem[];
      } catch (err: any) {
        setError(err.message);
        return [];
      }
    },
    [],
  );

  const addManualItem = useCallback(
    async (
      planId: string,
      item: {
        label: string;
        type: "income" | "expense";
        amount: number;
        category_id?: string;
        due_date?: string;
      },
    ): Promise<PlanItem | null> => {
      try {
        const { data, error } = await supabase
          .from("plan_items")
          .insert({
            plan_id: planId,
            source_type: "manual",
            label: item.label,
            type: item.type,
            amount: item.amount,
            category_id: item.category_id || null,
            due_date: item.due_date || null,
            status: "pending",
          })
          .select()
          .single();
        if (error) throw error;
        return data as PlanItem;
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [],
  );

  const addDeficitCover = useCallback(
    async (
      planId: string,
      item: {
        method: CoverMethod;
        amount: number;
        label: string;
        reference_id?: string;
      },
    ): Promise<PlanItem | null> => {
      try {
        const { data, error } = await supabase
          .from("plan_items")
          .insert({
            plan_id: planId,
            source_type: "deficit_cover",
            cover_method: item.method,
            reference_id: item.reference_id || null,
            label: item.label,
            type: "income",
            amount: item.amount,
            status: "pending",
          })
          .select()
          .single();
        if (error) throw error;
        return data as PlanItem;
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [],
  );

  const removeDeficitCover = useCallback(
    async (itemId: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("plan_items")
          .delete()
          .eq("id", itemId);
        if (error) throw error;
        return true;
      } catch (err: any) {
        setError(err.message);
        return false;
      }
    },
    [],
  );

  const updateItem = useCallback(
    async (
      itemId: string,
      updates: { amount?: number; label?: string; due_date?: string | null; status?: "pending" | "settled" | "paid"; source_type?: string },
    ): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("plan_items")
          .update(updates)
          .eq("id", itemId);
        if (error) throw error;
        return true;
      } catch (err: any) {
        setError(err.message);
        return false;
      }
    },
    [],
  );

  const deleteItem = useCallback(
    async (itemId: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("plan_items")
          .delete()
          .eq("id", itemId);
        if (error) throw error;
        return true;
      } catch (err: any) {
        setError(err.message);
        return false;
      }
    },
    [],
  );

  const settleItem = useCallback(
    async (itemId: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("plan_items")
          .update({ status: "paid" })
          .eq("id", itemId);
        if (error) throw error;
        return true;
      } catch (err: any) {
        setError(err.message);
        return false;
      }
    },
    [],
  );

  const autoGenerateItems = async (
    userId: string,
    planId: string,
    month: string,
  ) => {
    try {
      const [yearStr, monthStr] = month.split("-");
      const year = parseInt(yearStr);
      const monthNum = parseInt(monthStr);
      const startOfMonth = new Date(year, monthNum - 1, 1);
      const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59, 999);

      const startIso = startOfMonth.toISOString();
      const endIso = endOfMonth.toISOString();

      const itemsToInsert: any[] = [];
      let sortOrder = 0;

      // 1. Recurring Configs (Income & Expenses)
      const { data: recurringConfigs } = await supabase
        .from("recurring_configs")
        .select("*")
        .eq("user_id", userId);

      if (recurringConfigs) {
        for (const config of recurringConfigs) {
          const configStart = new Date(config.start_date);
          const configEnd = config.end_date ? new Date(config.end_date) : null;

          if (configStart > endOfMonth) continue;
          if (configEnd && configEnd < startOfMonth) continue;

          if (config.frequency === "monthly") {
            itemsToInsert.push({
              plan_id: planId,
              source_type: "recurring",
              source_id: config.id,
              label: config.name,
              type: config.type || "expense",
              amount: config.amount,
              category_id: config.category_id || null,
              due_date: null,
              status: "pending",
              sort_order: sortOrder++,
            });
          }
        }
      }

      // 2. Upcoming Bills due this month
      const { data: bills } = await supabase
        .from("upcoming_bills")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (bills) {
        for (const bill of bills) {
          const dueDate = new Date(bill.due_date);
          if (dueDate >= startOfMonth && dueDate <= endOfMonth) {
            itemsToInsert.push({
              plan_id: planId,
              source_type: "bill",
              source_id: bill.id,
              label: bill.name,
              type: "expense",
              amount: bill.amount,
              category_id: bill.sub_category_id || bill.category_id || null,
              due_date: bill.due_date,
              status: "pending",
              sort_order: sortOrder++,
            });
          } else {
            const freq = bill.frequency;
            if (freq === "monthly" || freq === "quarterly" || freq === "yearly") {
              let tempDate = new Date(bill.due_date);
              const interval = freq === "monthly" ? 1 : freq === "quarterly" ? 3 : 12;
              for (let i = 0; i < 24; i++) {
                if (tempDate >= startOfMonth && tempDate <= endOfMonth) {
                  itemsToInsert.push({
                    plan_id: planId,
                    source_type: "bill",
                    source_id: bill.id,
                    label: bill.name,
                    type: "expense",
                    amount: bill.amount,
                    category_id: bill.sub_category_id || bill.category_id || null,
                    due_date: tempDate.toISOString(),
                    status: "pending",
                    sort_order: sortOrder++,
                  });
                  break;
                }
                if (tempDate > endOfMonth) break;
                tempDate.setMonth(tempDate.getMonth() + interval);
              }
            }
          }
        }
      }

      // 3. Loan Repayment Schedules due this month
      const { data: loans } = await supabase
        .from("loans")
        .select("id, person_name, type, emi_amount")
        .eq("user_id", userId)
        .eq("status", "active");

      if (loans && loans.length > 0) {
        const loanIds = loans.map((l) => l.id);
        const { data: schedules } = await supabase
          .from("repayment_schedules")
          .select("*, loan:loans!repayment_schedules_loan_id_fkey(person_name, type, emi_amount)")
          .in("loan_id", loanIds)
          .eq("status", "pending")
          .gte("due_date", startIso)
          .lte("due_date", endIso);

        if (schedules) {
          for (const schedule of schedules) {
            const loanData = schedule.loan as any;
            const isLent = loanData?.type === "lent";
            itemsToInsert.push({
              plan_id: planId,
              source_type: "loan",
              source_id: schedule.loan_id,
              label: `${isLent ? "Lent: " : "EMI: "}${loanData?.person_name || "Loan"}`,
              type: isLent ? "income" : "expense",
              amount: schedule.amount,
              category_id: null,
              due_date: schedule.due_date,
              status: "pending",
              sort_order: sortOrder++,
            });
          }
        }
      }

      // 4. Savings Goals (suggested monthly contributions)
      const { data: savings } = await supabase
        .from("savings")
        .select("id, name, target_amount, current_amount")
        .eq("user_id", userId);

      if (savings) {
        for (const saving of savings) {
          const remaining = saving.target_amount - saving.current_amount;
          if (remaining <= 0) continue;
          const suggestedAmount = Math.min(
            remaining,
            Math.max(remaining / 12, 500),
          );
          itemsToInsert.push({
            plan_id: planId,
            source_type: "savings",
            source_id: saving.id,
            label: `Save: ${saving.name}`,
            type: "expense",
            amount: Math.round(suggestedAmount),
            category_id: null,
            due_date: null,
            status: "pending",
            sort_order: sortOrder++,
          });
        }
      }

      // Batch insert all auto-generated items
      if (itemsToInsert.length > 0) {
        await supabase.from("plan_items").insert(itemsToInsert);
      }
    } catch (err) {
      console.error("Auto-generate items error:", err);
    }
  };

  const getForecast = useCallback(
    async (userId: string, months: number = 6): Promise<ForecastMonth[]> => {
      try {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        const forecast: ForecastMonth[] = [];

        // Load data once
        const { data: recurringConfigs } = await supabase
          .from("recurring_configs")
          .select("*")
          .eq("user_id", userId);

        const { data: activeBills } = await supabase
          .from("upcoming_bills")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true);

        const { data: activeLoans } = await supabase
          .from("loans")
          .select("id, person_name, type, emi_amount, total_amount, remaining_amount")
          .eq("user_id", userId)
          .eq("status", "active");

        let allSchedules: any[] = [];
        if (activeLoans && activeLoans.length > 0) {
          const loanIds = activeLoans.map((l) => l.id);
          const { data: schedules } = await supabase
            .from("repayment_schedules")
            .select("*")
            .in("loan_id", loanIds);
          allSchedules = schedules || [];
        }

        // Get current plan's manual items to carry forward
        const { data: currentPlan } = await supabase
          .from("monthly_plans")
          .select("id")
          .eq("user_id", userId)
          .eq("month", currentMonth)
          .maybeSingle();

        let currentManualItems: any[] = [];
        if (currentPlan) {
          const { data: items } = await supabase
            .from("plan_items")
            .select("*")
            .eq("plan_id", currentPlan.id)
            .eq("source_type", "manual");
          currentManualItems = items || [];
        }

        for (let i = 0; i < months; i++) {
          const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
          const ym = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, "0")}`;
          const startOfFMonth = new Date(forecastDate);
          const endOfFMonth = new Date(forecastDate.getFullYear(), forecastDate.getMonth() + 1, 0, 23, 59, 59, 999);

          let income = 0;
          let bills = 0;
          let emis = 0;
          const items: { label: string; amount: number; type: "income" | "expense" }[] = [];

          // Recurring configs
          if (recurringConfigs) {
            for (const config of recurringConfigs) {
              const configStart = new Date(config.start_date);
              if (configStart > endOfFMonth) continue;
              if (config.end_date && new Date(config.end_date) < startOfFMonth) continue;

              if (config.frequency === "monthly") {
                items.push({ label: config.name, amount: config.amount, type: config.type || "expense" });
                if (config.type === "income") income += config.amount;
                else bills += config.amount;
              }
            }
          }

          // Upcoming bills
          if (activeBills) {
            for (const bill of activeBills) {
              const billDue = new Date(bill.due_date);
              if (billDue >= startOfFMonth && billDue <= endOfFMonth) {
                items.push({ label: bill.name, amount: bill.amount, type: "expense" });
                bills += bill.amount;
              } else if (bill.frequency !== "once") {
                const interval = bill.frequency === "monthly" ? 1 : bill.frequency === "quarterly" ? 3 : 12;
                let tempDate = new Date(bill.due_date);
                for (let j = 0; j < 36; j++) {
                  if (tempDate >= startOfFMonth && tempDate <= endOfFMonth) {
                    items.push({ label: bill.name, amount: bill.amount, type: "expense" });
                    bills += bill.amount;
                    break;
                  }
                  if (tempDate > endOfFMonth) break;
                  tempDate.setMonth(tempDate.getMonth() + interval);
                }
              }
            }
          }

          // Loan repayment schedules
          for (const schedule of allSchedules) {
            const schedDate = new Date(schedule.due_date);
            if (schedule.status === "paid") continue;
            if (schedDate >= startOfFMonth && schedDate <= endOfFMonth) {
              items.push({ label: `EMI: ${schedule.loan_id}`, amount: schedule.amount, type: "expense" });
              emis += schedule.amount;
            }
          }

          // Carry forward manual items from current plan
          for (const manual of currentManualItems) {
            items.push({ label: manual.label, amount: manual.amount, type: manual.type });
            if (manual.type === "income") income += manual.amount;
            else bills += manual.amount;
          }

          // Savings suggestion (simple)
          const estimatedSpend = 0;
          const savings = 0;

          forecast.push({
            month: ym,
            income,
            bills,
            emis,
            estimatedSpend,
            savings,
            surplus: income - (bills + emis + estimatedSpend + savings),
            items,
          });
        }

        return forecast;
      } catch (err: any) {
        console.error("Forecast error:", err);
        return [];
      }
    },
    [],
  );

  const getPlanVsActual = useCallback(
    async (userId: string, month: string): Promise<PlanVsActual | null> => {
      try {
        const { data: plan } = await supabase
          .from("monthly_plans")
          .select("*")
          .eq("user_id", userId)
          .eq("month", month)
          .maybeSingle();

        if (!plan) return null;

        const { data: items } = await supabase
          .from("plan_items")
          .select("*")
          .eq("plan_id", plan.id);

        const plannedIncome = (items || [])
          .filter((i) => i.type === "income")
          .reduce((sum, i) => sum + i.amount, 0);

        const plannedExpenses = (items || [])
          .filter((i) => i.type === "expense")
          .reduce((sum, i) => sum + i.amount, 0);

        const [yearStr, monthStr] = month.split("-");
        const startOfMonth = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1).toISOString();
        const endOfMonth = new Date(parseInt(yearStr), parseInt(monthStr), 0, 23, 59, 59, 999).toISOString();

        const { data: actualTransactions } = await supabase
          .from("transactions")
          .select(`
            *,
            categories!transactions_category_id_fkey(name, icon, color)
          `)
          .eq("user_id", userId)
          .gte("date", startOfMonth)
          .lte("date", endOfMonth);

        let actualIncome = 0;
        let actualExpenses = 0;
        const categoryMap: Record<string, { name: string; icon?: string; color?: string; planned: number; actual: number }> = {};

        for (const item of items || []) {
          if (item.category_id && !categoryMap[item.category_id]) {
            const { data: cat } = await supabase
              .from("categories")
              .select("name, icon, color")
              .eq("id", item.category_id)
              .single();
            categoryMap[item.category_id] = {
              name: cat?.name || "Unknown",
              icon: cat?.icon,
              color: cat?.color,
              planned: 0,
              actual: 0,
            };
          }
          if (item.category_id && categoryMap[item.category_id]) {
            categoryMap[item.category_id].planned += item.amount;
          }
        }

        for (const txn of actualTransactions || []) {
          const t = txn as any;
          if (t.type === "income") actualIncome += t.amount;
          else if (t.type === "expense") actualExpenses += t.amount;

          if (t.category_id && categoryMap[t.category_id]) {
            categoryMap[t.category_id].actual += t.amount;
          }
          if (t.category_id && !categoryMap[t.category_id]) {
            categoryMap[t.category_id] = {
              name: t.categories?.name || "Unknown",
              icon: t.categories?.icon,
              color: t.categories?.color,
              planned: 0,
              actual: t.amount,
            };
          }
        }

        const categoryBreakdown = Object.entries(categoryMap).map(
          ([categoryId, data]) => ({
            categoryId,
            categoryName: data.name,
            categoryIcon: data.icon,
            categoryColor: data.color,
            planned: data.planned,
            actual: data.actual,
            variance: data.actual - data.planned,
          }),
        );

        categoryBreakdown.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

        const expectedTotal = plannedIncome + plannedExpenses;
        const actualTotal = actualIncome + actualExpenses;
        const estimationAccuracy =
          expectedTotal > 0
            ? Math.max(
                0,
                100 -
                  Math.abs(actualTotal - expectedTotal) / expectedTotal * 100,
              )
            : 0;

        return {
          month,
          plannedIncome,
          actualIncome,
          plannedExpenses,
          actualExpenses,
          categoryBreakdown,
          estimationAccuracy: Math.round(estimationAccuracy * 10) / 10,
        };
      } catch (err: any) {
        console.error("Plan vs actual error:", err);
        return null;
      }
    },
    [],
  );

  const getPlanVsActualBatch = useCallback(
    async (userId: string, months: string[]): Promise<PlanVsActual[]> => {
      const results: PlanVsActual[] = [];
      for (const month of months) {
        const pva = await getPlanVsActual(userId, month);
        if (pva) results.push(pva);
      }
      results.sort((a, b) => a.month.localeCompare(b.month));
      return results;
    },
    [getPlanVsActual],
  );

  return {
    loading,
    error,
    getOrCreatePlan,
    getPlanById,
    getPlansByUser,
    updatePlanNotes,
    getPlanItems,
    addManualItem,
    addDeficitCover,
    removeDeficitCover,
    updateItem,
    deleteItem,
    settleItem,
    getForecast,
    getPlanVsActual,
    getPlanVsActualBatch,
  };
};
