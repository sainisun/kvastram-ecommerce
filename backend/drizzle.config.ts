/// <reference types="node" />
import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
    schema: './src/db/schema.ts',
    out: './drizzle',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres.qsnradlhidpbeopahztr:WUaXy0ENSM59wCiS@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
    },
    verbose: true,
    strict: true,
} satisfies Config;
