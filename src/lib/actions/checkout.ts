"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { carts, productVariants, checkoutSessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export type CheckoutCartItemInput = {
  variantId: string;
  productId: string;

  name: string;
  slug: string;
  category: string;
  image: string;

  weightGrams: number;
  price: number; // server-trusted (from product_variants.price)
  quantity: number;
};

export type CheckoutTotals = {
  count: number;
  subtotal: number;
};



const CART_SESSION_COOKIE = "cart_session";
const CHECKOUT_SESSION_COOKIE = "checkout_session";

const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: isProd,
  path: "/" as const,
};

type DbCartLine = { variantId: string; quantity: number };

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

const calcTotals = (items: CheckoutCartItemInput[]): CheckoutTotals => {
  const count = items.reduce((t, i) => t + (Number(i.quantity) || 0), 0);
  const subtotal = items.reduce(
    (t, i) => t + (Number(i.price) || 0) * (Number(i.quantity) || 0),
    0
  );
  return { count, subtotal: Math.round(subtotal * 100) / 100 };
};

const normalizePhone = (phone: string) => phone.replace(/[^\d+]/g, "");
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getRequired = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

const getOptional = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

/**
 * Server-trusted cart snapshot (Postgres):
 * - reads the cart by sessionId from cookies()
 * - resolves each variantId from product_variants + product relation
 * - uses DB price (prevents tampering)
 */
export async function getCheckoutCartSnapshot(): Promise<{
  items: CheckoutCartItemInput[];
  totals: CheckoutTotals;
}> {
  const store = await cookies();
  const sessionId = store.get(CART_SESSION_COOKIE)?.value;

  if (!sessionId) {
    return { items: [], totals: { count: 0, subtotal: 0 } };
  }

  const [cartRow] = await db
    .select()
    .from(carts)
    .where(eq(carts.id, sessionId))
    .limit(1);

  const rawLines = Array.isArray(cartRow?.items) ? (cartRow!.items as unknown[]) : [];

  // validate shape safely
  const lines: DbCartLine[] = rawLines
    .map((x) => {
      const v = x as any;
      const variantId = typeof v?.variantId === "string" ? v.variantId.trim() : "";
      const quantity = clampInt(v?.quantity, 1, 99);
      if (!variantId) return null;
      return { variantId, quantity };
    })
    .filter(Boolean) as DbCartLine[];

  if (!lines.length) {
    return { items: [], totals: { count: 0, subtotal: 0 } };
  }

  const resolved = await Promise.all(
    lines.map(async (line) => {
      const variant = await db.query.productVariants.findFirst({
        where: eq(productVariants.id, line.variantId),
        with: { product: true },
      });

      if (!variant || !variant.product) return null;

      // Optional: enforce stock bounds at checkout time
      const stock = Number(variant.stockOnHand ?? 0);
      if (stock <= 0) return null;

      const qty = clampInt(line.quantity, 1, Math.min(99, stock));

      const image = Array.isArray(variant.product.images)
        ? variant.product.images[0] ?? ""
        : "";

      return {
        variantId: String(variant.id),
        productId: String(variant.product.id),

        name: String(variant.product.name ?? "").trim(),
        slug: String(variant.product.slug ?? "").trim(),
        category: String(variant.product.category ?? "").trim(),
        image: String(image ?? "").trim(),

        weightGrams: Number(variant.weightGrams) || 0,
        price: clampMoney(variant.price),
        quantity: qty,
      } satisfies CheckoutCartItemInput;
    })
  );

  const items = resolved.filter(Boolean) as CheckoutCartItemInput[];

  if (!items.length) {
    throw new Error("One or more items are no longer available");
  }

  const totals = calcTotals(items);

  return { items, totals };
}


/**
 * ✅ Server-trusted cart snapshot by cart id (NO cookies)
 * Used by payment initiation to avoid cookie mismatch.
 */
export async function getCheckoutCartSnapshotByCartId(cartSessionId: string): Promise<{
  items: CheckoutCartItemInput[];
  totals: CheckoutTotals;
}> {
  if (!cartSessionId?.trim()) {
    return { items: [], totals: { count: 0, subtotal: 0 } };
  }

  const [cartRow] = await db
    .select()
    .from(carts)
    .where(eq(carts.id, cartSessionId))
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

  if (!lines.length) {
    return { items: [], totals: { count: 0, subtotal: 0 } };
  }

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

        name: String(variant.product.name ?? "").trim(),
        slug: String(variant.product.slug ?? "").trim(),
        category: String(variant.product.category ?? "").trim(),
        image: String(image ?? "").trim(),

        weightGrams: Number(variant.weightGrams) || 0,
        price: clampMoney(variant.price),
        quantity: qty,
      } satisfies CheckoutCartItemInput;
    })
  );

  const items = resolved.filter(Boolean) as CheckoutCartItemInput[];

  if (!items.length) {
    throw new Error("One or more items are no longer available");
  }

  const totals = calcTotals(items);
  return { items, totals };
}




