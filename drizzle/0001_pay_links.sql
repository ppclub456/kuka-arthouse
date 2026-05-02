CREATE TABLE IF NOT EXISTS "pay_links" (
  "code" varchar(10) PRIMARY KEY NOT NULL,
  "amount_aud_cents" integer NOT NULL,
  "title" varchar(520) NOT NULL,
  "reference" varchar(200),
  "mode" varchar(48) NOT NULL,
  "product_id" varchar(100),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "stripe_payment_intent_id" varchar(191) UNIQUE,
  "paid_at" timestamptz,
  "view_count" integer DEFAULT 0 NOT NULL,
  "first_viewed_at" timestamptz,
  "last_viewed_at" timestamptz
);

CREATE INDEX IF NOT EXISTS "pay_links_created_at_idx" ON "pay_links" ("created_at");
CREATE INDEX IF NOT EXISTS "pay_links_expires_at_idx" ON "pay_links" ("expires_at");
