import {
  eachDayOfInterval,
  format,
  isSameDay,
  startOfMonth,
  subDays,
} from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { isNeed } from "../utils/categoryClassification";

export interface CategorySpending {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  total: number;
  percentage: number;
}

export interface CashFlowData {
  date: string;
  fullDate: string;
  income: number;
  expense: number;
}

export interface BudgetPerformance {
  category_id: string;
  category_name: string;
  budget_amount: number;
  spent_amount: number;
  remaining: number;
  percentage: number;
}

export interface NetWorthData {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  trend: "up" | "down" | "stable";
  changePercentage: number;
  history: { date: string; value: number; label: string }[];
}

export interface NeedsWantsSavingsData {
  needs: number;
  wants: number;
  savings: number;
  total: number;
  needsTransactions: any[];
  wantsTransactions: any[];
  savingsTransactions: any[];
}

export interface MerchantSpending {
  merchant_name: string;
  total: number;
  count: number;
  percentage: number;
}

export interface SpendingVelocity {
  currentSpend: number;
  averageSpend: number;
  status: "ahead" | "on_track" | "behind";
  projectedOverspend: number;
  dailyVelocity: { date: string; cumulative: number }[];
}

export interface UpcomingBill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  category: { name: string; icon: string; color: string };
  frequency: string;
}

export interface DebtHealth {
  totalDebt: number;
  paidAmount: number;
  progress: number;
  interestPaid: number;
  nextPaymentDate: string | null;
}