export async function submitShipping(formData: FormData) {
  const firstName = getRequired(formData, "firstName");
  const lastName = getRequired(formData, "lastName");
  const email = getRequired(formData, "email");
  const phoneRaw = getRequired(formData, "phone");

  const address1 = getRequired(formData, "address1");
  const address2 = getOptional(formData, "address2");
  const city = getRequired(formData, "city");
  const country = getRequired(formData, "country");
  const notes = getOptional(formData, "notes");

  const phone = normalizePhone(phoneRaw);

  // Validate fields (same as you had)
  if (
    !firstName ||
    !lastName ||
    !email ||
    !isValidEmail(email) ||
    !phone ||
    !address1 ||
    !city ||
    !country
  ) {
    redirect("/checkout/shipping");
  }

  const store = await cookies();
  const cartSessionId = store.get(CART_SESSION_COOKIE)?.value?.trim();

  if (!cartSessionId) {
    redirect("/products");
  }

  // Server-trusted cart snapshot
  const { items, totals } = await getCheckoutCartSnapshot();
  if (!items.length) redirect("/products");

  const existingCheckoutId = store.get(CHECKOUT_SESSION_COOKIE)?.value?.trim();

  const result = await db.transaction(async (tx) => {
    // Ensure cart exists and lock it
    const [cartRow] = await tx
      .select({ id: carts.id, status: carts.status })
      .from(carts)
      .where(eq(carts.id, cartSessionId))
      .limit(1);

    if (!cartRow) {
      // cart cookie exists but cart row missing
      return { mode: "missing_cart" as const };
    }

    // Lock the cart (idempotent)
    if (cartRow.status !== "locked") {
      await tx.update(carts).set({ status: "locked", lockedAt: new Date() }).where(eq(carts.id, cartSessionId));
    }

    // If there is a checkout session cookie, try to update THAT session (only if safe)
    if (existingCheckoutId) {
      const [existing] = await tx
        .select()
        .from(checkoutSessions)
        .where(eq(checkoutSessions.id, existingCheckoutId))
        .limit(1);

      const belongsToThisCart = existing?.cartSessionId === cartSessionId;
      const isEditable = existing?.status === "pending";

      if (existing && belongsToThisCart && isEditable) {
        await tx
          .update(checkoutSessions)
          .set({
            email,
            firstName,
            lastName,
            phone,
            addressLine1: address1,
            addressLine2: address2 || null,
            city,
            country,
            notes: notes || null,
            totalAmount: String(totals.subtotal),
            currency: "KES",
            updatedAt: new Date(),
          })
          .where(eq(checkoutSessions.id, existingCheckoutId));

        return { mode: "updated" as const, checkoutSessionId: existingCheckoutId };
      }

      // Cookie exists but session is invalid/stale/mismatch → create new session
      const [created] = await tx
        .insert(checkoutSessions)
        .values({
          cartSessionId,
          email,
          firstName,
          lastName,
          phone,
          addressLine1: address1,
          addressLine2: address2 || null,
          city,
          country,
          notes: notes || null,
          totalAmount: String(totals.subtotal),
          currency: "KES",
          status: "pending",
        })
        .returning();

      return { mode: "created" as const, checkoutSessionId: created.id };
    }

    // No checkout cookie → create new session
    const [created] = await tx
      .insert(checkoutSessions)
      .values({
        cartSessionId,
        email,
        firstName,
        lastName,
        phone,
        addressLine1: address1,
        addressLine2: address2 || null,
        city,
        country,
        notes: notes || null,
        totalAmount: String(totals.subtotal),
        currency: "KES",
        status: "pending",
      })
      .returning();

    return { mode: "created" as const, checkoutSessionId: created.id };
  });

  if (result.mode === "missing_cart") {
    redirect("/products");
  }

  // Ensure cookie is set to the active session
  store.set(CHECKOUT_SESSION_COOKIE, result.checkoutSessionId, cookieOptions);

  redirect("/checkout/payment");
}