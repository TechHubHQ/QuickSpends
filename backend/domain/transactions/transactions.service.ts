import { getDB } from "../../db/engine";
import { Transaction } from "../types";

export interface TransactionFilter {
    accountId?: number;
    categoryId?: number;
    type?: 'income' | 'expense' | 'transfer';
    label?: 'need' | 'want' | 'saving';
    startDate?: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
    search?: string;
    linkType?: 'trip' | 'goal' | 'investment' | 'insurance';
    linkId?: number;
}

export const getTransactions = async (filter: TransactionFilter = {}): Promise<(Transaction & { category_name?: string; account_name?: string; link_type?: string; link_id?: number })[]> => {
    const db = await getDB();
    
    let query = `
        SELECT t.*, c.name as category_name, a.acct_name as account_name, tl.link_type, tl.link_id
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN accounts a ON t.account_id = a.id
        LEFT JOIN transaction_links tl ON t.id = tl.transaction_id
        WHERE 1=1
    `;
    const params: any[] = [];

    if (filter.accountId !== undefined) {
        query += " AND t.account_id = ?";
        params.push(filter.accountId);
    }
    if (filter.categoryId !== undefined) {
        query += " AND t.category_id = ?";
        params.push(filter.categoryId);
    }
    if (filter.type !== undefined) {
        query += " AND t.type = ?";
        params.push(filter.type);
    }
    if (filter.label !== undefined) {
        query += " AND t.label = ?";
        params.push(filter.label);
    }
    if (filter.startDate !== undefined) {
        query += " AND t.transaction_date >= ?";
        params.push(filter.startDate);
    }
    if (filter.endDate !== undefined) {
        query += " AND t.transaction_date <= ?";
        params.push(filter.endDate);
    }
    if (filter.search !== undefined && filter.search.trim() !== "") {
        query += " AND (t.note LIKE ? OR c.name LIKE ? OR a.acct_name LIKE ?)";
        const term = `%${filter.search.trim()}%`;
        params.push(term, term, term);
    }
    if (filter.linkType !== undefined && filter.linkId !== undefined) {
        query += " AND tl.link_type = ? AND tl.link_id = ?";
        params.push(filter.linkType, filter.linkId);
    }

    query += " ORDER BY t.transaction_date DESC, t.id DESC LIMIT 200;";

    return db.getAllAsync<any>(query, params);
};

export const createTransaction = async (
    transaction: Omit<Transaction, "id" | "created_at">,
    link?: { type: 'trip' | 'goal' | 'investment' | 'insurance'; id: number }
): Promise<number> => {
    const db = await getDB();
    
    // 1. Calculate Account Balance Adjustment
    // Income increases balance. Expense and Transfer decrease balance.
    const adjustment = transaction.type === "income" ? transaction.amount : -transaction.amount;

    // 2. Perform DB execution in a transaction-like sequence (all async)
    // Update account balance
    await db.runAsync(
        "UPDATE accounts SET balance = balance + ? WHERE id = ?;",
        [adjustment, transaction.account_id]
    );

    // Insert transaction
    const result = await db.runAsync(
        `INSERT INTO transactions (account_id, amount, type, label, category_id, note, transaction_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
            transaction.account_id,
            transaction.amount,
            transaction.type,
            transaction.label,
            transaction.category_id,
            transaction.note,
            transaction.transaction_date
        ]
    );
    const transactionId = result.lastInsertRowId;

    // 3. Link transaction if requested
    if (link) {
        await db.runAsync(
            "INSERT INTO transaction_links (transaction_id, link_type, link_id) VALUES (?, ?, ?);",
            [transactionId, link.type, link.id]
        );

        // If linking to a financial goal, update its current saved amount
        if (link.type === "goal") {
            // For a savings goal, an income or expense might affect it. 
            // Usually, saving transactions linked to a goal add to the goals' current amount.
            // If the transaction is an expense/transfer out of checking, it counts as contributing.
            // Let's assume any transaction amount linked to a goal increases its current amount.
            await db.runAsync(
                "UPDATE financial_goals SET current_amount = current_amount + ? WHERE id = ?;",
                [transaction.amount, link.id]
            );
        }
        
        // If linking to an investment, increase invested amount
        if (link.type === "investment") {
            await db.runAsync(
                "UPDATE investments SET invested_amount = invested_amount + ?, current_value = current_value + ? WHERE id = ?;",
                [transaction.amount, transaction.amount, link.id]
            );
        }
    }

    return transactionId;
};

export const deleteTransaction = async (id: number): Promise<void> => {
    const db = await getDB();

    // 1. Fetch transaction first to reverse balances
    const txn = await db.getFirstAsync<Transaction>(
        "SELECT * FROM transactions WHERE id = ?;",
        [id]
    );
    if (!txn) return;

    // 2. Fetch linked data if any
    const link = await db.getFirstAsync<{ link_type: string; link_id: number }>(
        "SELECT link_type, link_id FROM transaction_links WHERE transaction_id = ?;",
        [id]
    );

    // 3. Reverse account balance adjustment
    // Income reversal decreases balance. Expense/transfer reversal increases balance.
    const reversal = txn.type === "income" ? -txn.amount : txn.amount;
    await db.runAsync(
        "UPDATE accounts SET balance = balance + ? WHERE id = ?;",
        [reversal, txn.account_id]
    );

    // 4. Reverse goal/investment amounts if linked
    if (link) {
        if (link.link_type === "goal") {
            await db.runAsync(
                "UPDATE financial_goals SET current_amount = MAX(0, current_amount - ?) WHERE id = ?;",
                [txn.amount, link.link_id]
            );
        }
        if (link.link_type === "investment") {
            await db.runAsync(
                "UPDATE investments SET invested_amount = MAX(0, invested_amount - ?), current_value = MAX(0, current_value - ?) WHERE id = ?;",
                [txn.amount, txn.amount, link.link_id]
            );
        }
    }

    // 5. Delete links and the transaction
    await db.runAsync("DELETE FROM transaction_links WHERE transaction_id = ?;", [id]);
    await db.runAsync("DELETE FROM transactions WHERE id = ?;", [id]);
};