export const useAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNetWorth = useCallback(async (userId: string, options?: DateRangeOptions) => {
    setLoading(true);
    try {
      // 1. Current Assets (Bank, Cash) and Liabilities (Credit Card Debt)
      const { data: accounts, error: accError } = await supabase
        .from("accounts")
        .select("balance, type, card_type, credit_limit")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (accError) throw accError;

      let currentTotalAssets = 0;
      let currentTotalLiabilities = 0;

      (accounts || []).forEach((acc) => {
        if (acc.type === "card" && acc.card_type === "credit") {
          const debt = (acc.credit_limit || 0) - acc.balance;
          currentTotalLiabilities += Math.max(0, debt);
        } else {
          currentTotalAssets += acc.balance;
        }
      });

      // 2. Loans (Lent = Asset, Borrowed = Liability)
      const { data: loans, error: loanError } = await supabase
        .from("loans")
        .select("remaining_amount, type")
        .eq("user_id", userId)
        .eq("status", "active");

      if (loanError) throw loanError;

      (loans || []).forEach((loan) => {
        if (loan.type === "lent") {
          currentTotalAssets += loan.remaining_amount;
        } else {
          currentTotalLiabilities += loan.remaining_amount;
        }
      });

      // 3. Savings: include only those marked for net worth
      const { data: savings, error: savingsError } = await supabase
        .from("savings")
        .select("current_amount, include_in_net_worth")
        .eq("user_id", userId);

      if (savingsError) throw savingsError;

      (savings || []).forEach((s) => {
        if (s.include_in_net_worth) {
          currentTotalAssets += s.current_amount;
        }
      });

      const currentRealTimeNetWorth = currentTotalAssets - currentTotalLiabilities;

      // 4. Time Travel Logic
      // We have the *current* Net Worth.
      // We need to calculate the Net Worth at the end of the selected period (if distinct from now)
      // and the history points back to the start.

      const { start, end, days } = getRangeBounds(options);

      // Calculate "End" Net Worth (at options.end)
      // If end date is effectively "now" (today/future), we use currentRealTimeNetWorth.
      // If end date is in the past, we need to reverse transactions from "now" back to "end".

      let endNetWorth = currentRealTimeNetWorth;
      const now = new Date();

      if (end < now && !isSameDay(end, now)) {
        // Fetch transactions between end (exclusive) and now (inclusive) to reverse them.
        // Logic: 
        // Previous Balance = Current Balance - Income + Expense
        // So if we are at Current, and want to go back:
        // Past Balance = Current - (Income since then) + (Expense since then)

        const { data: reductionTxns } = await supabase
          .from("transactions")
          .select("amount, type, name, category:categories!transactions_category_id_fkey(name, parent:parent_id(name))")
          .eq("user_id", userId)
          .gt("date", end.toISOString())
          .lte("date", now.toISOString()); // up to now

        const reductionChange = (reductionTxns || []).reduce((sum, t: any) => {
          // Filter reconciliation logic...
          const cat = t.category as any;
          const catName = cat?.name?.toLowerCase() || "";
          const parentName = cat?.parent?.name?.toLowerCase() || "";
          const txName = t.name?.toLowerCase() || "";

          const isReconciliation =
            txName.includes("balance correction") ||
            txName.includes("opening balance") ||
            catName.includes("adjustment") ||
            catName.includes("reconciliation") ||
            catName.includes("opening balance") ||
            parentName.includes("adjustment") ||
            parentName.includes("reconciliation") ||
            parentName.includes("opening balance");

          if (isReconciliation) return sum;

          // Net Worth Change = Income - Expense
          // We want to REVERSE this. 
          // So we subtract Income and add Expense.
          if (t.type === "income") return sum - t.amount;
          if (t.type === "expense") return sum + t.amount;
          return sum;
        }, 0);

        endNetWorth += reductionChange;
      }

      // 5. Generate History Points
      const historyPoints = [];
      let simulatedNetWorth = endNetWorth;

      // Granularity Logic per user request:
      // - <= 7 Days: Daily (default)
      // - > 7 and <= 30 Days: Weekly
      // - > 30 Days: Monthly

      const totalDays = days || 30;

      let intervalType: 'daily' | 'weekly' | 'monthly' = 'daily';
      if (totalDays > 30) {
        intervalType = 'monthly';
      } else if (totalDays > 7) {
        intervalType = 'weekly';
      } else {
        intervalType = 'daily';
      }

      // Add the final point (End Date)
      historyPoints.push({
        date: end.toISOString(),
        value: simulatedNetWorth,
        label: format(end, intervalType === 'monthly' ? "MMM" : "d MMM")
      });

      // Optimization: Fetch ALL transactions in the range once, then partition in memory.
      const { data: rangeTransactions } = await supabase
        .from("transactions")
        .select("amount, type, date, name, category:categories!transactions_category_id_fkey(name, parent:parent_id(name))")
        .eq("user_id", userId)
        .gte("date", start.toISOString())
        .lte("date", end.toISOString());

      // Sort by date descending (Newest first)
      const sortedTxns = (rangeTransactions || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      let curr = new Date(end);

      // We iterate backwards from End
      // We need to move the cursor to the previous point

      let txnIndex = 0;

      // Safety limit
      const MAX_ITERATIONS = 100;
      let iterations = 0;

      while (curr > start && iterations < MAX_ITERATIONS) {
        iterations++;

        const prevDate = new Date(curr);

        // Determine previous date based on interval
        if (intervalType === 'monthly') {
          prevDate.setMonth(curr.getMonth() - 1);
        } else if (intervalType === 'weekly') {
          prevDate.setDate(curr.getDate() - 7);
        } else {
          // Daily: if we are at End (Time X), next point is End of Yesterday?
          // Or just standard 24h steps.
          prevDate.setDate(curr.getDate() - 1);

          // For daily, align to end of day? 
          if (intervalType === 'daily') {
            prevDate.setHours(23, 59, 59, 999);
          }
        }

        // If we overshoot start significantly, just clamp to start?
        // Actually, we want points at regular intervals.

        const effectiveDate = prevDate < start ? start : prevDate;

        if (curr <= effectiveDate) break;

        // Process transactions that happened AFTER effectiveDate (exclusive) up to curr (inclusive)
        // Since we are iterating backwards, these are the transactions we are "undoing".
        // SortedTxns is descending (Newest first).

        // Logic:
        // We are walking back from `curr` to `effectiveDate`.
        // Any transaction T where `effectiveDate < T.date <= curr` contributes to the change.
        // Since we are moving to the PAST, we REVERSE the transaction effect.

        while (txnIndex < sortedTxns.length) {
          const t = sortedTxns[txnIndex];
          const tDate = new Date(t.date);

          if (tDate > effectiveDate) {
            // This transaction is in the gap we are traversing.
            // Revert it.

            // Filter reconciliation
            const cat = t.category as any;
            const catName = cat?.name?.toLowerCase() || "";
            const parentName = cat?.parent?.name?.toLowerCase() || "";
            const txName = t.name?.toLowerCase() || "";
            const isReconciliation =
              txName.includes("balance correction") ||
              txName.includes("opening balance") ||
              catName.includes("adjustment") ||
              catName.includes("reconciliation") ||
              catName.includes("opening balance") ||
              parentName.includes("adjustment") ||
              parentName.includes("reconciliation") ||
              parentName.includes("opening balance");

            if (!isReconciliation) {
              if (t.type === "income") simulatedNetWorth -= t.amount;
              if (t.type === "expense") simulatedNetWorth += t.amount;
            }

            txnIndex++;
          } else {
            // Transaction is older than (or equal to) effectiveDate.
            // It belongs to the next interval (further in past).
            break;
          }
        }

        historyPoints.push({
          date: effectiveDate.toISOString(),
          value: simulatedNetWorth,
          label: format(effectiveDate, intervalType === 'monthly' ? "MMM" : "d MMM")
        });

        curr = effectiveDate;

        if (curr <= start) break;
      }

      const finalHistory = historyPoints.reverse(); // Standardize chronological order

      // 6. Change Percentage (Start vs End of the range)
      const startValue = finalHistory.length > 0 ? finalHistory[0].value : endNetWorth;
      const endValue = endNetWorth;

      const netChange = endValue - startValue;
      let changePercentage = 0;
      if (startValue !== 0) {
        changePercentage = (netChange / Math.abs(startValue)) * 100;
      } else if (netChange > 0) {
        changePercentage = 100;
      } else if (netChange < 0) {
        changePercentage = -100;
      }

      return {
        totalAssets: currentTotalAssets,
        totalLiabilities: currentTotalLiabilities,
        netWorth: endNetWorth,
        trend: netChange > 0 ? "up" : netChange < 0 ? "down" : "stable",
        changePercentage: Math.abs(changePercentage),
        history: finalHistory,
      } as NetWorthData;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  type DateRangeOptions = {
    days?: number;
    startDate?: Date;
    endDate?: Date;
    type?: "days" | "thisMonth" | "custom";
  };

  const getRangeBounds = (options?: DateRangeOptions) => {
    const { days = 30, startDate, endDate, type = "days" } = options || {};
    let start: Date;
    let end: Date;

    if (type === "thisMonth") {
      start = startOfMonth(new Date());
      end = new Date();
    } else if (type === "custom" && startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default to 'days' type
      end = endDate ? new Date(endDate) : new Date();
      start = startDate
        ? new Date(startDate)
        : subDays(new Date(end.getTime()), days);
    }

    const normalizeStart = new Date(start);
    normalizeStart.setHours(0, 0, 0, 0);

    const normalizeEnd = new Date(end);
    normalizeEnd.setHours(23, 59, 59, 999);

    return {
      start,
      end,
      startISO: normalizeStart.toISOString(),
      endISO: normalizeEnd.toISOString(),
      days: type === "days" ? days : undefined,
    };
  };

  const getSpendingByCategory = useCallback(
    async (userId: string, options?: DateRangeOptions) => {
      setLoading(true);
      try {
        const { startISO, endISO } = getRangeBounds(options);

        const { data, error } = await supabase
          .from("transactions")
          .select(
            `
                    amount,
                    category:categories (id, name, icon, color)
                `,
          )
          .eq("user_id", userId)
          .eq("type", "expense")
          .gte("date", startISO)
          .lte("date", endISO);

        if (error) throw error;

        const categoryMap = new Map<string, any>();
        let grandTotal = 0;

        (data || []).forEach((t: any) => {
          const cat = t.category;
          if (!cat) return;
          const existing = categoryMap.get(cat.id) || {
            category_id: cat.id,
            category_name: cat.name,
            category_icon: cat.icon,
            category_color: cat.color,
            total: 0,
          };
          existing.total += t.amount;
          grandTotal += t.amount;
          categoryMap.set(cat.id, existing);
        });

        return Array.from(categoryMap.values())
          .map((item) => ({
            ...item,
            percentage: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0,
          }))
          .sort((a, b) => b.total - a.total);
      } catch (err: any) {
        setError(err.message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getCashFlow = useCallback(async (userId: string, options?: DateRangeOptions) => {
    setLoading(true);
    try {
      const { start, end, startISO, endISO, days } = getRangeBounds(options);

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("amount, type, date, name, category:categories!transactions_category_id_fkey(name, parent:parent_id(name))")
        .eq("user_id", userId)
        .gte("date", startISO)
        .lte("date", endISO);

      if (error) throw error;

      // Granularity Logic
      const totalDays = days || 30;
      let intervalType: 'daily' | 'weekly' | 'monthly' = 'daily';
      if (totalDays > 30) {
        intervalType = 'monthly';
      } else if (totalDays > 7) {
        intervalType = 'weekly';
      } else {
        intervalType = 'daily';
      }

      // Generate intervals
      let intervals: Date[] = [];

      if (intervalType === 'monthly') {
        // For monthly, we want points at month starts or similar?
        // Or just iterate standard months between start and end.
        // Let's use startOfMonth for standard buckets.
        let curr = startOfMonth(new Date(start));
        const endMonth = startOfMonth(new Date(end));
        while (curr <= endMonth) {
          intervals.push(new Date(curr));
          curr.setMonth(curr.getMonth() + 1);
        }
        // Ensure end is covered if logic needs? 
        // Actually for bar/line charts, we aggregations.
        // Let's stick to the same "History Points" logic as NetWorth? 
        // BUT Cashflow is "Flow per period". Net Worth is "Balance at Point".
        // So for Cashflow:
        // Daily: Sum of Day.
        // Weekly: Sum of Week.
        // Monthly: Sum of Month.
      } else if (intervalType === 'weekly') {
        // Iterate by weeks?
        // Simplest is generic bucket approach.
        let curr = new Date(start);
        while (curr <= end) {
          intervals.push(new Date(curr));
          curr.setDate(curr.getDate() + 7);
        }
      } else {
        intervals = eachDayOfInterval({ start, end });
      }

      // If we use standard intervals, we need to map transactions to them.

      // Let's refine: We want a list of points. Each point represents the flow roughly in that bucket.
      // Net Worth was "State". Cash Flow is "Sum".

      // Let's use the explicit `eachDayOfInterval` and then aggregate if needed?
      // No, for 90 days, 90 bars is too much. 
      // We want ~12 bars for Monthly.

      const history = [];

      // Bucket Transactions
      // We can iterate the generated intervals.

      for (let i = 0; i < intervals.length; i++) {
        const bucketStart = intervals[i];
        let bucketEnd: Date;

        if (intervalType === 'monthly') {
          bucketEnd = new Date(bucketStart);
          bucketEnd.setMonth(bucketEnd.getMonth() + 1);
          bucketEnd.setDate(bucketEnd.getDate() - 1); // End of month roughly
        } else if (intervalType === 'weekly') {
          bucketEnd = new Date(bucketStart);
          bucketEnd.setDate(bucketEnd.getDate() + 6);
        } else {
          bucketEnd = bucketStart; // Daily is same day
        }

        // Clamp bucketEnd to global end?
        if (bucketEnd > end) bucketEnd = end;

        // Filter txns in this bucket
        const bucketTxns = (transactions || []).filter((t: any) => {
          const tDate = new Date(t.date);
          // Daily mismatch logic fix:
          if (intervalType === 'daily') {
            return isSameDay(tDate, bucketStart);
          }
          return tDate >= bucketStart && tDate <= bucketEnd;
        });

        // Calculate sums
        let income = 0;
        let expense = 0;

        bucketTxns.forEach((t: any) => {
          // Filter reconciliations
          const cat = t.category as any;
          const catName = cat?.name?.toLowerCase() || "";
          const parentName = cat?.parent?.name?.toLowerCase() || "";
          const txName = t.name?.toLowerCase() || "";

          const isReconciliation =
            txName.includes("balance correction") ||
            txName.includes("opening balance") ||
            catName.includes("adjustment") ||
            catName.includes("reconciliation") ||
            catName.includes("opening balance") ||
            parentName.includes("adjustment") ||
            parentName.includes("reconciliation") ||
            parentName.includes("opening balance");

          if (isReconciliation) return;

          if (t.type === 'income') income += t.amount;
          if (t.type === 'expense') expense += t.amount;
        });

        history.push({
          date: format(bucketStart, intervalType === 'monthly' ? "MMM" : intervalType === 'weekly' ? "d MMM" : "dd"),
          fullDate: bucketStart.toISOString(),
          income,
          expense,
          label: format(bucketStart, intervalType === 'monthly' ? "MMM" : "d MMM")
        });
      }

      return history;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getBudgetPerformance = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const start = startOfMonth(new Date()).toISOString();

      // 1. Get Budgets
      const { data: budgets, error: budgetError } = await supabase
        .from("budgets")
        .select(
          `
                    id, amount,
                    category:categories (id, name)
                `,
        )
        .eq("user_id", userId);

      if (budgetError) throw budgetError;

      // 2. Enhance with spent amount
      return (await Promise.all(
        (budgets || []).map(async (b: any) => {
          const { data: spending } = await supabase
            .from("transactions")
            .select("amount")
            .eq("user_id", userId)
            .eq("category_id", b.category?.id)
            .eq("type", "expense")
            .gte("date", start);

          const spent = (spending || []).reduce((sum, t) => sum + t.amount, 0);

          return {
            category_id: b.category?.id,
            category_name: b.category?.name,
            budget_amount: b.amount,
            spent_amount: spent,
            remaining: Math.max(0, b.amount - spent),
            percentage:
              b.amount > 0 ? (spent / b.amount) * 100 : spent > 0 ? 100 : 0,
          };
        }),
      )) as BudgetPerformance[];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getTripsAnalytics = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data: trips, error } = await supabase
        .from("trips")
        .select("id, name, budget_amount")
        .eq("user_id", userId)
        .gte("end_date", new Date().toISOString().split("T")[0]);

      if (error) throw error;

      return await Promise.all(
        (trips || []).map(async (t: any) => {
          const { data: spending } = await supabase
            .from("transactions")
            .select("amount")
            .eq("trip_id", t.id)
            .eq("type", "expense");

          const totalSpent = (spending || []).reduce(
            (sum, s) => sum + s.amount,
            0,
          );

          return {
            id: t.id,
            name: t.name,
            budget: t.budget_amount || 0,
            spent: totalSpent,
            percentage:
              t.budget_amount > 0 ? (totalSpent / t.budget_amount) * 100 : 0,
          };
        }),
      );
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getGroupsAnalytics = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data: groups, error } = await supabase
        .from("group_members")
        .select(
          `
                    group:groups (id, name)
                `,
        )
        .eq("user_id", userId);

      if (error) throw error;

      return await Promise.all(
        (groups || []).map(async (g: any) => {
          const group = g.group;
          const { data: spending } = await supabase
            .from("transactions")
            .select("amount")
            .eq("group_id", group.id)
            .eq("type", "expense");

          const totalSpent = (spending || []).reduce(
            (sum, s) => sum + s.amount,
            0,
          );

          return {
            id: group.id,
            name: group.name,
            color: "#6366F1",
            total_spent: totalSpent,
          };
        }),
      );
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getNeedsWantsSavings = useCallback(
    async (userId: string, options?: DateRangeOptions) => {
      setLoading(true);
      try {
        const { startISO, endISO } = getRangeBounds(options);

        // Fetch Expenses and Transfers (for Savings)
        const { data: transactions, error } = await supabase
          .from("transactions")
          .select(
            `
            id, amount, type, date, savings_id, name,
            category:categories!transactions_category_id_fkey(name, icon, color, parent:parent_id(name))
          `
          )
          .eq("user_id", userId)
          .gte("date", startISO)
          .lte("date", endISO);

        if (error) throw error;

        let needs = 0;
        let wants = 0;
        let savings = 0;
        const needsTransactions: any[] = [];
        const wantsTransactions: any[] = [];
        const savingsTransactions: any[] = [];

        (transactions || []).forEach((t: any) => {
          // Filter reconciliations
          const cat = t.category as any;
          const catName = cat?.name?.toLowerCase() || "";
          const parentName = cat?.parent?.name?.toLowerCase() || "";
          const txName = t.name?.toLowerCase() || "";

          const isReconciliation =
            txName.includes("balance correction") ||
            txName.includes("opening balance") ||
            catName.includes("adjustment") ||
            catName.includes("reconciliation") ||
            catName.includes("opening balance") ||
            parentName.includes("adjustment") ||
            parentName.includes("reconciliation") ||
            parentName.includes("opening balance");

          if (isReconciliation) return;

          const txnForList = {
            ...t,
            category_name: cat?.name,
            category_icon: cat?.icon,
            category_color: cat?.color,
          };

          // 1. Savings
          if (t.type === "transfer" && t.savings_id) {
            savings += t.amount;
            savingsTransactions.push(txnForList);
            return;
          }

          // 2. Expenses -> Needs vs Wants
          if (t.type === "expense") {
            if (isNeed(catName, parentName)) {
              needs += t.amount;
              needsTransactions.push(txnForList);
            } else {
              wants += t.amount;
              wantsTransactions.push(txnForList);
            }
          }
        });

        const total = needs + wants + savings;

        return {
          needs,
          wants,
          savings,
          total,
          needsTransactions,
          wantsTransactions,
          savingsTransactions,
        } as NeedsWantsSavingsData;
      } catch (err: any) {
        setError(err.message);
        return { needs: 0, wants: 0, savings: 0, total: 0, needsTransactions: [], wantsTransactions: [], savingsTransactions: [] };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getSpendingInsights = useCallback(
    async (userId: string, options?: DateRangeOptions) => {
      setLoading(true);
      try {
        const { startISO: currentPeriodStart, endISO: currentPeriodEnd, start: startObj, end: endObj } = getRangeBounds(options);

        // Calculate actual days in period for average calculation
        const daysInPeriod = Math.max(1, Math.ceil((endObj.getTime() - startObj.getTime() + 1) / (1000 * 60 * 60 * 24)));

        const previousPeriodEndObj = new Date(startObj.getTime());
        const previousPeriodStartObj = new Date(previousPeriodEndObj.getTime() - (endObj.getTime() - startObj.getTime()));

        const previousPeriodStart = previousPeriodStartObj.toISOString();
        const previousPeriodEnd = previousPeriodEndObj.toISOString();

        // 1. Current Period Spending
        const { data: currentTransactions } = await supabase
          .from("transactions")
          .select("amount, name, category:categories (id, name, parent:parent_id(name))")
          .eq("user_id", userId)
          .eq("type", "expense")
          .gte("date", currentPeriodStart)
          .lte("date", currentPeriodEnd);

        const filterReconciliation = (t: any) => {
          const cat = t.category as any;
          const catName = cat?.name?.toLowerCase() || "";
          const parentName = cat?.parent?.name?.toLowerCase() || "";
          const txName = t.name?.toLowerCase() || "";

          return !(
            txName.includes("balance correction") ||
            txName.includes("opening balance") ||
            catName.includes("adjustment") ||
            catName.includes("reconciliation") ||
            catName.includes("opening balance") ||
            parentName.includes("adjustment") ||
            parentName.includes("reconciliation") ||
            parentName.includes("opening balance")
          );
        };

        const currentTotal = (currentTransactions || [])
          .filter(filterReconciliation)
          .reduce((sum, t) => sum + t.amount, 0);

        // 2. Previous Period Spending
        const { data: previousTransactions } = await supabase
          .from("transactions")
          .select("amount, name, category:categories (id, name, parent:parent_id(name))")
          .eq("user_id", userId)
          .eq("type", "expense")
          .gte("date", previousPeriodStart)
          .lt("date", previousPeriodEnd);

        const previousTotal = (previousTransactions || [])
          .filter(filterReconciliation)
          .reduce((sum, t) => sum + t.amount, 0);

        // 3. Comparisons
        let percentageChange = 0;
        if (previousTotal > 0) {
          percentageChange = ((currentTotal - previousTotal) / previousTotal) * 100;
        } else if (currentTotal > 0) {
          percentageChange = 100;
        } else {
          percentageChange = 0;
        }

        // 4. Top Category
        const catMap = new Map<string, { name: string; total: number }>();
        (currentTransactions || []).forEach((t: any) => {
          if (!t.category) return;
          const existing = catMap.get(t.category.id) || {
            name: t.category.name,
            total: 0,
          };
          existing.total += t.amount;
          catMap.set(t.category.id, existing);
        });

        const topCat = Array.from(catMap.values()).sort((a, b) => b.total - a.total)[0];
        const topCategory = topCat ? topCat.name : null;

        // 5. Largest Transaction
        const { data: largestTxResult } = await supabase
          .from("transactions")
          .select(`
            description, amount, date,
            category:categories (name, icon, color)
          `)
          .eq("user_id", userId)
          .eq("type", "expense")
          .gte("date", currentPeriodStart)
          .lte("date", currentPeriodEnd)
          .order("amount", { ascending: false })
          .limit(1)
          .maybeSingle();

        const largestTransaction = largestTxResult
          ? {
            name: largestTxResult.description,
            amount: largestTxResult.amount,
            date: largestTxResult.date,
            category_name: (largestTxResult.category as any)?.name,
            category_icon: (largestTxResult.category as any)?.icon,
            category_color: (largestTxResult.category as any)?.color,
          }
          : null;

        // Metrics
        const dailyAverage = currentTotal / daysInPeriod;
        const projectedTotal = dailyAverage * 30;

        // Trend & Suggestion
        let trendMessage = "";
        const absChange = Math.abs(percentageChange);
        if (percentageChange <= -5) {
          trendMessage = `Great job! You cut spending by ${absChange.toFixed(1)}%.`;
        } else if (percentageChange >= 5) {
          trendMessage = `Heads up: Spending jumped by ${absChange.toFixed(1)}%.`;
        } else {
          trendMessage = `Your spending is stable (±${absChange.toFixed(1)}%).`;
        }

        const suggestion = topCategory
          ? `Consider setting a budget for ${topCategory} to save more.`
          : "Track more expenses to get personalized insights.";

        return {
          currentTotal,
          previousTotal,
          percentageChange,
          topCategory,
          largestTransaction,
          dailyAverage,
          projectedTotal,
          trendMessage,
          suggestion,
        } as SpendingInsights;
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getMerchantSpending = useCallback(async (userId: string, options?: DateRangeOptions) => {
    setLoading(true);
    try {
      const { startISO, endISO } = getRangeBounds(options);
      const { data, error } = await supabase
        .from("transactions")
        .select("name, amount")
        .eq("user_id", userId)
        .eq("type", "expense")
        .gte("date", startISO)
        .lte("date", endISO);

      if (error) throw error;

      const merchantMap = new Map<string, { total: number; count: number }>();
      let grandTotal = 0;

      (data || []).forEach((t: any) => {
        const name = t.name.trim().split(" ")[0].split("-")[0].toUpperCase();
        const existing = merchantMap.get(name) || { total: 0, count: 0 };
        existing.total += t.amount;
        existing.count += 1;
        grandTotal += t.amount;
        merchantMap.set(name, existing);
      });

      return Array.from(merchantMap.entries())
        .map(([name, stats]) => ({
          merchant_name: name,
          total: stats.total,
          count: stats.count,
          percentage: grandTotal > 0 ? (stats.total / grandTotal) * 100 : 0
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getSpendingVelocity = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfThisMonth = startOfMonth(now);
      const dayOfMonth = now.getDate();
      const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

      const { data: currentMonthTxns } = await supabase
        .from("transactions")
        .select("amount, date")
        .eq("user_id", userId)
        .eq("type", "expense")
        .gte("date", startOfThisMonth.toISOString());

      const currentTotal = (currentMonthTxns || []).reduce((sum, t) => sum + t.amount, 0);

      const last3MonthsStart = subDays(startOfThisMonth, 90);
      const { data: pastTxns } = await supabase
        .from("transactions")
        .select("amount, date")
        .eq("user_id", userId)
        .eq("type", "expense")
        .gte("date", last3MonthsStart.toISOString())
        .lt("date", startOfThisMonth.toISOString());

      const monthlyBuckets: { [key: string]: number } = {};
      (pastTxns || []).forEach(t => {
        const d = new Date(t.date);
        if (d.getDate() <= dayOfMonth) {
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          monthlyBuckets[key] = (monthlyBuckets[key] || 0) + t.amount;
        }
      });

      const avgHistorical = Object.values(monthlyBuckets).length > 0
        ? Object.values(monthlyBuckets).reduce((a, b) => a + b, 0) / Object.values(monthlyBuckets).length
        : currentTotal;

      const velocityRatio = currentTotal / (avgHistorical || 1);
      const status = velocityRatio > 1.1 ? "ahead" : velocityRatio < 0.9 ? "behind" : "on_track";

      const dailyMap = new Map<number, number>();
      for (let i = 1; i <= dayOfMonth; i++) dailyMap.set(i, 0);
      (currentMonthTxns || []).forEach(t => {
        const d = new Date(t.date).getDate();
        dailyMap.set(d, (dailyMap.get(d) || 0) + t.amount);
      });

      let cumulative = 0;
      const dailyVelocity = Array.from(dailyMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([day, amount]) => {
          cumulative += amount;
          return { date: day.toString(), cumulative };
        });

      return {
        currentSpend: currentTotal,
        averageSpend: avgHistorical,
        status,
        projectedOverspend: status === "ahead" ? (currentTotal / dayOfMonth) * totalDaysInMonth - avgHistorical : 0,
        dailyVelocity
      } as SpendingVelocity;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUpcomingBills = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("recurring_configs")
        .select(`
          id, name, amount, frequency, start_date, type,
          category:categories (name, icon, color)
        `)
        .eq("user_id", userId)
        .eq("type", "expense"); // Only fetch expense recurring configs, not income

      if (error) throw error;

      const today = new Date();
      const upcoming = (data || []).map((b: any) => {
        const start = new Date(b.start_date);
        let dueDate = new Date(start);
        while (dueDate < today) {
          if (b.frequency === 'monthly') dueDate.setMonth(dueDate.getMonth() + 1);
          else if (b.frequency === 'weekly') dueDate.setDate(dueDate.getDate() + 7);
          else if (b.frequency === 'yearly') dueDate.setFullYear(dueDate.getFullYear() + 1);
          else dueDate.setDate(dueDate.getDate() + 1);
        }
        return {
          id: b.id, name: b.name, amount: b.amount,
          dueDate: dueDate.toISOString(),
          category: b.category, frequency: b.frequency
        };
      })
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 3);

      return upcoming as UpcomingBill[];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getDebtHealth = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data: loans, error } = await supabase
        .from("loans")
        .select("total_amount, remaining_amount, type, next_due_date")
        .eq("user_id", userId)
        .eq("status", "active")
        .eq("type", "borrowed");

      if (error) throw error;

      let totalDebt = 0;
      let remainingDebt = 0;
      let nextPaymentDate: string | null = null;

      (loans || []).forEach(l => {
        totalDebt += l.total_amount;
        remainingDebt += l.remaining_amount;
        if (!nextPaymentDate || (l.next_due_date && new Date(l.next_due_date) < new Date(nextPaymentDate))) {
          nextPaymentDate = l.next_due_date;
        }
      });

      return {
        totalDebt,
        paidAmount: totalDebt - remainingDebt,
        progress: totalDebt > 0 ? ((totalDebt - remainingDebt) / totalDebt) * 100 : 0,
        interestPaid: 0,
        nextPaymentDate
      } as DebtHealth;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(
    () => ({
      getNetWorth,
      getSpendingByCategory,
      getCashFlow,
      getBudgetPerformance,
      getTripsAnalytics,
      getGroupsAnalytics,
      getSpendingInsights,
      getNeedsWantsSavings,
      getMerchantSpending,
      getSpendingVelocity,
      getUpcomingBills,
      getDebtHealth,
      loading,
      error,
    }),
    [
      getNetWorth,
      getSpendingByCategory,
      getCashFlow,
      getBudgetPerformance,
      getTripsAnalytics,
      getGroupsAnalytics,
      getSpendingInsights,
      getNeedsWantsSavings,
      getMerchantSpending,
      getSpendingVelocity,
      getUpcomingBills,
      getDebtHealth,
      loading,
      error,
    ],
  );
};

export interface SpendingInsights {
  currentTotal: number;
  previousTotal: number;
  percentageChange: number;
  topCategory: string | null;
  dailyAverage: number;
  projectedTotal: number;
  largestTransaction: {
    name: string;
    amount: number;
    date: string;
    category_name: string;
    category_icon: string;
    category_color: string;
  } | null;
  trendMessage: string;
  suggestion: string;
}
