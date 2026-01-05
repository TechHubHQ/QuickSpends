import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';
import { DEFAULT_CATEGORIES } from './defaultCategories';

// Helper to generate UUIDs
export const generateUUID = () => Crypto.randomUUID();

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async () => {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('qs.db');
  return db;
};

export const initializeDatabase = async () => {
  const database = await getDatabase();

  await database.execAsync(`
    PRAGMA foreign_keys = ON;

    -- Users Table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      avatar TEXT
    );

    -- Categories Table
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      parent_id TEXT,
      is_default BOOLEAN DEFAULT 0,
      FOREIGN KEY (parent_id) REFERENCES categories (id)
    );

    -- Accounts Table
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('bank', 'cash', 'card')) NOT NULL,
      card_type TEXT CHECK(card_type IN ('credit', 'debit')),
      credit_limit REAL,
      balance REAL DEFAULT 0,
      currency TEXT DEFAULT 'INR',
      account_number_last_4 TEXT,
      is_active BOOLEAN DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    -- Groups Table
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      color TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      trip_id TEXT,
      FOREIGN KEY (created_by) REFERENCES users (id),
      FOREIGN KEY (trip_id) REFERENCES trips (id)
    );

    -- Group Members Table
    CREATE TABLE IF NOT EXISTS group_members (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      status TEXT DEFAULT 'joined', -- 'invited', 'joined'
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    -- Trips Table
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      user_id TEXT NOT NULL,
      group_id TEXT,
      budget_amount REAL,
      start_date DATETIME,
      end_date DATETIME,
      image_url TEXT,
      base_currency TEXT DEFAULT 'INR',
      locations TEXT,
      trip_mode TEXT CHECK(trip_mode IN ('single', 'multi')) DEFAULT 'single',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (group_id) REFERENCES groups (id)
    );

    -- Recurring Configs Table
    CREATE TABLE IF NOT EXISTS recurring_configs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      category_id TEXT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')) NOT NULL,
      start_date DATETIME NOT NULL,
      end_date DATETIME,
      last_executed DATETIME,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (account_id) REFERENCES accounts (id),
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );

    -- Transactions Table
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      category_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense', 'transfer')) NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      receipt_url TEXT,
      group_id TEXT,
      trip_id TEXT,
      recurring_id TEXT,
      to_account_id TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (account_id) REFERENCES accounts (id),
      FOREIGN KEY (category_id) REFERENCES categories (id),
      FOREIGN KEY (group_id) REFERENCES groups (id),
      FOREIGN KEY (trip_id) REFERENCES trips (id),
      FOREIGN KEY (recurring_id) REFERENCES recurring_configs (id),
      FOREIGN KEY (to_account_id) REFERENCES accounts (id)
    );

    -- Splits Table
    CREATE TABLE IF NOT EXISTS splits (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT CHECK(status IN ('pending', 'settled')) DEFAULT 'pending',
      FOREIGN KEY (transaction_id) REFERENCES transactions (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
    -- Budgets Table
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      amount REAL NOT NULL,
      period TEXT CHECK(period IN ('monthly', 'yearly')) DEFAULT 'monthly',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );

    -- Notifications Table
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL, -- 'invite', 'alert', 'info'
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT, -- JSON string
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  await runMigrations(database);
  await seedCategories(database);
};

const runMigrations = async (db: SQLite.SQLiteDatabase) => {
  try {
    // Add created_at to groups if missing
    await db.execAsync(`
            PRAGMA foreign_keys=OFF;
            ALTER TABLE groups ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
            ALTER TABLE groups ADD COLUMN description TEXT;
            ALTER TABLE groups ADD COLUMN icon TEXT;
            ALTER TABLE groups ADD COLUMN color TEXT;
            ALTER TABLE groups ADD COLUMN color TEXT;
            ALTER TABLE groups ADD COLUMN trip_id TEXT REFERENCES trips(id);
            ALTER TABLE users ADD COLUMN avatar TEXT;
        `).catch(() => { });

    // Basic check for group_members schema mismatch (missing ID or joined_at)
    // Since SQLite ALTER cannot easily add Primary Key, if group_members is missing ID, we might need to recreate it.
    // For development simplicity, we will try to add columns if they don't exist, but 'id' primary key constraint 
    // cannot be added via ALTER. If the table was created with the old schema, it has (group_id, user_id) PK.
    // If we need 'id' PK, we must recreate the table.

    const tableInfo = await db.getAllAsync<{ name: string }>("PRAGMA table_info(group_members)");
    const hasId = tableInfo.some(c => c.name === 'id');
    const hasStatus = tableInfo.some(c => c.name === 'status');

    if (!hasId) {

      await db.execAsync(`
                DROP TABLE IF EXISTS group_members;
                CREATE TABLE group_members (
                  id TEXT PRIMARY KEY,
                  group_id TEXT NOT NULL,
                  user_id TEXT NOT NULL,
                  role TEXT DEFAULT 'member',
                  status TEXT DEFAULT 'joined', -- 'invited', 'joined'
                  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (group_id) REFERENCES groups (id),
                  FOREIGN KEY (user_id) REFERENCES users (id)
                );
             `);
    } else if (!hasStatus) {
      await db.execAsync(`ALTER TABLE group_members ADD COLUMN status TEXT DEFAULT 'joined';`).catch(() => { });
    }

    // Migration for trips table
    const tripTableInfo = await db.getAllAsync<{ name: string }>("PRAGMA table_info(trips)");
    if (!tripTableInfo.some(c => c.name === 'locations')) {
      await db.execAsync(`ALTER TABLE trips ADD COLUMN locations TEXT;`).catch(() => { });
    }
    if (!tripTableInfo.some(c => c.name === 'trip_mode')) {
      await db.execAsync(`ALTER TABLE trips ADD COLUMN trip_mode TEXT DEFAULT 'single';`).catch(() => { });
    }
    if (!tripTableInfo.some(c => c.name === 'created_at')) {
      await db.execAsync(`ALTER TABLE trips ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;`).catch(() => { });
    }

    // Migration for Notification System
    const recurringTableInfo = await db.getAllAsync<{ name: string }>("PRAGMA table_info(recurring_configs)");
    if (!recurringTableInfo.some(c => c.name === 'last_notified_at')) {
      await db.execAsync(`ALTER TABLE recurring_configs ADD COLUMN last_notified_at DATETIME;`).catch(() => { });
    }

    const budgetTableInfo = await db.getAllAsync<{ name: string }>("PRAGMA table_info(budgets)");
    if (!budgetTableInfo.some(c => c.name === 'alert_month')) {
      await db.execAsync(`ALTER TABLE budgets ADD COLUMN alert_month TEXT;`).catch(() => { });
    }

    // Trips alert_sent
    if (!tripTableInfo.some(c => c.name === 'alert_sent')) {
      await db.execAsync(`ALTER TABLE trips ADD COLUMN alert_sent BOOLEAN DEFAULT 0;`).catch(() => { });
    }

    // Accounts Low Balance Alert Limit
    const accountTableInfo = await db.getAllAsync<{ name: string }>("PRAGMA table_info(accounts)");
    if (!accountTableInfo.some(c => c.name === 'last_low_balance_alert')) {
      await db.execAsync(`ALTER TABLE accounts ADD COLUMN last_low_balance_alert DATETIME;`).catch(() => { });
    }

    // Splits Alert Sent
    const splitTableInfo = await db.getAllAsync<{ name: string }>("PRAGMA table_info(splits)");
    if (!splitTableInfo.some(c => c.name === 'alert_sent')) {
      await db.execAsync(`ALTER TABLE splits ADD COLUMN alert_sent BOOLEAN DEFAULT 0;`).catch(() => { });
    }

    // Users Monthly Summary Tracker
    const userTableInfo = await db.getAllAsync<{ name: string }>("PRAGMA table_info(users)");
    if (!userTableInfo.some(c => c.name === 'last_monthly_summary')) {
      await db.execAsync(`ALTER TABLE users ADD COLUMN last_monthly_summary TEXT;`).catch(() => { });
    }

    // Categories is_default
    const categoryTableInfo = await db.getAllAsync<{ name: string }>("PRAGMA table_info(categories)");
    if (!categoryTableInfo.some(c => c.name === 'is_default')) {
      await db.execAsync(`ALTER TABLE categories ADD COLUMN is_default BOOLEAN DEFAULT 0;`).catch(() => { });
      // Update existing default categories to be default
      // This is a bit tricky since we don't know for sure which were default, but we can re-run seedCategories or specific update
      // For now, let's assume seedCategories handles it if we modify it.
    }

  } catch (error) {

  }
};

const seedCategories = async (database: SQLite.SQLiteDatabase) => {
  for (const cat of DEFAULT_CATEGORIES) {
    // 1. Check/Insert Parent Category
    let parentId = '';
    const existingParent = await database.getFirstAsync<{ id: string }>(
      'SELECT id FROM categories WHERE name = ? AND parent_id IS NULL',
      [cat.name]
    );

    if (existingParent) {
      parentId = existingParent.id;
      // Ensure it's marked as default if it exists
      await database.runAsync('UPDATE categories SET is_default = 1 WHERE id = ?', [parentId]);
    } else {
      parentId = generateUUID();
      await database.runAsync(
        'INSERT INTO categories (id, name, icon, color, type, is_default) VALUES (?, ?, ?, ?, ?, 1)',
        [parentId, cat.name, cat.icon, cat.color, cat.type]
      );
    }

    // 2. Check/Insert Subcategories
    if (cat.subCategories && cat.subCategories.length > 0) {
      for (const sub of cat.subCategories) {
        const existingSub = await database.getFirstAsync<{ id: string }>(
          'SELECT id FROM categories WHERE name = ? AND parent_id = ?',
          [sub.name, parentId]
        );

        if (!existingSub) {
          await database.runAsync(
            'INSERT INTO categories (id, name, icon, color, type, parent_id, is_default) VALUES (?, ?, ?, ?, ?, ?, 1)',
            [generateUUID(), sub.name, sub.icon, cat.color, cat.type, parentId]
          );
        } else {
          await database.runAsync('UPDATE categories SET is_default = 1 WHERE id = ?', [existingSub.id]);
        }
      }
    }
  }
};


