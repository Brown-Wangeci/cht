import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { carts, checkoutSessions, orderItems, orders, productVariants } from "@/db/schema";
import { toMoney } from "@/lib/pricing";
import { getCartSnapshot, toSnapshot } from "./cart";
import type { OrderEmailData } from "./email";

export type CompleteCheckoutInput = {
  checkoutSessionId: string;
  invoiceId: string;
  paidAmount: number;
  currency: string | undefined;
  provider: string | undefined;
};

export type CompleteCheckoutResult =
  | { kind: "created"; order: OrderEmailData }
  | { kind: "exists"; orderId: string }
  | { kind: "missing_session" }
  | { kind: "amount_mismatch"; expected: number; paid: number; currency: string | undefined };

/**
 * Turns a verified IntaSend payment into an order — exactly once.
 * Runs in one transaction with the checkout row locked, so concurrent webhook deliveries
 * (or dashboard replays) cannot create duplicate orders or double-decrement stock.
 */
export async function completeCheckout(input: CompleteCheckoutInput): Promise<CompleteCheckoutResult> {
  return db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(checkoutSessions)
      .where(eq(checkoutSessions.id, input.checkoutSessionId))
      .for("update")
      .limit(1);

    if (!session) return { kind: "missing_session" as const };

    const [existing] = await tx
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.checkoutSessionId, session.id))
      .limit(1);

    if (existing) return { kind: "exists" as const, orderId: existing.id };

    const expected = toMoney(session.totalAmount);
    const currency = session.currency ?? "KES";
    const currencyOk = !input.currency || input.currency.toUpperCase() === currency.toUpperCase();

    if (!currencyOk || input.paidAmount + 0.01 < expected) {
      return { kind: "amount_mismatch" as const, expected, paid: input.paidAmount, currency: input.currency };
    }

    // Items charged for were snapshotted at payment start; fall back to the (locked) cart for older sessions.
    let items = Array.isArray(session.items) ? session.items : [];
    if (!items.length) {
      const snapshot = await getCartSnapshot(session.cartSessionId, tx);
      items = toSnapshot(snapshot.items);
    }

    const subtotal = session.subtotal != null ? toMoney(session.subtotal) : expected;
    const shippingFee = session.shippingFee != null ? toMoney(session.shippingFee) : 0;

    const [order] = await tx
      .insert(orders)
      .values({
        checkoutSessionId: session.id,
        cartSessionId: session.cartSessionId,

        email: session.email,
        firstName: session.firstName,
        lastName: session.lastName,
        phone: session.phone,

        addressLine1: session.addressLine1,
        addressLine2: session.addressLine2 ?? null,
        city: session.city,
        country: session.country ?? "Kenya",
        notes: session.notes ?? null,

        subtotal: String(subtotal),
        shippingFee: String(shippingFee),
        totalAmount: String(expected),
        currency,

        paymentReference: input.invoiceId,
        paymentProvider: input.provider ?? null,
        status: "paid",
      })
      .returning();

    if (items.length) {
      await tx.insert(orderItems).values(
        items.map((i) => ({
          orderId: order.id,
          variantId: i.variantId,
          productId: i.productId,
          name: i.name,
          slug: i.slug,
          category: i.category,
          image: i.image || "",
          weightGrams: i.weightGrams,
          price: String(i.price),
          quantity: i.quantity,
        }))
      );

      for (const i of items) {
        await tx
          .update(productVariants)
          .set({ stockOnHand: sql`GREATEST(COALESCE(${productVariants.stockOnHand}, 0) - ${i.quantity}, 0)` })
          .where(eq(productVariants.id, i.variantId));
      }
    }

    await tx
      .update(checkoutSessions)
      .set({ status: "paid", paymentReference: input.invoiceId, updatedAt: new Date() })
      .where(eq(checkoutSessions.id, session.id));

    await tx
      .update(carts)
      .set({ status: "ordered", updatedAt: new Date() })
      .where(eq(carts.id, session.cartSessionId));

    return {
      kind: "created" as const,
      order: {
        id: order.id,
        email: order.email,
        firstName: order.firstName,
        lastName: order.lastName,
        phone: order.phone,
        addressLine1: order.addressLine1,
        addressLine2: order.addressLine2,
        city: order.city,
        country: order.country,
        notes: order.notes,
        subtotal,
        shippingFee,
        totalAmount: expected,
        items: items.map((i) => ({
          name: i.name,
          weightGrams: i.weightGrams,
          price: i.price,
          quantity: i.quantity,
        })),
      },
    };
  });
}

/** Marks a still-pending checkout as failed so the success page can offer a retry. */
export async function markCheckoutFailed(checkoutSessionId: string) {
  await db
    .update(checkoutSessions)
    .set({ status: "failed", updatedAt: new Date() })
    .where(and(eq(checkoutSessions.id, checkoutSessionId), inArray(checkoutSessions.status, ["pending"])));
}
