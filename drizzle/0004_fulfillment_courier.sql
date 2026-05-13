-- Admin Fulfillment: carrier for tracking link (NZ Post / Aus Post)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fulfillment_courier" varchar(24) DEFAULT 'nz_post';
