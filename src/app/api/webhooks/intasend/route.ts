import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { timingSafeEqual } from "crypto";
import { db } from "@/db";
import { intasendEvents } from "@/db/schema";
import { asUuid } from "@/lib/server/cookies";
import { getInvoiceStatus } from "@/lib/server/intasend";
import { completeCheckout, markCheckoutFailed } from "@/lib/server/orders";
import { sendOrderEmails } from "@/lib/server/email";
import { toMoney } from "@/lib/pricing";

/**
 * IntaSend collection_event webhook.
 * https://developers.intasend.com/guides/webhooks/
 *
 * - Authenticated by the `challenge` string configured in the IntaSend dashboard.
 * - The body is never trusted for payment state: COMPLETE is re-verified with the status API.
 * - Unexpected failures return 500 so the delivery shows as failed and can be replayed from the dashboard.
 */

type IntaSendWebhookPayload = {
  invoice_id?: string | null;
  api_ref?: string | null;
  state?: string | null;
  provider?: string | null;
  value?: string | number | null;
  currency?: string | null;
  challenge?: string | null;
  [key: string]: unknown;
};

const safeEqual = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
};

export async function POST(req: Request) {
  const expectedChallenge = process.env.INTASEND_WEBHOOK_CHALLENGE?.trim();
  if (!expectedChallenge) {
    console.error("IntaSend webhook: INTASEND_WEBHOOK_CHALLENGE is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let payload: IntaSendWebhookPayload;
  try {
    payload = (await req.json()) as IntaSendWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!safeEqual(String(payload.challenge ?? ""), expectedChallenge)) {
    return NextResponse.json({ error: "Invalid challenge" }, { status: 401 });
  }

  const invoiceId = String(payload.invoice_id ?? "").trim();
  const rawApiRef = String(payload.api_ref ?? "").trim();
  const checkoutSessionId = asUuid(rawApiRef);
  const state = String(payload.state ?? "").toUpperCase();

  try {
    // Keep an audit trail of every delivery (minus the shared secret).
    const stored = { ...payload };
    delete stored.challenge;
    await db.insert(intasendEvents).values({
      invoiceId: invoiceId || null,
      apiRef: rawApiRef || null,
      state: state || null,
      payload: stored,
    });

    // Not one of our checkouts (or a malformed event) — acknowledge so it isn't retried.
    if (!checkoutSessionId || !invoiceId) return NextResponse.json({ ok: true, ignored: true });

    if (state === "FAILED" || state === "CANCELED") {
      await markCheckoutFailed(checkoutSessionId);
      return NextResponse.json({ ok: true });
    }

    if (state !== "COMPLETE") return NextResponse.json({ ok: true });

    // Verify with IntaSend before fulfilling.
    const { invoice } = await getInvoiceStatus(invoiceId);
    const verifiedState = String(invoice?.state ?? "").toUpperCase();

    if (verifiedState !== "COMPLETE") {
      console.warn(`IntaSend webhook: invoice ${invoiceId} reported ${state} but status API says ${verifiedState}`);
      return NextResponse.json({ ok: true });
    }

    if (invoice?.api_ref && invoice.api_ref !== rawApiRef) {
      console.error(`IntaSend webhook: api_ref mismatch for invoice ${invoiceId}`);
      return NextResponse.json({ ok: true });
    }

    const result = await completeCheckout({
      checkoutSessionId,
      invoiceId,
      paidAmount: toMoney(invoice?.value ?? payload.value),
      currency: invoice?.currency ?? payload.currency ?? undefined,
      provider: invoice?.provider ?? payload.provider ?? undefined,
    });

    if (result.kind === "amount_mismatch") {
      console.error(
        `IntaSend webhook: amount mismatch for checkout ${checkoutSessionId} — expected ${result.expected}, paid ${result.paid} ${result.currency ?? ""}. Order NOT created; review manually.`
      );
    }

    if (result.kind === "created") {
      revalidatePath("/");
      revalidatePath("/products", "layout");
      await sendOrderEmails(result.order);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("IntaSend webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
