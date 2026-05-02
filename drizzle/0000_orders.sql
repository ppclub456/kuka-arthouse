-- Run once against your Postgres (Neon / Supabase / Railway / RDS):
--   psql "$DATABASE_URL" -f drizzle/0000_orders.sql
-- Or: npm run db:push (DATABASE_URL required)

CREATE TABLE IF NOT EXISTS "orders" (
  "id" serial PRIMARY KEY NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "stripe_payment_intent_id" varchar(191) NOT NULL,
  "stripe_charge_id" varchar(191),
  "amount_aud_cents" integer NOT NULL,
  "currency" varchar(12) DEFAULT 'aud' NOT NULL,
  "status" varchar(48) NOT NULL,
  "checkout_kind" varchar(48),
  "admin_mode" varchar(48),
  "title" varchar(520),
  "reference" varchar(200),
  "customer_email" varchar(320),
  "product_id" varchar(100),
  "receipt_url" varchar(1200),
  "subtotal_aud_cents" integer,
  "tip_aud_cents" integer,
  "shipping_aud_cents" integer,
  "line_count" integer,
  CONSTRAINT "orders_stripe_payment_intent_id_unique" UNIQUE ("stripe_payment_intent_id")
);

CREATE INDEX IF NOT EXISTS "orders_created_at_desc_idx" ON "orders" ("created_at");
