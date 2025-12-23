import { db } from "@/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { checkoutSessions, carts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCheckoutCartSnapshotByCartId } from "@/lib/actions/checkout";

const CHECKOUT_COOKIE = "checkout_session";

const normalizePhone = (phone: string) => String(phone ?? "").replace(/[^\d+]/g, "");
const str = (v: unknown) => String(v ?? "").trim();

async function createIntaSendCheckout(input: {
  amount: number;
  currency: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  apiRef: string;
  redirectUrl: string;
}) {
  const INTASEND_SECRET_KEY = process.env.INTASEND_SECRET_KEY;
  if (!INTASEND_SECRET_KEY) throw new Error("Missing INTASEND_SECRET_KEY");

  const res = await fetch("https://payment.intasend.com/api/v1/checkout/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${INTASEND_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      phone_number: input.phone,
      api_ref: input.apiRef,
      redirect_url: input.redirectUrl,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`IntaSend checkout failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<{
    invoice_id?: string;
    url?: string;
    checkout_url?: string;
  }>;
}

export async function POST() {
  try {
    const store = await cookies();
    const checkoutSessionId = store.get(CHECKOUT_COOKIE)?.value?.trim();

    if (!checkoutSessionId) {
      return NextResponse.json({ error: "Missing checkout session" }, { status: 400 });
    }

    const [session] = await db
      .select()
      .from(checkoutSessions)
      .where(eq(checkoutSessions.id, checkoutSessionId))
      .limit(1);

    if (!session) {
      const res = NextResponse.json({ error: "Checkout session not found" }, { status: 400 });
      res.cookies.delete(CHECKOUT_COOKIE);
      return res;
    }

    // Only allow payment start for pending sessions
    if (session.status !== "pending") {
      return NextResponse.json(
        { error: "Checkout session is not payable", code: "SESSION_NOT_PAYABLE" },
        { status: 409 }
      );
    }

    const [cart] = await db
      .select({ status: carts.status })
      .from(carts)
      .where(eq(carts.id, session.cartSessionId))
      .limit(1);

    if (!cart || cart.status !== "locked") {
      return NextResponse.json(
        { error: "Cart is not locked for checkout", code: "CART_NOT_LOCKED" },
        { status: 409 }
      );
    }

    // compute totals from DB cart id, not cookies
    const { totals } = await getCheckoutCartSnapshotByCartId(session.cartSessionId);

    const baseUrl = process.env.APP_URL; // server-only
    if (!baseUrl) throw new Error("Missing APP_URL");

    const redirectUrl = `${baseUrl}/checkout/success?ref=${session.id}`;

    const intasend = await createIntaSendCheckout({
      amount: Number(totals.subtotal),
      currency: String(session.currency ?? "KES"),
      email: str(session.email),
      firstName: str(session.firstName),
      lastName: str(session.lastName),
      phone: normalizePhone(session.phone),
      apiRef: String(session.id),
      redirectUrl: redirectUrl,
    });

    const paymentReference = intasend.invoice_id ?? null;
    const checkoutUrl = intasend.checkout_url ?? intasend.url ?? null;

    if (!checkoutUrl) {
      throw new Error("IntaSend did not return a checkout URL");
    }

    if (paymentReference) {
      await db
        .update(checkoutSessions)
        .set({ paymentReference, updatedAt: new Date() })
        .where(eq(checkoutSessions.id, session.id));
    }

    return NextResponse.json({ checkoutUrl, paymentReference });
  } catch (error) {
    console.error("Checkout start error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
