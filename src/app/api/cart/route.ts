import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { carts } from "@/db/schema";
import { normalizeLines, resolveCartLines } from "@/lib/server/cart";
import { CART_SESSION_COOKIE, asUuid, cartCookieOptions } from "@/lib/server/cookies";

/**
 * Resolves the visitor's cart id from the cookie. A missing/invalid cookie, or a cart that has
 * already been turned into an order, gets a brand-new id (`rotated`), which the response must set.
 */
async function getActiveCart() {
  const store = await cookies();
  const cookieId = asUuid(store.get(CART_SESSION_COOKIE)?.value);

  if (cookieId) {
    const [cart] = await db.select().from(carts).where(eq(carts.id, cookieId)).limit(1);
    if (!cart || cart.status !== "ordered") return { cartId: cookieId, cart: cart ?? null, rotated: false };
  }

  return { cartId: randomUUID(), cart: null, rotated: true };
}

/**
 * POST: snapshot sync (guest)
 * body: { items: [{variantId, quantity}] }
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const lines = normalizeLines((body as { items?: unknown } | null)?.items);
    const { cartId, cart, rotated } = await getActiveCart();

    if (cart?.status === "locked") {
      return NextResponse.json({ code: "CART_LOCKED", message: "Cart is locked for checkout" }, { status: 409 });
    }

    await db
      .insert(carts)
      .values({ id: cartId, items: lines, status: "open", updatedAt: new Date() })
      .onConflictDoUpdate({
        target: carts.id,
        set: { items: lines, updatedAt: new Date() },
      });

    const res = NextResponse.json({ success: true });
    if (rotated) res.cookies.set(CART_SESSION_COOKIE, cartId, cartCookieOptions);
    return res;
  } catch (error) {
    console.error("Cart POST Sync Error:", error);
    return NextResponse.json({ error: "Failed to sync cart" }, { status: 500 });
  }
}

/**
 * GET: resolves cart lines into UI-ready items
 * returns: { items: [...], locked: boolean }
 *
 * Never sets the cookie: only POST creates carts, so a GET racing a first POST can't
 * overwrite the cookie with an id that has no cart behind it.
 */
export async function GET() {
  try {
    const { cart } = await getActiveCart();
    const items = await resolveCartLines(normalizeLines(cart?.items));

    return NextResponse.json(
      { items, locked: cart?.status === "locked" },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Cart GET Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}
