import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

// `prepare: false` is required for Supabase's transaction pooler (port 6543) —
// pgbouncer in transaction mode doesn't support prepared statements.
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client);