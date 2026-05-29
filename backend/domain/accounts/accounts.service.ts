import { getDB } from "../../db/engine";
import { Account } from "../types";

export const getAccounts = async (): Promise<Account[]> => {
    const db = await getDB();
    return db.getAllAsync<Account>("SELECT * FROM accounts ORDER BY type ASC, acct_name ASC;");
};

export const createAccount = async (account: Omit<Account, "id" | "created_at">): Promise<number> => {
    const db = await getDB();
    const result = await db.runAsync(
        "INSERT INTO accounts (acct_name, bank_name, type, balance, credit_limit) VALUES (?, ?, ?, ?, ?);",
        [account.acct_name, account.bank_name, account.type, account.balance, account.credit_limit]
    );
    return result.lastInsertRowId;
};

export const updateAccount = async (account: Account): Promise<void> => {
    if (!account.id) throw new Error("Account ID is required for update.");
    const db = await getDB();
    await db.runAsync(
        "UPDATE accounts SET acct_name = ?, bank_name = ?, type = ?, balance = ?, credit_limit = ? WHERE id = ?;",
        [account.acct_name, account.bank_name, account.type, account.balance, account.credit_limit, account.id]
    );
};

export const deleteAccount = async (id: number): Promise<void> => {
    const db = await getDB();
    // Note: Due to cascade/checks, if there are transactions, deleting might fail or orphan.
    // In our UI we might show a warning, but SQLite foreign key checks are active.
    await db.runAsync("DELETE FROM accounts WHERE id = ?;", [id]);
};
