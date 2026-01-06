import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
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

async function migrate() {
    console.log('🚀 Starting Safe Migrations...');

    try {
        // 1. Create _migrations table if it doesn't exist
        const migrationsTableExists = await sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = '_migrations'
            );
        `;

        if (!migrationsTableExists[0].exists) {
            console.log('🆕 Creating _migrations tracking table...');
            await sql`
                CREATE TABLE _migrations (
                    id SERIAL PRIMARY KEY,
                    name TEXT UNIQUE NOT NULL,
                    executed_at TIMESTAMPTZ DEFAULT NOW()
                );
                ALTER TABLE _migrations ENABLE ROW LEVEL SECURITY;
            `;

            // If we just created the table but other tables exist, 
            // the initial migration was likely already run (via setup-db.ts)
            const profilesExists = await sql`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'profiles'
                );
            `;

            if (profilesExists[0].exists) {
                console.log('📝 Existing tables detected. Recording initial schema as executed.');
                await sql`
                    INSERT INTO _migrations (name)
                    VALUES ('20240106_initial_schema.sql')
                    ON CONFLICT (name) DO NOTHING
                `;
            }
        }

        // 2. Read migration files
        const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
        if (!fs.existsSync(migrationsDir)) {
            console.error(`Migrations directory not found at ${migrationsDir}`);
            process.exit(1);
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort(); // Run in alphabetical/numerical order

        // 3. Get executed migrations
        const executedMigrations = await sql`SELECT name FROM _migrations`;
        const executedNames = new Set(executedMigrations.map(m => m.name));

        const newMigrations = files.filter(f => !executedNames.has(f));

        if (newMigrations.length === 0) {
            console.log('✅ No new migrations to run.');
            return;
        }

        console.log(`📂 Found ${newMigrations.length} new migration(s).`);

        // 4. Run new migrations
        for (const file of newMigrations) {
            console.log(`📜 Running ${file}...`);
            const filePath = path.join(migrationsDir, file);
            const content = fs.readFileSync(filePath, 'utf8');

            await sql.begin(async (sql) => {
                // Execute migration content
                await sql.unsafe(content);

                // Record migration as executed
                await sql`
                    INSERT INTO _migrations (name)
                    VALUES (${file})
                `;
            });
            console.log(`✅ ${file} completed.`);
        }

        console.log('🏁 All migrations finished successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

migrate();
