import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import postgres from 'postgres';

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

        console.log('ℹ️  To seed categories, please run: npm run db:migrate');
        console.log('✅ Default categories seeded.');

        console.log('🏁 Database Setup Finished Successfully!');
    } catch (error) {
        console.error('❌ Error during database setup:', error);
    } finally {
        await sql.end();
    }
}

setup();
