import { getDB } from "../../db/engine";
import { Bill } from "../types";
import { createTransaction } from "../transactions/transactions.service";

export interface BillWithDetails extends Bill {
    category_name?: string;
    account_name?: string;
}

export const getBills = async (): Promise<BillWithDetails[]> => {
    const db = await getDB();
    return db.getAllAsync<BillWithDetails>(`
        SELECT b.*, c.name as category_name, a.acct_name as account_name
        FROM bills b
        LEFT JOIN categories c ON b.category_id = c.id
        LEFT JOIN accounts a ON b.account_id = a.id
        ORDER BY b.is_paid ASC, b.due_date ASC;
    `);
};

export const createBill = async (bill: Omit<Bill, "id" | "is_paid" | "transaction_id" | "created_at">): Promise<number> => {
    const db = await getDB();
    const result = await db.runAsync(
        "INSERT INTO bills (name, amount, category_id, account_id, due_date, is_paid, transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?);",
        [bill.name, bill.amount, bill.category_id, bill.account_id, bill.due_date, 0, null]
    );
    return result.lastInsertRowId;
};

export const deleteBill = async (id: number): Promise<void> => {
    const db = await getDB();
    await db.runAsync("DELETE FROM bills WHERE id = ?;", [id]);
};

/**
 * Pay a bill:
 * 1. Creates an expense transaction in the selected account.
 * 2. Updates the bill as paid (is_paid = 1).
 * 3. Associates the transaction_id with the bill.
 */
export const payBill = async (billId: number, accountId: number, paymentDate: string): Promise<number> => {
    const db = await getDB();
    
    // Fetch bill details
    const bill = await db.getFirstAsync<Bill>("SELECT * FROM bills WHERE id = ?;", [billId]);
    if (!bill) throw new Error("Bill not found.");
    if (bill.is_paid === 1) throw new Error("Bill is already paid.");

    // Create an expense transaction
    const txnId = await createTransaction({
        account_id: accountId,
        amount: bill.amount,
        type: "expense",
        label: "need", // Bills are generally needs
        category_id: bill.category_id,
        note: `Auto-payment for Bill: ${bill.name}`,
        transaction_date: paymentDate
    });

    // Update bill
    await db.runAsync(
        "UPDATE bills SET is_paid = 1, transaction_id = ?, account_id = ? WHERE id = ?;",
        [txnId, accountId, billId]
    );

    return txnId;
};
