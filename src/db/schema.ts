import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  uuid,
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
export const productVariants = pgTable("product_variants", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  weightGrams: integer("weight_grams").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stockOnHand: integer("stock_on_hand").default(0),
  sku: text("sku").unique(),
});

/**
 * CARTS
 * Stores guest cart by sessionId. Items are minimal lines: [{variantId, quantity}]
 */
export type CartLine = { variantId: string; quantity: number };

export const carts = pgTable("carts", {
  id: text("id").primaryKey(),
  items: jsonb("items").$type<CartLine[]>().notNull().default([]),
  status: text("status").notNull().default("open"), // open | locked
  lockedAt: timestamp("locked_at"), // null unless locked
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * CHECKOUT SESSIONS
 */
export const checkoutSessions = pgTable("checkout_sessions", {
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

  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("KES"),

  status: text("status").notNull().default("pending"),
  paymentReference: text("payment_reference"),
  // checkOutUrl: text("checkout_url"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
export const orders = pgTable("orders", {
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

  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("KES"),

  status: text("status").notNull().default("paid"), // paid | fulfilled | refunded
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * ORDER ITEMS
 * Snapshot of items at purchase time.
 */
export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),

  variantId: text("variant_id").notNull().references(() => productVariants.id, { onDelete: "restrict" }),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),

  name: text("name").notNull(),
  slug: text("slug").notNull(),
  category: text("category").notNull(),
  image: text("image").notNull(),

  weightGrams: integer("weight_grams").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
});

/**
 * (Optional but recommended) WEBHOOK EVENTS
 * Helps you debug duplicates/retries safely.
 */
export const intasendEvents = pgTable("intasend_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: text("invoice_id"),
  apiRef: text("api_ref"),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations (optional)
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