import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/** Successful (or captured) payments worth fulfilling — keyed by Stripe PaymentIntent. */
export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", {
      length: 191,
    })
      .notNull()
      .unique(),
    stripeChargeId: varchar("stripe_charge_id", { length: 191 }),
    amountAudCents: integer("amount_aud_cents").notNull(),
    currency: varchar("currency", { length: 12 }).default("aud").notNull(),
    status: varchar("status", { length: 48 }).notNull(),
    checkoutKind: varchar("checkout_kind", { length: 48 }),
    adminMode: varchar("admin_mode", { length: 48 }),
    title: varchar("title", { length: 520 }),
    reference: varchar("reference", { length: 200 }),
    customerEmail: varchar("customer_email", { length: 320 }),
    productId: varchar("product_id", { length: 100 }),
    receiptUrl: varchar("receipt_url", { length: 1200 }),
    /** Store-cart snapshot from PI metadata when present */
    subtotalAudCents: integer("subtotal_aud_cents"),
    tipAudCents: integer("tip_aud_cents"),
    shippingAudCents: integer("shipping_aud_cents"),
    lineCount: integer("line_count"),
  },
  (t) => [index("orders_created_at_desc_idx").on(t.createdAt)],
);

/**
 * Issued payment links — short `code` in URL (?p=CODE). Tracks views & paid timestamp.
 */
export const payLinks = pgTable(
  "pay_links",
  {
    code: varchar("code", { length: 10 }).primaryKey(),
    amountAudCents: integer("amount_aud_cents").notNull(),
    title: varchar("title", { length: 520 }).notNull(),
    reference: varchar("reference", { length: 200 }),
    mode: varchar("mode", { length: 48 }).notNull(),
    productId: varchar("product_id", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    /** Latest PI tied to billing step (may supersede orphans) */
    stripePaymentIntentId: varchar("stripe_payment_intent_id", {
      length: 191,
    }).unique(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    viewCount: integer("view_count").default(0).notNull(),
    firstViewedAt: timestamp("first_viewed_at", { withTimezone: true }),
    lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),
  },
  (t) => [
    index("pay_links_created_at_idx").on(t.createdAt),
    index("pay_links_expires_at_idx").on(t.expiresAt),
  ],
);
