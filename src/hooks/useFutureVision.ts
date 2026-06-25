import { useCallback, useState } from "react";
import { supabase } from "../lib/supabase";

export type GoalType = "emergency_fund" | "vehicle" | "property" | "marriage" | "education" | "investment" | "travel" | "custom";
export type VisionPlanType = "goal" | "future_expense" | "safety_buffer" | "debt_payoff" | "small_wish";
export type VisionPlanStatus = "active" | "paused" | "completed" | "archived";

export interface VisionGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  category_id?: string;
  goal_type?: GoalType;
  priority: number;
  monthly_allocation?: number;
  cost_inflation_rate?: number;
  expected_return_rate?: number;
  target_date?: string;
  is_vision_goal: boolean;
  icon?: string;
  color?: string;
  notes?: string;
  include_in_net_worth?: boolean;
  created_at: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

export interface VisionPlan {
  id: string;
  user_id: string;
  plan_type: VisionPlanType;
  title: string;
  target_amount: number;
  current_amount: number;
  monthly_allocation: number;
  target_date?: string | null;
  priority: number;
  status: VisionPlanStatus;
  notes?: string | null;
  icon?: string | null;
  color?: string | null;
  handling_strategy?: string | null;
  linked_savings_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface VisionScenario {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  assumptions: ScenarioAssumptions;
  created_at: string;
}

export interface ScenarioAssumptions {
  inflation_rate: number;
  investment_return: number;
  savings_capacity: number | null;
  income_growth: number;
  expense_growth: number;
  monthly_income?: number | null;
  monthly_expense?: number | null;
  cashflow_source?: "estimated" | "manual";
}

export interface CashflowEstimate {
  estimatedIncome: number;
  estimatedExpense: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySurplus: number;
  source: "estimated" | "manual";
  confidence: "low" | "medium" | "high";
  sampleMonths: number;
}

export interface ProjectionPoint {
  month: string;
  label: string;
  balance: number;
  contributed: number;
  interestEarned: number;
  isTarget: boolean;
}

export interface GoalProjection {
  goal: VisionGoal;
  points: ProjectionPoint[];
  completionDate: string | null;
  completionMonth: string | null;
  monthsToGoal: number | null;
  totalInterestEarned: number;
  finalBalance: number;
  monthlyRequired: number;
  onTrack: boolean;
}

export interface VisionPlanProjection {
  plan: VisionPlan;
  completionDate: string | null;
  completionMonth: string | null;
  monthsToPlan: number | null;
  remainingAmount: number;
  monthlyRequired: number;
  onTrack: boolean;
}

export interface ScenarioComparison {
  scenarioName: string;
  scenarioId: string;
  isDefault: boolean;
  projection: GoalProjection;
}

export interface CapacityResult {
  goalId: string;
  goalName: string;
  goalType?: GoalType;
  targetAmount: number;
  projectedMonths: number;
  projectedDate: string;
  monthlyNeeded: number;
  progress: number;
}

export const GOAL_TYPE_META: Record<GoalType, { label: string; icon: string; color: string; defaultInflation: number; defaultReturn: number; description: string }> = {
  emergency_fund: { label: "Emergency Fund", icon: "shield-check", color: "#22c55e", defaultInflation: 0, defaultReturn: 4, description: "3-6 months of expenses" },
  vehicle: { label: "Vehicle", icon: "car", color: "#3b82f6", defaultInflation: 5, defaultReturn: 0, description: "Car, bike, or any vehicle" },
  property: { label: "Property", icon: "home", color: "#f59e0b", defaultInflation: 8, defaultReturn: 0, description: "House, flat, or plot" },
  marriage: { label: "Marriage", icon: "heart", color: "#ef4444", defaultInflation: 7, defaultReturn: 0, description: "Wedding and related expenses" },
  education: { label: "Education", icon: "school", color: "#8b5cf6", defaultInflation: 10, defaultReturn: 0, description: "Higher studies or courses" },
  investment: { label: "Investment", icon: "chart-line", color: "#06b6d4", defaultInflation: 0, defaultReturn: 12, description: "Build a corpus through investments" },
  travel: { label: "Travel", icon: "airplane", color: "#ec4899", defaultInflation: 5, defaultReturn: 0, description: "Dream vacation or trip" },
  custom: { label: "Custom Goal", icon: "star", color: "#64748b", defaultInflation: 0, defaultReturn: 0, description: "Any other goal" },
};

export const VISION_PLAN_META: Record<VisionPlanType, { label: string; shortLabel: string; icon: string; color: string; description: string; strategy: string }> = {
  goal: {
    label: "Goal",
    shortLabel: "Goal",
    icon: "flag-checkered",
    color: "#2563eb",
    description: "Build money toward a specific target.",
    strategy: "Save a fixed amount every month until this is funded.",
  },
  future_expense: {
    label: "Future Expense",
    shortLabel: "Expense",
    icon: "calendar-star",
    color: "#f97316",
    description: "Plan for a known future spend.",
    strategy: "Reserve money before the expense arrives.",
  },
  safety_buffer: {
    label: "Safety Buffer",
    shortLabel: "Buffer",
    icon: "shield-check",
    color: "#16a34a",
    description: "Prepare for income gaps or emergencies.",
    strategy: "Keep this protected before funding lower-priority plans.",
  },
  debt_payoff: {
    label: "Debt Payoff",
    shortLabel: "Debt",
    icon: "bank-minus",
    color: "#dc2626",
    description: "Plan extra payments against debt.",
    strategy: "Use surplus to reduce liability faster.",
  },
  small_wish: {
    label: "Small Wish",
    shortLabel: "Wish",
    icon: "star",
    color: "#a855f7",
    description: "A small purchase or treat worth planning.",
    strategy: "Fund lightly without disturbing core obligations.",
  },
};

const DEFAULT_ASSUMPTIONS: ScenarioAssumptions = {
  inflation_rate: 6,
  investment_return: 10,
  savings_capacity: null,
  income_growth: 5,
  expense_growth: 3,
  monthly_income: null,
  monthly_expense: null,
  cashflow_source: "estimated",
};

function monthsBetween(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function formatMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(date: Date): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function solveMonths(PV: number, PMT: number, r: number, FV: number): number {
  if (PMT <= 0 && r <= 0) return PV >= FV ? 0 : Infinity;
  if (r <= 0) return PMT > 0 ? Math.ceil((FV - PV) / PMT) : Infinity;
  const monthlyRate = r / 100 / 12;
  if (PMT > 0) {
    const target = (FV * monthlyRate + PMT) / (PV * monthlyRate + PMT);
    if (target <= 0) return Infinity;
    return Math.log(target) / Math.log(1 + monthlyRate);
  }
  if (PV >= FV) return 0;
  return Math.log(FV / PV) / Math.log(1 + monthlyRate);
}

function projectBalance(PV: number, PMT: number, r: number, months: number, inflation: number, targetAmount: number): ProjectionPoint[] {
  const points: ProjectionPoint[] = [];
  const monthlyRate = r / 100 / 12;
  const monthlyInflation = inflation / 100 / 12;
  let balance = PV;
  let totalContrib = PV;
  let totalInterest = 0;
  let inflatedTarget = targetAmount;
  const now = new Date();

  points.push({
    month: formatMonth(now),
    label: "Now",
    balance: Math.round(balance),
    contributed: Math.round(totalContrib),
    interestEarned: Math.round(totalInterest),
    isTarget: false,
  });

  for (let m = 1; m <= months && balance < inflatedTarget; m++) {
    const interestEarned = balance * monthlyRate;
    balance += interestEarned + PMT;
    totalContrib += PMT;
    totalInterest += interestEarned;
    inflatedTarget = targetAmount * Math.pow(1 + monthlyInflation, m);
    const date = addMonths(now, m);
    points.push({
      month: formatMonth(date),
      label: m % 12 === 0 || m === 1 ? formatMonthLabel(date) : "",
      balance: Math.round(balance),
      contributed: Math.round(totalContrib),
      interestEarned: Math.round(totalInterest),
      isTarget: balance >= inflatedTarget,
    });
    if (balance >= inflatedTarget) break;
  }

  return points;
}

function normalizeAssumptions(value: any): ScenarioAssumptions {
  const parsed = typeof value === "string" ? JSON.parse(value) : value || {};
  return { ...DEFAULT_ASSUMPTIONS, ...parsed };
}

export function isReconciliationTransaction(t: any): boolean {
  const categoryData = t.category || t.categories;
  const cat = Array.isArray(categoryData) ? categoryData[0] : categoryData;
  const catName = cat?.name?.toLowerCase() || "";
  const parentName = cat?.parent?.name?.toLowerCase() || "";
  const txName = t.name?.toLowerCase() || "";

  return (
    txName.includes("balance correction") ||
    txName.includes("opening balance") ||
    catName.includes("adjustment") ||
    catName.includes("reconciliation") ||
    catName.includes("opening balance") ||
    parentName.includes("adjustment") ||
    parentName.includes("reconciliation") ||
    parentName.includes("opening balance")
  );
}

export const useFutureVision = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getVisionGoals = useCallback(async (userId: string): Promise<VisionGoal[]> => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("savings")
        .select("*, category:categories!savings_category_id_fkey (name, icon, color)")
        .eq("user_id", userId)
        .eq("is_vision_goal", true)
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false });

