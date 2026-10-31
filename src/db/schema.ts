import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * PRODUCTS
 */
export const products = pgTable("products", {
  id: text("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  images: text("images").array().notNull(),
  isNew: boolean("is_new").default(false),
  isBestSeller: boolean("is_best_seller").default(false),
  tastingNotes: text("tasting_notes").array(),
  ingredients: text("ingredients"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * PRODUCT VARIANTS
 */
export const productVariants = pgTable(
  "product_variants",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    weightGrams: integer("weight_grams").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    stockOnHand: integer("stock_on_hand").default(0),
    sku: text("sku").unique(),
  },
  (t) => [index("product_variants_product_id_idx").on(t.productId)]
);

/**
 * CARTS
 * Stores guest cart by sessionId. Items are minimal lines: [{variantId, quantity}]
 */
export type CartLine = { variantId: string; quantity: number };

export const carts = pgTable("carts", {
  id: text("id").primaryKey(),
  items: jsonb("items").$type<CartLine[]>().notNull().default([]),
  status: text("status").notNull().default("open"), // open | locked | ordered
  lockedAt: timestamp("locked_at"), // null unless locked
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Line snapshot stored on checkout sessions (at payment start) and copied into order_items.
 */
export type CheckoutItemSnapshot = {
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  category: string;
  image: string;
  weightGrams: number;
  price: number;
  quantity: number;
};

/**
 * CHECKOUT SESSIONS
 */
export const checkoutSessions = pgTable(
  "checkout_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cartSessionId: text("cart_session_id")
      .notNull()
      .references(() => carts.id, { onDelete: "restrict" }),

    email: text("email").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone").notNull(),

    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    city: text("city").notNull(),
    country: text("country").default("Kenya"),
    notes: text("notes"),

    subtotal: numeric("subtotal", { precision: 10, scale: 2 }),
    shippingFee: numeric("shipping_fee", { precision: 10, scale: 2 }),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").default("KES"),

    // Items snapshot taken when payment starts; the webhook turns exactly these into the order.
    items: jsonb("items").$type<CheckoutItemSnapshot[]>(),

    status: text("status").notNull().default("pending"), // pending | failed | paid | cancelled
    paymentReference: text("payment_reference"), // IntaSend invoice id (set by webhook)
    intasendCheckoutId: text("intasend_checkout_id"),
    checkoutUrl: text("checkout_url"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [index("checkout_sessions_cart_session_id_idx").on(t.cartSessionId)]
);

/**
 * RELATIONS
 */
export const productRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
}));

export const variantRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

/**
 * ORDERS
 * Finalized purchase record created after webhook confirms payment.
 */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    checkoutSessionId: uuid("checkout_session_id")
      .notNull()
      .references(() => checkoutSessions.id, { onDelete: "restrict" }),

    cartSessionId: text("cart_session_id")
      .notNull()
      .references(() => carts.id, { onDelete: "restrict" }),

    email: text("email").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone").notNull(),

    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    city: text("city").notNull(),
    country: text("country").default("Kenya"),
    notes: text("notes"),

    subtotal: numeric("subtotal", { precision: 10, scale: 2 }),
    shippingFee: numeric("shipping_fee", { precision: 10, scale: 2 }),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").default("KES"),

    paymentReference: text("payment_reference"),
    paymentProvider: text("payment_provider"),

    status: text("status").notNull().default("paid"), // paid | fulfilled | cancelled | refunded
    fulfilledAt: timestamp("fulfilled_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    uniqueIndex("orders_checkout_session_id_uq").on(t.checkoutSessionId),
    index("orders_created_at_idx").on(t.createdAt),
    index("orders_status_idx").on(t.status),
  ]
);

/**
 * ORDER ITEMS
 * Snapshot of items at purchase time.
 */
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    variantId: text("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "restrict" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),

    name: text("name").notNull(),
    slug: text("slug").notNull(),
    category: text("category").notNull(),
    image: text("image").notNull(),

    weightGrams: integer("weight_grams").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [index("order_items_order_id_idx").on(t.orderId)]
);

/**
 * WEBHOOK EVENTS
 * Every IntaSend delivery is recorded, which makes duplicates/replays easy to debug.
 */
export const intasendEvents = pgTable(
  "intasend_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: text("invoice_id"),
    apiRef: text("api_ref"),
    state: text("state"),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("intasend_events_api_ref_idx").on(t.apiRef)]
);

/**
 * NEWSLETTER SUBSCRIBERS
 */
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  checkout: one(checkoutSessions, {
    fields: [orders.checkoutSessionId],
    references: [checkoutSessions.id],
  }),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));
