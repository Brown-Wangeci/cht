import { NextResponse } from "next/server";
import { db } from "@/db";
import { carts, checkoutSessions, orders, orderItems, intasendEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCheckoutCartSnapshotByCartId } from "@/lib/actions/checkout";

type IntaSendWebhookPayload = {
  invoice_id?: string;
  api_ref?: string;
  state?: string; // e.g. COMPLETE
  // ...they include more fields, we store whole payload
};

async function intasendCheckPaymentStatus(invoiceId: string) {
  const key = process.env.INTASEND_SECRET_KEY;
  if (!key) throw new Error("Missing INTASEND_SECRET_KEY");

  const res = await fetch("https://api.intasend.com/api/v1/payment/status/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ invoice_id: invoiceId }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`IntaSend status check failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<{ state?: string; invoice_id?: string }>;
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as IntaSendWebhookPayload;

    const apiRef = String(payload.api_ref ?? "").trim();     // our checkout_session id
    const invoiceId = String(payload.invoice_id ?? "").trim();

    // Record event (optional but recommended for debugging/retries)
    if (intasendEvents) {
      await db.insert(intasendEvents).values({
        apiRef: apiRef || null,
        invoiceId: invoiceId || null,
        payload,
      });
    }

    if (!apiRef || !invoiceId) {
      return NextResponse.json({ ok: true }); // don't break webhook retries
    }

    // 1) Lookup checkout session
    const [session] = await db
      .select()
      .from(checkoutSessions)
      .where(eq(checkoutSessions.id, apiRef))
      .limit(1);

    if (!session) return NextResponse.json({ ok: true });

    // 2) Verify payment status with IntaSend (don’t trust webhook alone)
    // Endpoint: POST https://api.intasend.com/api/v1/payment/status/ :contentReference[oaicite:2]{index=2}
    const status = await intasendCheckPaymentStatus(invoiceId);
    const state = String(status.state ?? payload.state ?? "").toUpperCase();

    if (state !== "COMPLETE" && state !== "COMPLETED") {
      // Not paid yet: keep pending
      return NextResponse.json({ ok: true });
    }

    // 3) Transaction: mark checkout paid, create order once, mark cart ordered
    await db.transaction(async (tx) => {
      // If already paid/order exists, exit idempotently
      const [existingOrder] = await tx
        .select()
        .from(orders)
        .where(eq(orders.checkoutSessionId, session.id))
        .limit(1);

      if (existingOrder) return;

      // Mark checkout paid + store payment reference
      await tx
        .update(checkoutSessions)
        .set({
          status: "paid",
          paymentReference: invoiceId,
          updatedAt: new Date(),
        })
        .where(eq(checkoutSessions.id, session.id));

      // Ensure cart is ordered (final)
      await tx
        .update(carts)
        .set({ status: "ordered" })
        .where(eq(carts.id, session.cartSessionId));

      // Snapshot items (server-trusted) by cartSessionId (no cookies)
      const { items, totals } = await getCheckoutCartSnapshotByCartId(session.cartSessionId);

      // Create order
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

          totalAmount: String(totals.subtotal),
          currency: session.currency ?? "KES",
          status: "paid",
        })
        .returning();

      // Create order items
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
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("IntaSend webhook error:", e);
    // Always 200-ish to avoid infinite retries while you debug;
    // once stable you can return 500 to retry.
    return NextResponse.json({ ok: true });
  }
}
