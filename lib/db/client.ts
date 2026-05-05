import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { normalizeDatabaseUrl } from "@/lib/db/normalize-database-url";
import * as schema from "@/lib/db/schema";

let client: postgres.Sql | null = null;
let drizzleInstance: PostgresJsDatabase<typeof schema> | null = null;

/** PostgreSQL URL (Neon / Supabase / Railway / RDS / local). Omit to skip DB archiving. */
export function getOrdersDb(): PostgresJsDatabase<typeof schema> | null {
  const url = normalizeDatabaseUrl(process.env.DATABASE_URL);
  if (!url) return null;
  if (!drizzleInstance) {
    client = postgres(url, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    drizzleInstance = drizzle(client, { schema });
  }
  return drizzleInstance;
}
