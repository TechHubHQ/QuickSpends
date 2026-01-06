import * as dotenv from 'dotenv';
import { dirname } from 'path';
import postgres from 'postgres';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const dbUrl = process.env.EXPO_SUPABASE_DB_URL || process.env.EXPO_PUBLIC_SUPABASE_DB_URL;

if (!dbUrl) {
    console.error('Error: DB URL not found in .env');
    process.exit(1);
}

const sql = postgres(dbUrl);

async function resetDb() {
    console.log('💥 Starting Database Reset... This will DELETE ALL DATA and TABLES!');

    // Wait for 3 seconds to give the user a chance to cancel
    console.log('⏳ Waiting 3 seconds... Press Ctrl+C to cancel.');
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
        await sql.begin(async (sql) => {
            console.log('🗑️  Dropping generic public schema...');

            // 1. Drop the triggers/functions explicitly if they are linked to other schemas (like auth)
            // The trigger 'on_auth_user_created' is on 'auth.users' but calls a function in 'public'.
            // PostgreSQL dependency management should handle this with CASCADE, but let's be safe and explicit 
            // if we want to ensure a clean state especially for things crossing schemas.

            console.log('   Removing auth triggers...');
            await sql`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE`;

            console.log('   Removing functions...');
            await sql`DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE`;

            // 2. Drop the entire public schema
            console.log('   Recreating public schema...');
            await sql`DROP SCHEMA IF EXISTS public CASCADE`;
            await sql`CREATE SCHEMA public`;

            // 3. Restore default permissions
            console.log('   Restoring permissions...');
            await sql`GRANT ALL ON SCHEMA public TO postgres`;
            await sql`GRANT ALL ON SCHEMA public TO public`; // Or specifically to anon/authenticated if needed usage

            // Supabase specific: restore standard grants for the service_role, anon, and authenticated roles
            // These roles usually exist in Supabase projects.
            await sql`GRANT USAGE ON SCHEMA public TO anon`;
            await sql`GRANT USAGE ON SCHEMA public TO authenticated`;
            await sql`GRANT USAGE ON SCHEMA public TO service_role`;

            await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres`;
            await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon`;
            await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated`;
            await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role`;
        });

        console.log('✅ Database reset successfully. The "public" schema is now empty.');
        console.log('ℹ️  Run "npm run db:setup" to re-initialize the database.');

    } catch (error) {
        console.error('❌ Error resetting database:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

resetDb();
