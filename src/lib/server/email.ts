import "server-only";
import { Resend } from "resend";
import { getCompany } from "@/lib/company";
import { formatKES } from "@/lib/pricing";
import { escapeHtml } from "./escape";

/**
 * Transactional email via Resend. Entirely optional: without RESEND_API_KEY nothing is sent,
 * and a send failure is logged but never breaks order processing.
 *
 * Env: RESEND_API_KEY, EMAIL_FROM ("Kiriti Tea <orders@yourdomain>"), ORDER_NOTIFICATION_EMAIL
 */

export type OrderEmailData = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  country: string | null;
  notes: string | null;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  items: { name: string; weightGrams: number; price: number; quantity: number }[];
};

const shortId = (id: string) => id.slice(0, 8).toUpperCase();

function renderItems(order: OrderEmailData) {
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:6px 0">${escapeHtml(i.name)} · ${i.weightGrams}g × ${i.quantity}</td>
        <td style="padding:6px 0;text-align:right">${formatKES(i.price * i.quantity)}</td>
      </tr>`
    )
    .join("");

  return `<table style="width:100%;border-collapse:collapse;font-size:14px">
    ${rows}
    <tr><td colspan="2" style="border-top:1px solid #e5e7eb;padding-top:8px"></td></tr>
    <tr><td>Subtotal</td><td style="text-align:right">${formatKES(order.subtotal)}</td></tr>
    <tr><td>Delivery</td><td style="text-align:right">${order.shippingFee > 0 ? formatKES(order.shippingFee) : "Free"}</td></tr>
    <tr><td><strong>Total paid</strong></td><td style="text-align:right"><strong>${formatKES(order.totalAmount)}</strong></td></tr>
  </table>`;
}

function renderAddress(order: OrderEmailData) {
  return [
    `${order.firstName} ${order.lastName}`,
    order.phone,
    order.addressLine1,
    order.addressLine2,
    [order.city, order.country].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join("<br/>");
}

const wrap = (body: string) =>
  `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#111;line-height:1.5">${body}</div>`;

export async function sendOrderEmails(order: OrderEmailData) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    console.info(`[email] RESEND_API_KEY/EMAIL_FROM not set — skipping emails for order ${order.id}`);
    return;
  }

  const company = getCompany();
  const brand = company.brand.primaryBrand;
  const storeEmail = process.env.ORDER_NOTIFICATION_EMAIL?.trim() || company.contacts.primary.email;
  const resend = new Resend(apiKey);
  const ref = shortId(order.id);

  const customerHtml = wrap(`
    <h2 style="margin:0 0 8px">Thank you for your order, ${escapeHtml(order.firstName)}!</h2>
    <p>We've received your payment and are preparing your order <strong>#${ref}</strong>.</p>
    ${renderItems(order)}
    <h3 style="margin:24px 0 4px;font-size:15px">Delivering to</h3>
    <p style="margin:0;font-size:14px">${renderAddress(order)}</p>
    <p style="margin-top:24px;font-size:13px;color:#555">Questions? Reply to this email or call ${escapeHtml(company.contacts.primary.phone)}.</p>
    <p style="font-size:13px;color:#555">— ${escapeHtml(brand)}</p>`);

  const storeHtml = wrap(`
    <h2 style="margin:0 0 8px">New paid order #${ref}</h2>
    <p style="font-size:14px">${escapeHtml(order.email)} · ${escapeHtml(order.phone)}</p>
    ${renderItems(order)}
    <h3 style="margin:24px 0 4px;font-size:15px">Deliver to</h3>
    <p style="margin:0;font-size:14px">${renderAddress(order)}</p>
    ${order.notes ? `<h3 style="margin:24px 0 4px;font-size:15px">Notes</h3><p style="margin:0;font-size:14px">${escapeHtml(order.notes)}</p>` : ""}
    <p style="font-size:12px;color:#777">Order ID: ${escapeHtml(order.id)}</p>`);

  const results = await Promise.allSettled([
    resend.emails.send(
      {
        from,
        to: order.email,
        replyTo: storeEmail,
        subject: `${brand} — order #${ref} confirmed`,
        html: customerHtml,
      },
      { idempotencyKey: `order-customer-${order.id}` }
    ),
    resend.emails.send(
      {
        from,
        to: storeEmail,
        replyTo: order.email,
        subject: `New order #${ref} — ${formatKES(order.totalAmount)}`,
        html: storeHtml,
      },
      { idempotencyKey: `order-store-${order.id}` }
    ),
  ]);

  for (const r of results) {
    if (r.status === "rejected") console.error("[email] send failed:", r.reason);
    else if (r.value.error) console.error("[email] send failed:", r.value.error);
  }
}
