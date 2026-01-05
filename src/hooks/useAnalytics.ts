import { eachDayOfInterval, format, isSameDay, startOfMonth, subDays } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

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
    trend: 'up' | 'down' | 'stable';
    changePercentage: number;
    history: { date: string; value: number }[];
}

export const useAnalytics = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getNetWorth = useCallback(async (userId: string) => {
        setLoading(true);
        try {
            // 1. Current Assets (Bank, Cash) and Liabilities (Credit Card Debt)
            const { data: accounts, error: accError } = await supabase
                .from('accounts')
                .select('balance, type, card_type, credit_limit')
                .eq('user_id', userId)
                .eq('is_active', true);

            if (accError) throw accError;

            let totalAssets = 0;
            let totalLiabilities = 0;

            (accounts || []).forEach(acc => {
                if (acc.type === 'card' && acc.card_type === 'credit') {
                    const debt = (acc.credit_limit || 0) - acc.balance;
                    totalLiabilities += Math.max(0, debt);
                } else {
                    totalAssets += acc.balance;
                }
            });

            // 2. Loans (Lent = Asset, Borrowed = Liability)
            const { data: loans, error: loanError } = await supabase
                .from('loans')
                .select('remaining_amount, type')
                .eq('user_id', userId)
                .eq('status', 'active');

            if (loanError) throw loanError;

            (loans || []).forEach(loan => {
                if (loan.type === 'lent') {
                    totalAssets += loan.remaining_amount;
                } else {
                    totalLiabilities += loan.remaining_amount;
                }
            });

            const currentNetWorth = totalAssets - totalLiabilities;

            // 3. Trend & History
            const historyPoints = [];
            let simulatedNetWorth = currentNetWorth;
            const today = new Date();

            historyPoints.push({ date: today.toISOString(), value: simulatedNetWorth });

            for (let i = 0; i < 6; i++) {
                const startOfMonthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const startOfNextMonthDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);

                const { data: monthTransactions } = await supabase
                    .from('transactions')
                    .select('amount, type')
                    .eq('user_id', userId)
                    .gte('date', startOfMonthDate.toISOString())
                    .lt('date', startOfNextMonthDate.toISOString());

                const monthChange = (monthTransactions || []).reduce((sum, t) => {
                    if (t.type === 'income') return sum + t.amount;
                    if (t.type === 'expense') return sum - t.amount;
                    return sum;
                }, 0);

                simulatedNetWorth -= monthChange;
                historyPoints.push({
                    date: startOfMonthDate.toISOString(),
                    value: simulatedNetWorth
                });
            }

            const finalHistory = historyPoints.reverse().map(p => ({
                date: p.date,
                value: p.value,
                label: new Date(p.date).toLocaleString('default', { month: 'short' })
            }));

            // 4. Change Percentage (30 days)
            const date = new Date();
            date.setDate(date.getDate() - 30);

            const { data: recentTransactions } = await supabase
                .from('transactions')
                .select('amount, type')
                .eq('user_id', userId)
                .gte('date', date.toISOString());

            const netChange = (recentTransactions || []).reduce((sum, t) => {
                if (t.type === 'income') return sum + t.amount;
                if (t.type === 'expense') return sum - t.amount;
                return sum;
            }, 0);

            const previousNetWorth = currentNetWorth - netChange;
            let changePercentage = 0;
            if (previousNetWorth !== 0) {
                changePercentage = (netChange / Math.abs(previousNetWorth)) * 100;
            } else if (netChange !== 0) {
                changePercentage = 100;
            }

            return {
                totalAssets,
                totalLiabilities,
                netWorth: currentNetWorth,
                trend: netChange > 0 ? 'up' : netChange < 0 ? 'down' : 'stable',
                changePercentage: Math.abs(changePercentage),
                history: finalHistory
            } as NetWorthData;

        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const getSpendingByCategory = useCallback(async (userId: string, days: number = 30) => {
        setLoading(true);
        try {
            const start = subDays(new Date(), days).toISOString();

            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    amount,
                    category:categories (id, name, icon, color)
                `)
                .eq('user_id', userId)
                .eq('type', 'expense')
                .gte('date', start);

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
                    total: 0
                };
                existing.total += t.amount;
                grandTotal += t.amount;
                categoryMap.set(cat.id, existing);
            });

            return Array.from(categoryMap.values())
                .map(item => ({
                    ...item,
                    percentage: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0
                }))
                .sort((a, b) => b.total - a.total);

        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getCashFlow = useCallback(async (userId: string, days: number = 30) => {
        setLoading(true);
        try {
            const startDate = subDays(new Date(), days - 1);
            const startDateStr = startDate.toISOString();

            const { data: transactions, error } = await supabase
                .from('transactions')
                .select('amount, type, date')
                .eq('user_id', userId)
                .gte('date', startDateStr);

            if (error) throw error;

            const interval = eachDayOfInterval({ start: startDate, end: new Date() });

            return interval.map(day => {
                const dayTransactions = (transactions || []).filter(t => isSameDay(new Date(t.date), day));
                const income = dayTransactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0);
                const expense = dayTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);

                return {
                    date: format(day, 'MMM dd'),
                    income,
                    expense
                };
            });

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
                .from('budgets')
                .select(`
                    id, amount,
                    category:categories (id, name)
                `)
                .eq('user_id', userId);

            if (budgetError) throw budgetError;

            // 2. Enhance with spent amount
            return await Promise.all((budgets || []).map(async (b: any) => {
                const { data: spending } = await supabase
                    .from('transactions')
                    .select('amount')
                    .eq('user_id', userId)
                    .eq('category_id', b.category?.id)
                    .eq('type', 'expense')
                    .gte('date', start);

                const spent = (spending || []).reduce((sum, t) => sum + t.amount, 0);

                return {
                    category_id: b.category?.id,
                    category_name: b.category?.name,
                    budget_amount: b.amount,
                    spent_amount: spent,
                    remaining: Math.max(0, b.amount - spent),
                    percentage: (spent / b.amount) * 100
                };
            })) as BudgetPerformance[];

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
                .from('trips')
                .select('id, name, budget_amount')
                .eq('user_id', userId)
                .gte('end_date', new Date().toISOString().split('T')[0]);

            if (error) throw error;

            return await Promise.all((trips || []).map(async (t: any) => {
                const { data: spending } = await supabase
                    .from('transactions')
                    .select('amount')
                    .eq('trip_id', t.id)
                    .eq('type', 'expense');

                const totalSpent = (spending || []).reduce((sum, s) => sum + s.amount, 0);

                return {
                    id: t.id,
                    name: t.name,
                    budget: t.budget_amount || 0,
                    spent: totalSpent,
                    percentage: (t.budget_amount > 0) ? (totalSpent / t.budget_amount) * 100 : 0
                };
            }));
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
                .from('group_members')
                .select(`
                    group:groups (id, name)
                `)
                .eq('user_id', userId);

            if (error) throw error;

            return await Promise.all((groups || []).map(async (g: any) => {
                const group = g.group;
                const { data: spending } = await supabase
                    .from('transactions')
                    .select('amount')
                    .eq('group_id', group.id)
                    .eq('type', 'expense');

                const totalSpent = (spending || []).reduce((sum, s) => sum + s.amount, 0);

                return {
                    id: group.id,
                    name: group.name,
                    color: '#6366F1',
                    total_spent: totalSpent
                };
            }));
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getSpendingInsights = useCallback(async (userId: string, days: number = 30) => {
        setLoading(true);
        try {
            const now = new Date();
            const currentPeriodStart = subDays(now, days).toISOString();
            const previousPeriodEnd = currentPeriodStart;
            const previousPeriodStart = subDays(new Date(currentPeriodStart), days).toISOString();

            // 1. Current Period Spending
            const { data: currentTransactions } = await supabase
                .from('transactions')
                .select('amount, category:categories (id, name)')
                .eq('user_id', userId)
                .eq('type', 'expense')
                .gte('date', currentPeriodStart);

            const currentTotal = (currentTransactions || []).reduce((sum, t) => sum + t.amount, 0);

            // 2. Previous Period Spending
            const { data: previousTransactions } = await supabase
                .from('transactions')
                .select('amount')
                .eq('user_id', userId)
                .eq('type', 'expense')
                .gte('date', previousPeriodStart)
                .lt('date', previousPeriodEnd);

            const previousTotal = (previousTransactions || []).reduce((sum, t) => sum + t.amount, 0);

            // 3. Comparisons
            let percentageChange = 0;
            if (previousTotal > 0) {
                percentageChange = ((currentTotal - previousTotal) / previousTotal) * 100;
            } else if (currentTotal > 0) {
                percentageChange = 100;
            }

            // 4. Top Category
            const catMap = new Map<string, { name: string, total: number }>();
            (currentTransactions || []).forEach((t: any) => {
                if (!t.category) return;
                const existing = catMap.get(t.category.id) || { name: t.category.name, total: 0 };
                existing.total += t.amount;
                catMap.set(t.category.id, existing);
            });

            const topCat = Array.from(catMap.values()).sort((a, b) => b.total - a.total)[0];
            const topCategory = topCat ? topCat.name : null;

            // 5. Largest Transaction
            const { data: largestTxResult } = await supabase
                .from('transactions')
                .select(`
                    description, amount, date,
                    category:categories (name, icon, color)
                `)
                .eq('user_id', userId)
                .eq('type', 'expense')
                .gte('date', currentPeriodStart)
                .order('amount', { ascending: false })
                .limit(1)
                .maybeSingle();

            const largestTransaction = largestTxResult ? {
                name: largestTxResult.description,
                amount: largestTxResult.amount,
                date: largestTxResult.date,
                category_name: (largestTxResult.category as any)?.name,
                category_icon: (largestTxResult.category as any)?.icon,
                category_color: (largestTxResult.category as any)?.color
            } : null;

            // Metrics
            const dailyAverage = currentTotal / days;
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

            let suggestion = topCategory
                ? `Consider setting a budget for ${topCategory} to save more.`
                : "Track more expenses to get personalized insights.";

            return {
                currentTotal,
                previousTotal,
                percentageChange,
                topCategory,
                dailyAverage,
                projectedTotal,
                largestTransaction,
                trendMessage,
                suggestion
            };

        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return useMemo(() => ({
        getNetWorth,
        getSpendingByCategory,
        getCashFlow,
        getBudgetPerformance,
        getTripsAnalytics,
        getGroupsAnalytics,
        getSpendingInsights,
        loading,
        error
    }), [
        getNetWorth,
        getSpendingByCategory,
        getCashFlow,
        getBudgetPerformance,
        getTripsAnalytics,
        getGroupsAnalytics,
        getSpendingInsights,
        loading,
        error
    ]);
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
