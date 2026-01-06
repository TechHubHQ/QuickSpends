import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import postgres from 'postgres';

dotenv.config();

const dbUrl = process.env.EXPO_SUPABASE_DB_URL || process.env.EXPO_PUBLIC_SUPABASE_DB_URL;

if (!dbUrl) {
    console.error('Error: EXPO_SUPABASE_DB_URL or EXPO_PUBLIC_SUPABASE_DB_URL is not defined in .env');
    process.exit(1);
}

const sql = postgres(dbUrl);

async function setup() {
    console.log('🚀 Starting Database Setup...');

    try {
        // 1. Read Migration File
        const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20240106_initial_schema.sql');
        if (!fs.existsSync(migrationPath)) {
            console.error(`Migration file not found at ${migrationPath}`);
            process.exit(1);
        }
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        // 2. Execute Migration
        console.log('📜 Executing initial schema migration...');
        // We split by ';' and execute each command to avoid issues with some postgres drivers 
        // but the `postgres` package can handle multi-statement scripts if configured or if simple.
        // However, it's safer to execute it as one big query if it's a script.
        await sql.unsafe(migrationSql);
        console.log('✅ Schema migration completed.');

        // 3. Seed Default Categories
        console.log('🌱 Seeding default categories...');
        const defaultCategories = [
            { name: 'Housing', icon: 'home', color: '#FF5733', type: 'expense' },
            { name: 'Transportation', icon: 'car', color: '#33FF57', type: 'expense' },
            { name: 'Food', icon: 'food', color: '#3357FF', type: 'expense' },
            { name: 'Utilities', icon: 'flash', color: '#F333FF', type: 'expense' },
            { name: 'Insurance', icon: 'shield-check', color: '#33FFF3', type: 'expense' },
            { name: 'Healthcare', icon: 'medical-bag', color: '#FF3333', type: 'expense' },
            { name: 'Entertainment', icon: 'movie', color: '#33FF33', type: 'expense' },
            { name: 'Shopping', icon: 'cart', color: '#3333FF', type: 'expense' },
            { name: 'Salary', icon: 'cash-multiple', color: '#4CAF50', type: 'income' },
            { name: 'Freelance', icon: 'laptop', color: '#2196F3', type: 'income' },
            { name: 'Investment', icon: 'trending-up', color: '#FFC107', type: 'income' },
            { name: 'Opening Balance', icon: 'wallet-plus', color: '#9C27B0', type: 'income' }
        ];

        for (const cat of defaultCategories) {
            await sql`
        INSERT INTO categories (name, icon, color, type, is_default, user_id)
        VALUES (${cat.name}, ${cat.icon}, ${cat.color}, ${cat.type}, true, NULL)
        ON CONFLICT (id) DO NOTHING
      `;
        }
        console.log('✅ Default categories seeded.');

        console.log('🏁 Database Setup Finished Successfully!');
    } catch (error) {
        console.error('❌ Error during database setup:', error);
    } finally {
        await sql.end();
    }
}

setup();
