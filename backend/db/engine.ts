import * as SQLite from "expo-sqlite";
import { loadQsSchema } from "./schemaReader";

let _db: SQLite.SQLiteDatabase | null = null;
let _initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Seeds default accounts if none exist
 */
const seedDefaultAccounts = async (db: SQLite.SQLiteDatabase): Promise<void> => {
    console.log("Seeding default accounts...");
    // Check if accounts exist
    const countResult = await db.getFirstAsync<{ count: number }>("SELECT count(*) as count FROM accounts;");
    if (countResult && countResult.count > 0) {
        return;
    }

    // Insert Cash Wallet
    await db.runAsync(
        "INSERT INTO accounts (acct_name, bank_name, type, balance, credit_limit) VALUES (?, ?, ?, ?, ?);",
        ["Cash Wallet", "Physical Cash", "cash", 500, 0]
    );

    // Insert Main Bank Account
    await db.runAsync(
        "INSERT INTO accounts (acct_name, bank_name, type, balance, credit_limit) VALUES (?, ?, ?, ?, ?);",
        ["Checking Account", "Chase Bank", "debit", 2500, 0]
    );

    // Insert Credit Card
    await db.runAsync(
        "INSERT INTO accounts (acct_name, bank_name, type, balance, credit_limit) VALUES (?, ?, ?, ?, ?);",
        ["Visa Credit Card", "Capital One", "credit", 0, 5000]
    );
};

/**
 * Seeds default categories if none exist
 */
const seedDefaultCategories = async (db: SQLite.SQLiteDatabase): Promise<void> => {
    console.log("Seeding default categories...");
    // Check if categories exist
    const countResult = await db.getFirstAsync<{ count: number }>("SELECT count(*) as count FROM categories;");
    if (countResult && countResult.count > 0) {
        return;
    }

    const defaultCategories: { name: string; parent_id: number | null; type: 'income' | 'expense' | 'transfer' }[] = [
        // Income
        { name: "Salary", parent_id: null, type: "income" },
        { name: "Freelance", parent_id: null, type: "income" },
        { name: "Investments Income", parent_id: null, type: "income" },
        { name: "Other Income", parent_id: null, type: "income" },
        
        // Expenses
        { name: "Food & Dining", parent_id: null, type: "expense" },
        { name: "Rent & Utilities", parent_id: null, type: "expense" },
        { name: "Transport & Fuel", parent_id: null, type: "expense" },
        { name: "Shopping", parent_id: null, type: "expense" },
        { name: "Entertainment & Leisure", parent_id: null, type: "expense" },
        { name: "Health & Medical", parent_id: null, type: "expense" },
        { name: "Education", parent_id: null, type: "expense" },
        { name: "Travel", parent_id: null, type: "expense" },
        { name: "Miscellaneous", parent_id: null, type: "expense" },

        // Transfers
        { name: "Account Transfer", parent_id: null, type: "transfer" },
    ];

    for (const cat of defaultCategories) {
        await db.runAsync(
            "INSERT INTO categories (name, parent_id, type) VALUES (?, ?, ?);",
            [cat.name, cat.parent_id, cat.type]
        );
    }
};

/**
 * Resets the entire database by dropping all tables and re-initializing them
 */
export const resetDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
    console.log("Resetting database...");
    const db = await SQLite.openDatabaseAsync("quickspends.db");
    
    // Disable foreign keys temporarily during drop
    await db.execAsync("PRAGMA foreign_keys = OFF;");
    
    const tables = [
        "monthly_plan_items",
        "monthly_plans",
        "trips",
        "insurance_policies",
        "investments",
        "financial_goals",
        "recurring_transactions",
        "budgets",
        "bills",
        "transaction_links",
        "transactions",
        "categories",
        "accounts",
        "user_settings"
    ];

    for (const table of tables) {
        await db.execAsync(`DROP TABLE IF EXISTS ${table};`);
    }
    
    await db.execAsync("PRAGMA foreign_keys = ON;");
    
    // Apply Schema
    const schema = await loadQsSchema();
    await db.execAsync(schema);
    
    // Seed
    await seedDefaultCategories(db);
    await seedDefaultAccounts(db);
    
    // Set a flag indicating DB is initialized
    await db.runAsync(
        "INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?);",
        ["db_initialized", "true"]
    );
    
    _db = db;
    return db;
};

/**
 * Gets or initializes the SQLiteDatabase singleton instance
 */
export const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
    if (_db) return _db;
    if (_initPromise) return _initPromise;

    _initPromise = (async () => {
        try {
            console.log("Opening SQLite Database 'quickspends.db'...");
            const db = await SQLite.openDatabaseAsync("quickspends.db");
            
            // Enable foreign keys for referential integrity
            await db.execAsync("PRAGMA foreign_keys = ON;");
            
            // Check if database schema needs to be applied
            let needsInit = false;
            try {
                const checkResult = await db.getFirstAsync<{ count: number }>(
                    "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='user_settings';"
                );
                needsInit = !checkResult || checkResult.count === 0;
            } catch (err) {
                needsInit = true;
            }

            if (needsInit) {
                console.log("Initializing database schema from QSSchema.sql...");
                const schema = await loadQsSchema();
                await db.execAsync(schema);
                console.log("Schema applied successfully.");
                
                await seedDefaultCategories(db);
                await seedDefaultAccounts(db);
                
                // Save setting to indicate it's initialized
                await db.runAsync(
                    "INSERT INTO user_settings (key, value) VALUES (?, ?);",
                    ["db_initialized", "true"]
                );
            } else {
                console.log("Database already initialized.");
                // Ensure default categories and accounts exist just in case
                await seedDefaultCategories(db);
                await seedDefaultAccounts(db);
            }

            _db = db;
            return db;
        } catch (error) {
            console.error("Database initialization failed:", error);
            _initPromise = null;
            throw error;
        }
    })();

    return _initPromise;
};
