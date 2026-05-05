import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/** Shopify-style cart line snapshot stored on payment success. */
export type OrderCartLineSnapshot = {
  productId: string;
  title: string;
  quantity: number;
  unitAud: number;
  lineTotalAud: number;
};

/**
 * Canonical buyer profile keyed by normalized email — linked from archived orders after payment.
 */
export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    fullName: varchar("full_name", { length: 280 }),
    phone: varchar("phone", { length: 48 }),
    /** Merchant-only CRM notes */
    notes: text("notes"),
    /** Stripe Customer id (cus_…) when Stripe attached one to the payment */
    stripeCustomerId: varchar("stripe_customer_id", { length: 191 }).unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("customers_created_at_idx").on(t.createdAt)],
);

/** Successful payments worth fulfilling — keyed by Stripe PaymentIntent. */
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
    subtotalAudCents: integer("subtotal_aud_cents"),
    tipAudCents: integer("tip_aud_cents"),
    shippingAudCents: integer("shipping_aud_cents"),
    lineCount: integer("line_count"),
    customerId: integer("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    /** unfulfilled | processing | fulfilled | cancelled | refunded */
    fulfillmentStatus: varchar("fulfillment_status", { length: 48 }).default(
      "unfulfilled",
    ),
    /** Staff-only memo */
    internalNote: text("internal_note"),
    payLinkCode: varchar("pay_link_code", { length: 16 }),
    shippingName: varchar("shipping_name", { length: 240 }),
    shippingPhone: varchar("shipping_phone", { length: 48 }),
    shippingLine1: varchar("shipping_line1", { length: 280 }),
    shippingLine2: varchar("shipping_line2", { length: 280 }),
    shippingCity: varchar("shipping_city", { length: 120 }),
    shippingPostal: varchar("shipping_postal", { length: 48 }),
    shippingCountry: varchar("shipping_country", { length: 24 }),
    billingName: varchar("billing_name", { length: 240 }),
    billingPhone: varchar("billing_phone", { length: 48 }),
    billingLine1: varchar("billing_line1", { length: 280 }),
    billingLine2: varchar("billing_line2", { length: 280 }),
    billingCity: varchar("billing_city", { length: 120 }),
    billingPostal: varchar("billing_postal", { length: 48 }),
    billingCountry: varchar("billing_country", { length: 24 }),
    cartLines: jsonb("cart_lines").$type<OrderCartLineSnapshot[] | null>(),
  },
  (t) => [
    index("orders_created_at_desc_idx").on(t.createdAt),
    index("orders_customer_id_idx").on(t.customerId),
    index("orders_fulfillment_status_idx").on(t.fulfillmentStatus),
  ],
);

/**
 * Issued merchant payment-order links — short `code` in URL (?p=CODE). Tracks views & paid timestamp.
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
