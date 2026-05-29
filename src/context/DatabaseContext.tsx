import React, { createContext, useContext, useState, useEffect } from "react";
import { getDB, resetDatabase } from "../../backend/db/engine";
import { 
    Account, Category, Transaction, Budget, Bill, FinancialGoal, Investment 
} from "../../backend/domain/types";
import { getAccounts, createAccount, deleteAccount } from "../../backend/domain/accounts/accounts.service";
import { getCategories, createCategory } from "../../backend/domain/categories/categories.service";
import { getTransactions, createTransaction, deleteTransaction } from "../../backend/domain/transactions/transactions.service";
import { getBudgets, createBudget, deleteBudget } from "../../backend/domain/budgets/budgets.service";
import { getBills, createBill, payBill, deleteBill } from "../../backend/domain/bills/bills.service";
import { getGoals, createGoal, addGoalContribution, deleteGoal } from "../../backend/domain/goals/goals.service";
import { getInvestments, createInvestment, updateInvestmentValue, deleteInvestment } from "../../backend/domain/investments/investments.service";
import { getDashboardSummary, DashboardSummary } from "../../backend/domain/dashboard/dashboard.service";

interface DatabaseContextType {
    isLoading: boolean;
    accounts: Account[];
    categories: Category[];
    transactions: any[];
    budgets: any[];
    bills: any[];
    goals: any[];
    investments: Investment[];
    dashboard: DashboardSummary | null;
    refreshData: () => Promise<void>;
    
    // Wrapped operations that automatically trigger state refresh
    handleAddTransaction: (txn: Omit<Transaction, "id" | "created_at">, link?: { type: any; id: number }) => Promise<number>;
    handleDeleteTransaction: (id: number) => Promise<void>;
    
    handleAddAccount: (acct: Omit<Account, "id" | "created_at">) => Promise<number>;
    handleDeleteAccount: (id: number) => Promise<void>;
    
    handleAddCategory: (cat: Omit<Category, "id">) => Promise<number>;
    
    handleAddBudget: (b: Omit<Budget, "id" | "used_amount">) => Promise<number>;
    handleDeleteBudget: (id: number) => Promise<void>;
    
    handleAddBill: (bill: Omit<Bill, "id" | "is_paid" | "transaction_id" | "created_at">) => Promise<number>;
    handlePayBill: (billId: number, accountId: number, date: string) => Promise<number>;
    handleDeleteBill: (id: number) => Promise<void>;
    
    handleAddGoal: (goal: Omit<FinancialGoal, "id" | "current_amount" | "created_at">) => Promise<number>;
    handleDepositGoal: (goalId: number, accountId: number, amount: number, date: string) => Promise<number>;
    handleDeleteGoal: (id: number) => Promise<void>;
    
    handleAddInvestment: (inv: Omit<Investment, "id" | "created_at">) => Promise<number>;
    handleUpdateInvestmentValue: (id: number, val: number) => Promise<void>;
    handleDeleteInvestment: (id: number) => Promise<void>;
    
