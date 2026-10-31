import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { checkoutSessions } from "@/db/schema";
import { getCartSnapshot, toSnapshot } from "@/lib/server/cart";
import { CHECKOUT_SESSION_COOKIE, asUuid } from "@/lib/server/cookies";
import { createCheckout, toIntaSendPhone } from "@/lib/server/intasend";
import { getAppUrl } from "@/lib/site";

const PAYABLE_STATUSES = new Set(["pending", "failed"]);

const fail = (status: number, code: string, error: string, extra?: Record<string, unknown>) =>
  NextResponse.json({ code, error, ...extra }, { status });

/**
 * POST: starts an IntaSend hosted checkout for the current checkout session.
 * The amount is always recomputed server-side from the locked cart (+ delivery fee).
 */
export async function POST() {
  try {
    const store = await cookies();
    const checkoutSessionId = asUuid(store.get(CHECKOUT_SESSION_COOKIE)?.value);

    if (!checkoutSessionId) {
      return fail(400, "NO_SESSION", "Your checkout session has expired. Please re-enter your delivery details.", {
        redirectTo: "/checkout/shipping",
      });
    }

    const [session] = await db
      .select()
      .from(checkoutSessions)
      .where(eq(checkoutSessions.id, checkoutSessionId))
      .limit(1);

    if (!session) {
      const res = fail(400, "NO_SESSION", "Your checkout session has expired. Please re-enter your delivery details.", {
        redirectTo: "/checkout/shipping",
      });
      res.cookies.delete(CHECKOUT_SESSION_COOKIE);
      return res;
    }

    if (session.status === "paid") {
      return fail(409, "ALREADY_PAID", "This order has already been paid.", {
        redirectTo: `/checkout/success?ref=${session.id}`,
      });
    }

    if (!PAYABLE_STATUSES.has(session.status)) {
      return fail(409, "SESSION_NOT_PAYABLE", "This checkout is no longer active. Please review your delivery details.", {
        redirectTo: "/checkout/shipping",
      });
    }

    const cart = await getCartSnapshot(session.cartSessionId);

    if (cart.status !== "locked") {
      return fail(409, "CART_NOT_LOCKED", "Your checkout is no longer active. Please review your delivery details.", {
        redirectTo: "/checkout/shipping",
      });
    }

    if (!cart.items.length || cart.items.length < cart.lineCount) {
      return fail(
        409,
        "ITEMS_UNAVAILABLE",
        "Some items in your cart are no longer available. Use “Change items” to update your cart."
      );
    }

    const { totals } = cart;
    const currency = session.currency ?? "KES";
    const appUrl = getAppUrl();

    await db
      .update(checkoutSessions)
      .set({
        subtotal: String(totals.subtotal),
        shippingFee: String(totals.shippingFee),
        totalAmount: String(totals.total),
        items: toSnapshot(cart.items),
        status: "pending",
        updatedAt: new Date(),
      })
      .where(eq(checkoutSessions.id, session.id));

    const checkout = await createCheckout({
      first_name: session.firstName,
      last_name: session.lastName,
      email: session.email,
      phone_number: toIntaSendPhone(session.phone),
      amount: totals.total,
      currency,
      api_ref: session.id,
      redirect_url: `${appUrl}/checkout/success?ref=${session.id}`,
      host: appUrl,
    });

    if (!checkout.url) {
      console.error("IntaSend checkout returned no url:", checkout);
      return fail(502, "PROVIDER_ERROR", "We couldn't reach the payment provider. Please try again.");
    }

    await db
      .update(checkoutSessions)
      .set({ intasendCheckoutId: checkout.id ?? null, checkoutUrl: checkout.url, updatedAt: new Date() })
      .where(eq(checkoutSessions.id, session.id));

    return NextResponse.json({ checkoutUrl: checkout.url });
  } catch (error) {
    console.error("Checkout start error:", error);
    return fail(500, "CHECKOUT_FAILED", "We couldn't start the payment. Please try again in a moment.");
  }
}
