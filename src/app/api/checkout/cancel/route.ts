import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { checkoutSessions, carts } from "@/db/schema";
import { eq } from "drizzle-orm";

const CHECKOUT_COOKIE = "checkout_session";
const CART_COOKIE = "cart_session";

export async function POST() {
  try {
    const store = await cookies();
    const checkoutSessionId = store.get(CHECKOUT_COOKIE)?.value?.trim();
    const cartSessionId = store.get(CART_COOKIE)?.value?.trim();

    const res = NextResponse.json({ success: true });

    await db.transaction(async (tx) => {
      // 1) Best path: cancel using checkout session cookie (authoritative)
      if (checkoutSessionId) {
        const [session] = await tx
          .select()
          .from(checkoutSessions)
          .where(eq(checkoutSessions.id, checkoutSessionId))
          .limit(1);

        if (session) {
          // Unlock the cart that THIS checkout session is tied to
          await tx
            .update(carts)
            .set({ status: "open" })
            .where(eq(carts.id, session.cartSessionId));

          // Mark checkout session cancelled (don’t delete)
          await tx
            .update(checkoutSessions)
            .set({ status: "cancelled" })
            .where(eq(checkoutSessions.id, checkoutSessionId));
        }

        // Always clear checkout cookie (even if session not found → stale cookie)
        res.cookies.delete(CHECKOUT_COOKIE);
        return;
      }

      // 2) Fallback: no checkout cookie, but cart cookie exists
      //    This is safe IF your cart is locked only via checkout flow.
      if (cartSessionId) {
        const [cart] = await tx
          .select({ status: carts.status })
          .from(carts)
          .where(eq(carts.id, cartSessionId))
          .limit(1);

        // Only unlock if it’s actually locked (avoid flipping ordered carts etc.)
        if (cart?.status === "locked") {
          await tx.update(carts).set({ status: "open" }).where(eq(carts.id, cartSessionId));
        }
      }
    });

    return res;
  } catch (error) {
    console.error("Checkout cancel error:", error);
    return NextResponse.json({ error: "Failed to cancel checkout" }, { status: 500 });
  }
}
