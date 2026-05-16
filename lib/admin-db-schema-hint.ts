/** Shown when Postgres reports undefined_column (42703) — operator should sync schema to match deployed code. */
export const ADMIN_DB_SCHEMA_HINT =
  "Database schema is out of date. With DATABASE_URL set to this database, run: npm run db:push — or apply drizzle SQL files in order: 0002_customers_orders_admin.sql, 0003_customers_stripe_id.sql, 0004_fulfillment_courier.sql.";
