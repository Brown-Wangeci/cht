import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import {
  CART_SESSION_COOKIE,
  CHECKOUT_SESSION_COOKIE,
  LAST_ORDER_COOKIE,
  asUuid,
  lastOrderCookieOptions,
} from "@/lib/server/cookies";

/**
 * POST: called by the success page once the order exists.
 * Ends the checkout: clears the checkout + (spent) cart cookies and remembers the order
 * so the receipt stays viewable on refresh.
 */
export async function POST() {
  try {
    const store = await cookies();
    const checkoutSessionId = asUuid(store.get(CHECKOUT_SESSION_COOKIE)?.value);
    if (!checkoutSessionId) return NextResponse.json({ ok: true });

    const [order] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.checkoutSessionId, checkoutSessionId))
      .limit(1);

    if (!order) return NextResponse.json({ ok: false, code: "ORDER_NOT_FOUND" }, { status: 409 });

    const res = NextResponse.json({ ok: true });
    res.cookies.delete(CHECKOUT_SESSION_COOKIE);
    res.cookies.delete(CART_SESSION_COOKIE);
    res.cookies.set(LAST_ORDER_COOKIE, checkoutSessionId, lastOrderCookieOptions);
    return res;
  } catch (error) {
    console.error("Checkout complete error:", error);
    return NextResponse.json({ error: "Failed to finalise checkout" }, { status: 500 });
  }
}
