import "dotenv/config";
import { normalizeDatabaseUrl } from "./lib/db/normalize-database-url";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: normalizeDatabaseUrl(process.env.DATABASE_URL),
  },
});