      if (err) throw err;
      return (data || []).map((s: any) => ({
        ...s,
        category_name: s.category?.name,
        category_icon: s.category?.icon,
        category_color: s.category?.color,
      })) as VisionGoal[];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getVisionPlans = useCallback(async (userId: string): Promise<VisionPlan[]> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("vision_plans")
        .select("*")
        .eq("user_id", userId)
        .neq("status", "archived")
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false });
      if (err) throw err;
      return (data || []) as VisionPlan[];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createVisionPlan = useCallback(async (
    userId: string,
    payload: Omit<Partial<VisionPlan>, "id" | "user_id" | "created_at" | "updated_at"> & { title: string; plan_type: VisionPlanType },
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const meta = VISION_PLAN_META[payload.plan_type];
      const { data, error: err } = await supabase
        .from("vision_plans")
        .insert({
          user_id: userId,
          plan_type: payload.plan_type,
          title: payload.title,
          target_amount: payload.target_amount || 0,
          current_amount: payload.current_amount || 0,
          monthly_allocation: payload.monthly_allocation || 0,
          target_date: payload.target_date || null,
          priority: payload.priority || 5,
          status: payload.status || "active",
          notes: payload.notes || null,
          icon: payload.icon || meta.icon,
          color: payload.color || meta.color,
          handling_strategy: payload.handling_strategy || meta.strategy,
          linked_savings_id: payload.linked_savings_id || null,
        })
        .select("id")
        .single();
      if (err) throw err;
      return data?.id || null;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVisionPlan = useCallback(async (id: string, updates: Partial<VisionPlan>): Promise<boolean> => {
    try {
      const { error: err } = await supabase
        .from("vision_plans")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (err) throw err;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const deleteVisionPlan = useCallback(async (id: string): Promise<boolean> => {
    return updateVisionPlan(id, { status: "archived" });
  }, [updateVisionPlan]);

  const getScenarios = useCallback(async (userId: string): Promise<VisionScenario[]> => {
    try {
      const { data, error: err } = await supabase
        .from("vision_scenarios")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true });

      if (err) throw err;
      return (data || []).map((s: any) => ({
        ...s,
        assumptions: normalizeAssumptions(s.assumptions),
      })) as VisionScenario[];
    } catch {
      return [];
    }
  }, []);

  const saveScenario = useCallback(async (userId: string, name: string, assumptions: ScenarioAssumptions): Promise<string | null> => {
    try {
      const { data, error: err } = await supabase
        .from("vision_scenarios")
        .insert({ user_id: userId, name, assumptions })
        .select()
        .single();
      if (err) throw err;
      return data.id;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const deleteScenario = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: err } = await supabase.from("vision_scenarios").delete().eq("id", id);
      if (err) throw err;
      return true;
    } catch {
      return false;
    }
  }, []);

  const setDefaultScenario = useCallback(async (userId: string, id: string): Promise<boolean> => {
    try {
      await supabase.from("vision_scenarios").update({ is_default: false }).eq("user_id", userId);
      await supabase.from("vision_scenarios").update({ is_default: true }).eq("id", id);
      return true;
    } catch {
      return false;
    }
  }, []);

  const getDefaultAssumptions = useCallback(async (userId: string): Promise<ScenarioAssumptions> => {
    const scenarios = await getScenarios(userId);
    const def = scenarios.find((s) => s.is_default) || scenarios[0];
    return def ? normalizeAssumptions(def.assumptions) : DEFAULT_ASSUMPTIONS;
  }, [getScenarios]);

  const saveCashflowOverrides = useCallback(async (userId: string, monthlyIncome: number, monthlyExpense: number): Promise<boolean> => {
    try {
      const scenarios = await getScenarios(userId);
      const def = scenarios.find((s) => s.is_default) || scenarios[0];
      const assumptions = {
        ...(def ? def.assumptions : DEFAULT_ASSUMPTIONS),
        monthly_income: monthlyIncome,
        monthly_expense: monthlyExpense,
        savings_capacity: monthlyIncome - monthlyExpense,
        cashflow_source: "manual" as const,
      };

      if (def) {
        const { error: err } = await supabase
          .from("vision_scenarios")
          .update({ assumptions, is_default: true, updated_at: new Date().toISOString() })
          .eq("id", def.id);
        if (err) throw err;
        return true;
      }

      const { error: err } = await supabase
        .from("vision_scenarios")
        .insert({ user_id: userId, name: "Base", is_default: true, assumptions });
      if (err) throw err;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [getScenarios]);

  const getCashflowEstimate = useCallback(async (userId: string): Promise<CashflowEstimate> => {
    const assumptions = await getDefaultAssumptions(userId);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();

    const { data } = await supabase
      .from("transactions")
      .select("amount, type, name, date, category:categories!transactions_category_id_fkey(name, parent:parent_id(name)), accounts:to_account_id(type, card_type)")
      .eq("user_id", userId)
      .gte("date", start);

    const monthly: Record<string, { income: number; expense: number }> = {};
    (data || []).forEach((t: any) => {
      if (isReconciliationTransaction(t)) return;
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthly[key]) monthly[key] = { income: 0, expense: 0 };
      const isCreditSpending = t.type === "transfer" && t.accounts?.type === "card" && t.accounts?.card_type === "credit";
      if (t.type === "income") monthly[key].income += t.amount;
      if (t.type === "expense" || isCreditSpending) monthly[key].expense += t.amount;
    });

    const buckets = Object.values(monthly);
    const sampleMonths = Math.max(buckets.length, 1);
    const estimatedIncome = Math.round(buckets.reduce((s, m) => s + m.income, 0) / sampleMonths);
    const estimatedExpense = Math.round(buckets.reduce((s, m) => s + m.expense, 0) / sampleMonths);
    const hasManual = assumptions.cashflow_source === "manual" && assumptions.monthly_income != null && assumptions.monthly_expense != null;
    const monthlyIncome = hasManual ? Math.round(assumptions.monthly_income || 0) : estimatedIncome;
    const monthlyExpense = hasManual ? Math.round(assumptions.monthly_expense || 0) : estimatedExpense;

    return {
      estimatedIncome,
      estimatedExpense,
      monthlyIncome,
      monthlyExpense,
      monthlySurplus: monthlyIncome - monthlyExpense,
      source: hasManual ? "manual" : "estimated",
      confidence: buckets.length >= 3 ? "high" : buckets.length >= 2 ? "medium" : "low",
      sampleMonths: buckets.length,
    };
  }, [getDefaultAssumptions]);

  const projectGoal = useCallback((goal: VisionGoal, assumptions: ScenarioAssumptions, maxMonths: number = 600): GoalProjection => {
    const PMT = goal.monthly_allocation || 0;
    const r = goal.expected_return_rate ?? assumptions.investment_return;
    const inflation = goal.cost_inflation_rate ?? assumptions.inflation_rate;
    const PV = goal.current_amount;
    const FV = goal.target_amount;
    const months = Math.ceil(solveMonths(PV, PMT, r, FV));
    const actualMonths = Number.isFinite(months) ? Math.min(months, maxMonths) : maxMonths;
    const points = projectBalance(PV, PMT, r, actualMonths, inflation, FV);
    const completionPoint = points.find((p) => p.isTarget);
    const completionDate = completionPoint ? completionPoint.month : null;
    const completionIdx = completionPoint ? points.indexOf(completionPoint) : null;
    const now = new Date();
    const target = goal.target_date ? new Date(goal.target_date) : null;
    let onTrack = true;
    if (target && completionIdx !== null) onTrack = completionIdx <= monthsBetween(now, target);

    return {
      goal,
      points,
      completionDate,
      completionMonth: completionDate ? formatMonthLabel(addMonths(new Date(), points.findIndex((p) => p.isTarget))) : null,
      monthsToGoal: completionIdx !== null ? completionIdx : null,
      totalInterestEarned: points.length > 0 ? points[points.length - 1].interestEarned : 0,
      finalBalance: points.length > 0 ? points[points.length - 1].balance : PV,
      monthlyRequired: PMT,
      onTrack,
    };
  }, []);

  const projectVisionPlan = useCallback((plan: VisionPlan): VisionPlanProjection => {
    const remainingAmount = Math.max(0, plan.target_amount - plan.current_amount);
    const monthsToPlan = plan.monthly_allocation > 0
      ? Math.ceil(remainingAmount / plan.monthly_allocation)
      : remainingAmount <= 0 ? 0 : null;
    const completionDate = monthsToPlan !== null ? formatMonth(addMonths(new Date(), monthsToPlan)) : null;
    const completionMonth = monthsToPlan !== null ? formatMonthLabel(addMonths(new Date(), monthsToPlan)) : null;
    const target = plan.target_date ? new Date(plan.target_date) : null;
    const onTrack = target && monthsToPlan !== null ? monthsToPlan <= monthsBetween(new Date(), target) : true;
    const deadlineMonths = target ? Math.max(1, monthsBetween(new Date(), target)) : null;
    const monthlyRequired = deadlineMonths ? Math.ceil(remainingAmount / deadlineMonths) : plan.monthly_allocation;

    return {
      plan,
      completionDate,
      completionMonth,
      monthsToPlan,
      remainingAmount,
      monthlyRequired,
      onTrack,
    };
  }, []);

  const compareScenarios = useCallback((goal: VisionGoal, scenarios: VisionScenario[]): ScenarioComparison[] => {
    return scenarios.map((s) => ({
      scenarioName: s.name,
      scenarioId: s.id,
      isDefault: s.is_default,
      projection: projectGoal(goal, s.assumptions),
    }));
  }, [projectGoal]);

  const projectMultiGoal = useCallback((goals: VisionGoal[], totalMonthlyCapacity: number, assumptions: ScenarioAssumptions): CapacityResult[] => {
    const sorted = [...goals].sort((a, b) => a.priority - b.priority);
    let remaining = totalMonthlyCapacity;
    const results: CapacityResult[] = [];

    for (const goal of sorted) {
      const alloc = Math.min(goal.monthly_allocation || remaining, remaining);
      const goalWithAlloc = { ...goal, monthly_allocation: alloc };
      const proj = projectGoal(goalWithAlloc, assumptions);
      const projectedDate = proj.completionDate ? addMonths(new Date(), proj.monthsToGoal || 0).toISOString() : "beyond horizon";

      results.push({
        goalId: goal.id,
        goalName: goal.name,
        goalType: goal.goal_type,
        targetAmount: goal.target_amount,
        projectedMonths: proj.monthsToGoal || 999,
        projectedDate,
        monthlyNeeded: alloc,
        progress: goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0,
      });

      remaining -= alloc;
      if (remaining <= 0) break;
    }

    return results;
  }, [projectGoal]);

  const getRequiredContribution = useCallback((goal: VisionGoal, targetMonths: number, assumptions: ScenarioAssumptions): number => {
    const PV = goal.current_amount;
    const FV = goal.target_amount;
    const r = goal.expected_return_rate ?? assumptions.investment_return;
    const monthlyRate = r / 100 / 12;
    if (PV >= FV) return 0;
    if (monthlyRate <= 0) return Math.ceil((FV - PV) / targetMonths);
    const numerator = (FV - PV * Math.pow(1 + monthlyRate, targetMonths)) * monthlyRate;
    const denominator = Math.pow(1 + monthlyRate, targetMonths) - 1;
    return denominator !== 0 ? Math.max(0, Math.ceil(numerator / denominator)) : Math.ceil((FV - PV) / targetMonths);
  }, []);

  const getCapacityInsight = useCallback((visionGoals: VisionGoal[], totalMonthlyCapacity: number, assumptions: ScenarioAssumptions) => {
    const withAllocation = visionGoals.map((g) => ({
      ...g,
      monthly_allocation: g.monthly_allocation || Math.round(totalMonthlyCapacity * 0.2),
    }));
    return projectMultiGoal(withAllocation, totalMonthlyCapacity, assumptions);
  }, [projectMultiGoal]);

  const getSuggestedAllocation = useCallback((goal: VisionGoal, totalCapacity: number, totalGoals: number): number => {
    if (totalGoals === 0) return totalCapacity;
    return Math.round(totalCapacity / totalGoals);
  }, []);

  return {
    getVisionGoals,
    getVisionPlans,
    createVisionPlan,
    updateVisionPlan,
    deleteVisionPlan,
    getScenarios,
    saveScenario,
    deleteScenario,
    setDefaultScenario,
    getDefaultAssumptions,
    getCashflowEstimate,
    saveCashflowOverrides,
    projectGoal,
    projectVisionPlan,
    compareScenarios,
    projectMultiGoal,
    getRequiredContribution,
    getCapacityInsight,
    getSuggestedAllocation,
    loading,
    error,
  };
};
