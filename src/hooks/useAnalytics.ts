import { eachDayOfInterval, format, isSameDay, startOfMonth, subDays } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { getDatabase } from '../lib/database';

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
            const db = await getDatabase();

            // Current Assets (Bank, Cash) and Liabilities (Credit Card Debt)
            const accounts = await db.getAllAsync<{ balance: number, type: string, card_type?: string, credit_limit: number }>(
                'SELECT balance, type, card_type, credit_limit FROM accounts WHERE user_id = ? AND is_active = 1',
                [userId]
            );

            let totalAssets = 0;
            let totalLiabilities = 0;

            accounts.forEach(acc => {
                if (acc.type === 'card' && acc.card_type === 'credit') {
                    // Credit Card: Balance is available credit. (Credit Limit - Balance) = Debt.
                    const debt = (acc.credit_limit || 0) - acc.balance;
                    totalLiabilities += Math.max(0, debt);
                } else {
                    totalAssets += acc.balance;
                }
            });

            // Loans (Lent = Asset, Borrowed = Liability)
            const loans = await db.getAllAsync<{ remaining_amount: number, type: string }>(
                'SELECT remaining_amount, type FROM loans WHERE user_id = ? AND status = "active"',
                [userId]
            );

            loans.forEach(loan => {
                if (loan.type === 'lent') {
                    totalAssets += loan.remaining_amount;
                } else {
                    totalLiabilities += loan.remaining_amount;
                }
            });

            const currentNetWorth = totalAssets - totalLiabilities;

            // Trend calculation & History (6 Months)
            const history: { date: string; value: number }[] = [];
            let currentRunningNetWorth = currentNetWorth;

            // Generate last 6 months dates
            const today = new Date();
            for (let i = 0; i < 6; i++) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const monthStart = d.toISOString().split('T')[0];
                const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
                const nextMonthStart = nextMonth.toISOString().split('T')[0];

                // Calculate Net Change for this month (Income - Expense)
                const monthChangeResult = await db.getFirstAsync<{ net_change: number }>(
                    `SELECT SUM(CASE 
                        WHEN type = 'income' THEN amount 
                        WHEN type = 'expense' THEN -amount 
                        ELSE 0 END) as net_change 
                     FROM transactions 
                     WHERE user_id = ? AND date >= ? AND date < ?`,
                    [userId, monthStart, nextMonthStart]
                );

                const monthChange = monthChangeResult?.net_change || 0;

                // For the current month (i=0), the 'value' is the currentNetWorth
                // For previous months, we subtract the change from the running total
                if (i === 0) {
                    history.unshift({ date: monthStart, value: currentRunningNetWorth });
                } else {
                    // If we are at month N-1, its end value is (End Value of N) - (Change in N). 
                    // Wait, no. 
                    // Balance at End of Month N = Balance at Start of Month N + Change in Month N
                    // Start of Month N = End of Month N-1
                    // So, Balance at End of Month N-1 = Balance at End of Month N - Change in Month N

                    // Actually, let represents the graph points as "End of Month" values.
                    // Point 0 (Current) = currentNetWorth
                    // Point 1 (Last Month End) = currentNetWorth - ChangeInCurrentMonth (approx) including change so far?
                    // Let's stick to: Value at Month X = Value at Month X+1 - Change in Month X+1

                    // We need to fetch change for the *previous* interval we just processed to back-calculate.
                    // But here we are looping 0 to 5.
                    // Let's do it cleanly:

                    // We need the change happened between Month N-1 and Month N to derive N-1 from N.
                }
            }

            // Simpler Loop for History:
            // 1. Get monthly changes for last 6 months.
            // 2. Start with currentNetWorth.
            // 3. Push current.
            // 4. Subtract current month's change to get start-of-month (approx) or end-of-prev-month.
            // 5. Repeat.

            const historyPoints = [];
            let simulatedNetWorth = currentNetWorth;

            // Add current point
            historyPoints.push({ date: today.toISOString(), value: simulatedNetWorth });

            for (let i = 0; i < 6; i++) {
                const startOfMonthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const startOfNextMonthDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);

                const changeResult = await db.getFirstAsync<{ net_change: number }>(
                    `SELECT SUM(CASE 
                        WHEN type = 'income' THEN amount 
                        WHEN type = 'expense' THEN -amount 
                        ELSE 0 END) as net_change 
                     FROM transactions 
                     WHERE user_id = ? AND date >= ? AND date < ?`,
                    [userId, startOfMonthDate.toISOString(), startOfNextMonthDate.toISOString()]
                );

                const change = changeResult?.net_change || 0;
                simulatedNetWorth -= change;
                // This gives us the value at the *beginning* of the month (effectively end of previous).

                historyPoints.push({
                    date: startOfMonthDate.toISOString(),
                    value: simulatedNetWorth
                });
            }

            // The loop pushes end-of-prev values. 
            // Reverse so it's chronological.
            const finalHistory = historyPoints.reverse().map(p => ({
                date: p.date,
                value: p.value,
                label: new Date(p.date).toLocaleString('default', { month: 'short' })
            }));

            // Calculate change percentage (vs 30 days ago approx)
            // We can just use the values we just computed (End of last month vs Current)
            // Or specifically 30 days ago. Let's keep the specific 30-day query for accuracy or use the graph data?
            // The graph data `simulatedNetWorth` after `i=0` loop is approx 1 month ago.
            // Let's use the 30-day query existing in code for consistency of the "vs" label.

            // Existing Trend logic
            const date = new Date();
            date.setDate(date.getDate() - 30);
            const thirtyDaysAgo = date.toISOString().split('T')[0];

            const netChangeResult = await db.getFirstAsync<{ net_change: number }>(
                `SELECT SUM(CASE 
                     WHEN type = 'income' THEN amount 
                     WHEN type = 'expense' THEN -amount 
                     ELSE 0 END) as net_change 
                  FROM transactions 
                  WHERE user_id = ? AND date >= ?`,
                [userId, thirtyDaysAgo]
            );

            const netChange = netChangeResult?.net_change || 0;
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
            const db = await getDatabase();
            const now = new Date();
            const start = subDays(now, days).toISOString();
            const end = now.toISOString();

            const stats = await db.getAllAsync<any>(
                `SELECT 
                    c.id as category_id, 
                    c.name as category_name, 
                    c.icon as category_icon, 
                    c.color as category_color, 
                    SUM(t.amount) as total
                 FROM transactions t
                 JOIN categories c ON t.category_id = c.id
                 WHERE t.user_id = ? AND t.type = 'expense' AND t.date BETWEEN ? AND ?
                 GROUP BY c.id
                 ORDER BY total DESC`,
                [userId, start, end]
            );

            const grandTotal = stats.reduce((sum: number, item: any) => sum + item.total, 0);

            return stats.map((item: any) => ({
                ...item,
                percentage: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0
            })) as CategorySpending[];

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
            const db = await getDatabase();
            const startDate = subDays(new Date(), days - 1);
            const startDateStr = startDate.toISOString();

            const transactions = await db.getAllAsync<{ amount: number, type: string, date: string }>(
                `SELECT amount, type, date FROM transactions 
                 WHERE user_id = ? AND date >= ?`,
                [userId, startDateStr]
            );

            const interval = eachDayOfInterval({ start: startDate, end: new Date() });

            const flowData: CashFlowData[] = interval.map(day => {
                const dayTransactions = transactions.filter(t => isSameDay(new Date(t.date), day));
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

            return flowData;

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
            const db = await getDatabase();
            const start = startOfMonth(new Date()).toISOString();

            const budgets = await db.getAllAsync<any>(
                `SELECT 
                    b.id, b.amount as budget_amount, 
                    c.id as category_id, c.name as category_name,
                    (SELECT SUM(amount) FROM transactions 
                     WHERE user_id = ? AND category_id = c.id AND type = 'expense' AND date >= ?) as spent_amount
                 FROM budgets b
                 JOIN categories c ON b.category_id = c.id
                 WHERE b.user_id = ?`,
                [userId, start, userId]
            );

            return budgets.map((b: any) => {
                const spent = b.spent_amount || 0;
                return {
                    category_id: b.category_id,
                    category_name: b.category_name,
                    budget_amount: b.budget_amount,
                    spent_amount: spent,
                    remaining: Math.max(0, b.budget_amount - spent),
                    percentage: (spent / b.budget_amount) * 100
                };
            }) as BudgetPerformance[];

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
            const db = await getDatabase();
            const trips = await db.getAllAsync<any>(
                `SELECT 
                    t.id, t.name, t.budget_amount as budget,
                    (SELECT SUM(amount) FROM transactions WHERE trip_id = t.id AND type = 'expense') as spent
                 FROM trips t
                 WHERE t.user_id = ? AND t.end_date >= date('now')`,
                [userId]
            );

            return trips.map((t: any) => ({
                id: t.id,
                name: t.name,
                budget: t.budget || 0,
                spent: t.spent || 0,
                percentage: (t.budget > 0) ? (t.spent / t.budget) * 100 : 0
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
            const db = await getDatabase();
            const groups = await db.getAllAsync<any>(
                `SELECT 
                    g.id, g.name, g.color,
                    (SELECT SUM(amount) FROM transactions WHERE group_id = g.id AND type = 'expense') as total_spent
                 FROM groups g
                 JOIN group_members gm ON g.id = gm.group_id
                 WHERE gm.user_id = ?`,
                [userId]
            );

            return groups.map((g: any) => ({
                id: g.id,
                name: g.name,
                color: g.color || '#6366F1',
                total_spent: g.total_spent || 0
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
            const db = await getDatabase();
            const now = new Date();
            const currentPeriodStart = subDays(now, days).toISOString();

            // Previous period: (now - 2*days) to (now - days)
            const previousPeriodEnd = currentPeriodStart;
            const previousPeriodStart = subDays(new Date(currentPeriodStart), days).toISOString();

            // Total spending for Current Period
            const currentTotalResult = await db.getFirstAsync<{ total: number }>(
                `SELECT SUM(amount) as total FROM transactions 
                 WHERE user_id = ? AND type = 'expense' AND date >= ?`,
                [userId, currentPeriodStart]
            );
            const currentTotal = currentTotalResult?.total || 0;

            // Total spending for Previous Period
            const previousTotalResult = await db.getFirstAsync<{ total: number }>(
                `SELECT SUM(amount) as total FROM transactions 
                 WHERE user_id = ? AND type = 'expense' AND date >= ? AND date < ?`,
                [userId, previousPeriodStart, previousPeriodEnd]
            );
            const previousTotal = previousTotalResult?.total || 0;

            // Percentage Change
            let percentageChange = 0;
            if (previousTotal > 0) {
                percentageChange = ((currentTotal - previousTotal) / previousTotal) * 100;
            } else if (currentTotal > 0) {
                percentageChange = 100; // 100% increase if previous was 0
            }

            // Top Category for Suggestion
            const topCategoryResult = await db.getAllAsync<{ name: string, total: number }>(
                `SELECT c.name, SUM(t.amount) as total
                 FROM transactions t
                 JOIN categories c ON t.category_id = c.id
                 WHERE t.user_id = ? AND t.type = 'expense' AND t.date >= ?
                 GROUP BY c.id
                 ORDER BY total DESC
                 LIMIT 1`,
                [userId, currentPeriodStart]
            );

            const topCategory = topCategoryResult.length > 0 ? topCategoryResult[0].name : null;

            // New Metrics Calculation
            const dailyAverage = currentTotal / days;
            const projectedTotal = dailyAverage * 30; // Project to a standard 30-day month

            // Largest Transaction
            const largestTxResult = await db.getFirstAsync<{ description: string, amount: number, date: string, category_name: string, category_icon: string, category_color: string }>(
                `SELECT t.description, t.amount, t.date, c.name as category_name, c.icon as category_icon, c.color as category_color
                 FROM transactions t
                 JOIN categories c ON t.category_id = c.id
                 WHERE t.user_id = ? AND t.type = 'expense' AND t.date >= ?
                 ORDER BY t.amount DESC
                 LIMIT 1`,
                [userId, currentPeriodStart]
            );

            const largestTransaction = largestTxResult ? {
                name: largestTxResult.description,
                amount: largestTxResult.amount,
                date: largestTxResult.date,
                category_name: largestTxResult.category_name,
                category_icon: largestTxResult.category_icon,
                category_color: largestTxResult.category_color
            } : null;

            // Dynamic Trend Message
            let trendMessage = "";
            const absChange = Math.abs(percentageChange);

            if (percentageChange <= -5) {
                const messages = [
                    `Great job! You cut spending by ${absChange.toFixed(1)}%.`,
                    `Spending is down ${absChange.toFixed(1)}%. Keep it up!`,
                    `You saved ${absChange.toFixed(1)}% compared to last period.`
                ];
                trendMessage = messages[Math.floor(Math.random() * messages.length)];
            } else if (percentageChange >= 5) {
                const messages = [
                    `Heads up: Spending jumped by ${absChange.toFixed(1)}%.`,
                    `You're spending ${absChange.toFixed(1)}% more than usual.`,
                    `Alert: Comparison shows a ${absChange.toFixed(1)}% increase.`
                ];
                trendMessage = messages[Math.floor(Math.random() * messages.length)];
            } else {
                const messages = [
                    `Your spending is stable (±${absChange.toFixed(1)}%).`,
                    `Consistent spending habits observed.`,
                    `You're on track with previous spending.`
                ];
                trendMessage = messages[Math.floor(Math.random() * messages.length)];
            }

            // Dynamic Suggestion
            let suggestion = "";
            if (topCategory) {
                const messages = [
                    `Most of your money went to ${topCategory}.`,
                    `Consider setting a budget for ${topCategory} to save more.`,
                    `Check for unused subscriptions in ${topCategory}.`,
                    `Your highest expense is in ${topCategory}. Review recent transacations.`
                ];
                suggestion = messages[Math.floor(Math.random() * messages.length)];
            } else {
                suggestion = "Track more expenses to get personalized insights.";
            }

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
