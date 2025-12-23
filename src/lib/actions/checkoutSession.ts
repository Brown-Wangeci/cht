"use server";

import { cookies } from "next/headers";
import { db } from "@/db";
import { checkoutSessions, carts, productVariants } from "@/db/schema";
import { eq } from "drizzle-orm";

const CHECKOUT_SESSION_COOKIE = "checkout_session";
const CART_SESSION_COOKIE = "cart_session";

export type CheckoutCartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  category: string;
  image: string;
  weightGrams: number;
  price: number;
  quantity: number;
};

export type CheckoutTotals = { count: number; subtotal: number };

export type CheckoutSessionView = {
  id: string;
  status: string;
  currency: string;
  totalAmount: number;

  email: string;
  firstName: string;
  lastName: string;
  phone: string;

  addressLine1: string;
  addressLine2: string | null;
  city: string;
  country: string | null;
  notes: string | null;

  paymentReference: string | null;

  cartSessionId: string;
  cartStatus: string;

  items: CheckoutCartItem[];
  totals: CheckoutTotals;
};

const clampInt = (n: unknown, min: number, max: number) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, Math.trunc(num)));
};

const clampMoney = (n: unknown) => {
  const num = typeof n === "string" ? Number(n) : typeof n === "number" ? n : 0;
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num * 100) / 100;
};

const calcTotals = (items: CheckoutCartItem[]): CheckoutTotals => {
  const count = items.reduce((t, i) => t + (i.quantity || 0), 0);
  const subtotal = items.reduce((t, i) => t + i.price * i.quantity, 0);
  return { count, subtotal: Math.round(subtotal * 100) / 100 };
};

type DbCartLine = { variantId: string; quantity: number };

export async function getCheckoutSessionView(): Promise<CheckoutSessionView | null> {
  const store = await cookies();
  const checkoutSessionId = store.get(CHECKOUT_SESSION_COOKIE)?.value?.trim();
  const cartSessionIdCookie = store.get(CART_SESSION_COOKIE)?.value?.trim();

  if (!checkoutSessionId) return null;

  const [session] = await db
    .select()
    .from(checkoutSessions)
    .where(eq(checkoutSessions.id, checkoutSessionId))
    .limit(1);

  if (!session) return null;

  // Optional: ensure the cart cookie matches the session cart (extra safety)
  // If you want strict behavior, enforce it:
  // if (cartSessionIdCookie && cartSessionIdCookie !== session.cartSessionId) return null;

  const [cartRow] = await db
    .select()
    .from(carts)
    .where(eq(carts.id, session.cartSessionId))
    .limit(1);

  const rawLines = Array.isArray(cartRow?.items) ? (cartRow!.items as unknown[]) : [];
  const lines: DbCartLine[] = rawLines
    .map((x) => {
      const v = x as any;
      const variantId = typeof v?.variantId === "string" ? v.variantId.trim() : "";
      const quantity = clampInt(v?.quantity, 1, 99);
      if (!variantId) return null;
      return { variantId, quantity };
    })
    .filter(Boolean) as DbCartLine[];

  const resolved = await Promise.all(
    lines.map(async (line) => {
      const variant = await db.query.productVariants.findFirst({
        where: eq(productVariants.id, line.variantId),
        with: { product: true },
      });

      if (!variant || !variant.product) return null;

      const stock = Number(variant.stockOnHand ?? 0);
      if (stock <= 0) return null;

      const qty = clampInt(line.quantity, 1, Math.min(99, stock));

      const image = Array.isArray(variant.product.images)
        ? variant.product.images[0] ?? ""
        : "";

      return {
        variantId: String(variant.id),
        productId: String(variant.product.id),
        slug: String(variant.product.slug ?? "").trim(),
        name: String(variant.product.name ?? "").trim(),
        category: String(variant.product.category ?? "").trim(),
        image: String(image ?? "").trim(),
        weightGrams: Number(variant.weightGrams) || 0,
        price: clampMoney(variant.price),
        quantity: qty,
      } satisfies CheckoutCartItem;
    })
  );

  const items = resolved.filter(Boolean) as CheckoutCartItem[];
  const totals = calcTotals(items);

  return {
    id: String(session.id),
    status: String(session.status ?? "pending"),
    currency: String(session.currency ?? "KES"),
    totalAmount: clampMoney(session.totalAmount),

    email: session.email,
    firstName: session.firstName,
    lastName: session.lastName,
    phone: session.phone,

    addressLine1: session.addressLine1,
    addressLine2: session.addressLine2 ?? null,
    city: session.city,
    country: session.country ?? "Kenya",
    notes: session.notes ?? null,

    paymentReference: session.paymentReference ?? null,

    cartSessionId: session.cartSessionId,
    cartStatus: String(cartRow?.status ?? "open"),

    items,
    totals,
  };
}
