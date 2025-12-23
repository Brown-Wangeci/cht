import { db } from "@/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { checkoutSessions, carts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCheckoutCartSnapshotByCartId } from "@/lib/actions/checkout";

const CHECKOUT_COOKIE = "checkout_session";

const str = (v: unknown) => String(v ?? "").trim();
const normalizePhone = (phone: string) => String(phone ?? "").replace(/[^\d+]/g, "");

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

    const { totals } = await getCheckoutCartSnapshotByCartId(session.cartSessionId);

    const publishableKey = process.env.INTASEND_PUBLISHABLE_KEY;
    const secretKey = process.env.INTASEND_SECRET_KEY;
    const isTest = String(process.env.INTASEND_TEST_ENVIRONMENT ?? "true") === "true";
    const appUrl = process.env.APP_URL;

    if (!publishableKey) throw new Error("Missing INTASEND_PUBLISHABLE_KEY");
    if (!secretKey) throw new Error("Missing INTASEND_SECRET_KEY");
    if (!appUrl) throw new Error("Missing APP_URL");

    // ✅ docs-based approach: SDK
    const IntaSend = (await import("intasend-node")).default;
    const intasend = new IntaSend(publishableKey, secretKey, isTest);
    const collection = intasend.collection();

    const redirectUrl = `${appUrl}/checkout/success?ref=${session.id}`;

    const resp = await collection.charge({
      first_name: str(session.firstName),
      last_name: str(session.lastName),
      email: str(session.email),
      phone_number: normalizePhone(session.phone),
      host: appUrl,                 // ✅ important in docs
      amount: Number(totals.subtotal),
      currency: String(session.currency ?? "KES"),
      api_ref: String(session.id),  // ✅ your internal reference
      redirect_url: redirectUrl,
    });

    const checkoutUrl = resp?.url as string | undefined;
    const invoiceId = (resp?.invoice_id || resp?.invoice?.invoice_id) as string | undefined;

    if (!checkoutUrl) {
      // return a useful error instead of generic 500
      return NextResponse.json(
        { error: "IntaSend did not return a checkout url", debug: resp ?? null },
        { status: 502 }
      );
    }

    if (invoiceId) {
      await db
        .update(checkoutSessions)
        .set({ paymentReference: invoiceId, updatedAt: new Date() })
        .where(eq(checkoutSessions.id, session.id));
    }

    return NextResponse.json({ checkoutUrl, paymentReference: invoiceId ?? null });
  } catch (error: any) {
    console.error("Checkout start error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Checkout failed" },
      { status: 500 }
    );
  }
}
