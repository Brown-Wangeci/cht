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

  status: text("status").default("pending"),
  paymentReference: text("payment_reference"),

  createdAt: timestamp("created_at").defaultNow(),
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
