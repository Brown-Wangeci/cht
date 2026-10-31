import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { checkoutSessions, carts } from "@/db/schema";
import { CART_SESSION_COOKIE, CHECKOUT_SESSION_COOKIE, asUuid } from "@/lib/server/cookies";

/**
 * POST: unlocks the cart so it can be edited again ("Change items").
 *
 * The checkout session itself stays pending so the delivery form remains prefilled; payment
 * cannot start again until the shipping form is re-submitted, which re-locks the cart.
 * A checkout that has already been paid is never reopened.
 */
export async function POST() {
  try {
    const store = await cookies();
    const checkoutSessionId = asUuid(store.get(CHECKOUT_SESSION_COOKIE)?.value);
    const cartSessionIdCookie = store.get(CART_SESSION_COOKIE)?.value?.trim();

    const outcome = await db.transaction(async (tx) => {
      let cartId = cartSessionIdCookie;

      if (checkoutSessionId) {
        const [session] = await tx
          .select({ id: checkoutSessions.id, status: checkoutSessions.status, cartSessionId: checkoutSessions.cartSessionId })
          .from(checkoutSessions)
          .where(eq(checkoutSessions.id, checkoutSessionId))
          .for("update")
          .limit(1);

        if (session?.status === "paid") return { paid: true as const, ref: session.id };
        if (session) cartId = session.cartSessionId;
      }

      if (cartId) {
        await tx
          .update(carts)
          .set({ status: "open", lockedAt: null, updatedAt: new Date() })
          .where(and(eq(carts.id, cartId), eq(carts.status, "locked")));
      }

      return { paid: false as const };
    });

    if (outcome.paid) {
      return NextResponse.json(
        {
          code: "ALREADY_PAID",
          error: "This order has already been paid.",
          redirectTo: `/checkout/success?ref=${outcome.ref}`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Checkout cancel error:", error);
    return NextResponse.json({ error: "Failed to unlock cart" }, { status: 500 });
  }
}
