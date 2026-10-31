"use server";

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { carts, checkoutSessions } from "@/db/schema";
import { getCartSnapshot } from "@/lib/server/cart";
import {
  CART_SESSION_COOKIE,
  CHECKOUT_SESSION_COOKIE,
  asUuid,
  checkoutCookieOptions,
} from "@/lib/server/cookies";
import { isValidEmail, isValidPhone, normalizePhone } from "@/lib/validation";

export type ShippingValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  country: string;
  notes: string;
};

export type ShippingField = keyof ShippingValues;

export type SubmitShippingResult =
  | { ok: true; checkoutSessionId: string }
  | {
      ok: false;
      error: string;
      fieldErrors?: Partial<Record<ShippingField, string>>;
      values?: ShippingValues;
      redirectTo?: string;
    };

const MAX_LENGTH: Record<ShippingField, number> = {
  firstName: 60,
  lastName: 60,
  email: 254,
  phone: 20,
  address1: 200,
  address2: 200,
  city: 80,
  country: 60,
  notes: 500,
};

const REQUIRED: ShippingField[] = ["firstName", "lastName", "email", "phone", "address1", "city", "country"];

const readValues = (formData: FormData): ShippingValues => {
  const get = (k: ShippingField) => String(formData.get(k) ?? "").trim();
  return {
    firstName: get("firstName"),
    lastName: get("lastName"),
    email: get("email").toLowerCase(),
    phone: get("phone"),
    address1: get("address1"),
    address2: get("address2"),
    city: get("city"),
    country: get("country"),
    notes: get("notes"),
  };
};

function validate(values: ShippingValues) {
  const errors: Partial<Record<ShippingField, string>> = {};

  for (const key of Object.keys(MAX_LENGTH) as ShippingField[]) {
    if (REQUIRED.includes(key) && !values[key]) errors[key] = "This field is required.";
    else if (values[key].length > MAX_LENGTH[key]) errors[key] = `Must be ${MAX_LENGTH[key]} characters or fewer.`;
  }

  if (!errors.email && !isValidEmail(values.email)) errors.email = "Enter a valid email address.";
  if (!errors.phone && !isValidPhone(values.phone)) errors.phone = "Enter a valid phone number, e.g. 0712 345 678.";

  return errors;
}

/**
 * Saves delivery details, locks the cart and creates/updates the checkout session.
 * Shaped for useActionState (works without JavaScript too).
 */
export async function submitShipping(
  _prev: SubmitShippingResult | null,
  formData: FormData
): Promise<SubmitShippingResult> {
  const values = readValues(formData);
  const fieldErrors = validate(values);

  if (Object.keys(fieldErrors).length) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors, values };
  }

  const store = await cookies();
  const cartSessionId = asUuid(store.get(CART_SESSION_COOKIE)?.value);

  if (!cartSessionId) {
    return {
      ok: false,
      error: "Your cart session has expired. Please return to the shop and try again.",
      values,
      redirectTo: "/products",
    };
  }

  try {
    const existingCheckoutId = asUuid(store.get(CHECKOUT_SESSION_COOKIE)?.value);
    const phone = normalizePhone(values.phone);

    const result = await db.transaction(async (tx) => {
      const [cart] = await tx.select().from(carts).where(eq(carts.id, cartSessionId)).for("update").limit(1);
      if (!cart || cart.status === "ordered") return { mode: "empty" as const };

      // Server-trusted totals; drops unavailable items and clamps quantities to stock.
      const snapshot = await getCartSnapshot(cartSessionId, tx);
      if (!snapshot.items.length) return { mode: "empty" as const };

      await tx
        .update(carts)
        .set({
          items: snapshot.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          status: "locked",
          lockedAt: cart.status === "locked" ? cart.lockedAt : new Date(),
          updatedAt: new Date(),
        })
        .where(eq(carts.id, cartSessionId));

      const fields = {
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        phone,
        addressLine1: values.address1,
        addressLine2: values.address2 || null,
        city: values.city,
        country: values.country,
        notes: values.notes || null,
        subtotal: String(snapshot.totals.subtotal),
        shippingFee: String(snapshot.totals.shippingFee),
        totalAmount: String(snapshot.totals.total),
        currency: "KES",
        status: "pending",
        updatedAt: new Date(),
      };

      if (existingCheckoutId) {
        const [existing] = await tx
          .select({ id: checkoutSessions.id, cartSessionId: checkoutSessions.cartSessionId, status: checkoutSessions.status })
          .from(checkoutSessions)
          .where(eq(checkoutSessions.id, existingCheckoutId))
          .limit(1);

        const editable = existing?.status === "pending" || existing?.status === "failed";
        if (existing && existing.cartSessionId === cartSessionId && editable) {
          await tx.update(checkoutSessions).set(fields).where(eq(checkoutSessions.id, existing.id));
          return { mode: "ok" as const, checkoutSessionId: existing.id };
        }
      }

      const [created] = await tx
        .insert(checkoutSessions)
        .values({ cartSessionId, ...fields })
        .returning({ id: checkoutSessions.id });

      return { mode: "ok" as const, checkoutSessionId: created.id };
    });

    if (result.mode === "empty") {
      return {
        ok: false,
        error: "Your cart is empty. Please add items before proceeding to checkout.",
        values,
        redirectTo: "/products",
      };
    }

    store.set(CHECKOUT_SESSION_COOKIE, result.checkoutSessionId, checkoutCookieOptions);
    return { ok: true, checkoutSessionId: result.checkoutSessionId };
  } catch (error) {
    console.error("submitShipping error:", error);
    return { ok: false, error: "We couldn't save your details. Please try again.", values };
  }
}
