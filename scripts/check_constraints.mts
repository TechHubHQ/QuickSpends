import * as dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config();

const dbUrl = process.env.EXPO_SUPABASE_DB_URL || process.env.EXPO_PUBLIC_SUPABASE_DB_URL;

if (!dbUrl) {
    console.error('Error: DB URL not found in .env');
    process.exit(1);
}

const sql = postgres(dbUrl);

async function checkConstraint() {
    try {
        const constraints = await sql`
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE n.nspname = 'public'
            AND conrelid::regclass::text IN ('categories', 'transactions');
        `;
        console.log('Constraints:', constraints);
    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}

checkConstraint();
