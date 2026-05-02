import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";

let client: postgres.Sql | null = null;
let drizzleInstance: ReturnType<typeof drizzle> | null = null;

/** PostgreSQL URL (Neon / Supabase / Railway / RDS / local). Omit to skip DB archiving. */
export function getOrdersDb(): ReturnType<typeof drizzle> | null {
  const url = process.env.DATABASE_URL?.trim();
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
