-- Customers + extended order fields for admin order / CRM views.
-- Run: psql "$DATABASE_URL" -f drizzle/0002_customers_orders_admin.sql
-- Or: npm run db:push (with DATABASE_URL)

CREATE TABLE IF NOT EXISTS "customers" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" varchar(320) NOT NULL,
  "full_name" varchar(280),
  "phone" varchar(48),
  "notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "customers_email_unique" UNIQUE ("email")
);

CREATE INDEX IF NOT EXISTS "customers_created_at_idx" ON "customers" ("created_at");

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_id" integer;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fulfillment_status" varchar(48) DEFAULT 'unfulfilled';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "internal_note" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pay_link_code" varchar(16);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_name" varchar(240);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_phone" varchar(48);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_line1" varchar(280);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_line2" varchar(280);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_city" varchar(120);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_postal" varchar(48);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_country" varchar(24);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_name" varchar(240);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_phone" varchar(48);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_line1" varchar(280);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_line2" varchar(280);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_city" varchar(120);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_postal" varchar(48);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_country" varchar(24);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cart_lines" jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_customer_id_customers_id_fk'
  ) THEN
    ALTER TABLE "orders"
      ADD CONSTRAINT "orders_customer_id_customers_id_fk"
      FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "orders_customer_id_idx" ON "orders" ("customer_id");
CREATE INDEX IF NOT EXISTS "orders_fulfillment_status_idx" ON "orders" ("fulfillment_status");