    handleResetAllData: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [budgets, setBudgets] = useState<any[]>([]);
    const [bills, setBills] = useState<any[]>([]);
    const [goals, setGoals] = useState<any[]>([]);
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);

    const refreshData = async () => {
        try {
            console.log("Refreshing database states...");
            const [
                accts, cats, txns, budgs, bls, gls, invs, dash
            ] = await Promise.all([
                getAccounts(),
                getCategories(),
                getTransactions(),
                getBudgets(),
                getBills(),
                getGoals(),
                getInvestments(),
                getDashboardSummary()
            ]);

            setAccounts(accts);
            setCategories(cats);
            setTransactions(txns);
            setBudgets(budgs);
            setBills(bls);
            setGoals(gls);
            setInvestments(invs);
            setDashboard(dash);
        } catch (error) {
            console.error("Error refreshing dashboard state:", error);
        }
    };

    // Initialize Database on App Launch
    useEffect(() => {
        let active = true;
        const init = async () => {
            try {
                // Boots SQLite database, applies schema, seeds default tables
                await getDB();
                if (active) {
                    await refreshData();
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Failed to bootstrap database context:", err);
                if (active) {
                    setIsLoading(false);
                }
            }
        };

        init();
        return () => { active = false; };
    }, []);

    // Operations Wrapper (DRY design)
    const handleAddTransaction = async (txn: Omit<Transaction, "id" | "created_at">, link?: { type: any; id: number }) => {
        const id = await createTransaction(txn, link);
        await refreshData();
        return id;
    };

    const handleDeleteTransaction = async (id: number) => {
        await deleteTransaction(id);
        await refreshData();
    };

    const handleAddAccount = async (acct: Omit<Account, "id" | "created_at">) => {
        const id = await createAccount(acct);
        await refreshData();
        return id;
    };

    const handleDeleteAccount = async (id: number) => {
        await deleteAccount(id);
        await refreshData();
    };

    const handleAddCategory = async (cat: Omit<Category, "id">) => {
        const id = await createCategory(cat);
        await refreshData();
        return id;
    };

    const handleAddBudget = async (b: Omit<Budget, "id" | "used_amount">) => {
        const id = await createBudget(b);
        await refreshData();
        return id;
    };

    const handleDeleteBudget = async (id: number) => {
        await deleteBudget(id);
        await refreshData();
    };

    const handleAddBill = async (bill: Omit<Bill, "id" | "is_paid" | "transaction_id" | "created_at">) => {
        const id = await createBill(bill);
        await refreshData();
        return id;
    };

    const handlePayBill = async (billId: number, accountId: number, date: string) => {
        const txnId = await payBill(billId, accountId, date);
        await refreshData();
        return txnId;
    };

    const handleDeleteBill = async (id: number) => {
        await deleteBill(id);
        await refreshData();
    };

    const handleAddGoal = async (goal: Omit<FinancialGoal, "id" | "current_amount" | "created_at">) => {
        const id = await createGoal(goal);
        await refreshData();
        return id;
    };

    const handleDepositGoal = async (goalId: number, accountId: number, amount: number, date: string) => {
        const txnId = await addGoalContribution(goalId, accountId, amount, date);
        await refreshData();
        return txnId;
    };

    const handleDeleteGoal = async (id: number) => {
        await deleteGoal(id);
        await refreshData();
    };

    const handleAddInvestment = async (inv: Omit<Investment, "id" | "created_at">) => {
        const id = await createInvestment(inv);
        await refreshData();
        return id;
    };

    const handleUpdateInvestmentValue = async (id: number, val: number) => {
        await updateInvestmentValue(id, val);
        await refreshData();
    };

    const handleDeleteInvestment = async (id: number) => {
        await deleteInvestment(id);
        await refreshData();
    };

    const handleResetAllData = async () => {
        setIsLoading(true);
        await resetDatabase();
        await refreshData();
        setIsLoading(false);
    };

    return (
        <DatabaseContext.Provider value={{
            isLoading,
            accounts,
            categories,
            transactions,
            budgets,
            bills,
            goals,
            investments,
            dashboard,
            refreshData,
            handleAddTransaction,
            handleDeleteTransaction,
            handleAddAccount,
            handleDeleteAccount,
            handleAddCategory,
            handleAddBudget,
            handleDeleteBudget,
            handleAddBill,
            handlePayBill,
            handleDeleteBill,
            handleAddGoal,
            handleDepositGoal,
            handleDeleteGoal,
            handleAddInvestment,
            handleUpdateInvestmentValue,
            handleDeleteInvestment,
            handleResetAllData
        }}>
            {children}
        </DatabaseContext.Provider>
    );
};

export const useDatabase = () => {
    const context = useContext(DatabaseContext);
    if (!context) {
        throw new Error("useDatabase must be used within a DatabaseProvider");
    }
    return context;
};
