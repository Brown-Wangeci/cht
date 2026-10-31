/**
 * DRAFT — requires business/legal review before launch.
 * Fees come from src/lib/pricing.ts (env-configured); items marked TODO(legal) are business commitments to confirm.
 */
import type { Metadata } from "next";
import Link from "next/link";
import ContentPage from "@/components/common/content-page/ContentPage";
import { getCompany } from "@/lib/company";
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, formatKES } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Delivery & Returns",
  description: "Delivery fees, timelines, and our returns policy.",
};

export default function DeliveryReturnsPage() {
  const { contacts } = getCompany();
  const email = contacts.support.email ?? contacts.primary.email;
  const phone = contacts.support.phone ?? contacts.primary.phone;

  return (
    <ContentPage title="Delivery & Returns" updated="30 October 2026">
      <h2>Delivery fees</h2>
      {DELIVERY_FEE > 0 ? (
        <p>
          Delivery costs a flat {formatKES(DELIVERY_FEE)} per order and is <strong>free</strong> on orders of{" "}
          {formatKES(FREE_DELIVERY_THRESHOLD)} or more. The fee is shown in your order summary before you pay.
        </p>
      ) : (
        <p>Delivery is free on all orders.</p>
      )}

      <h2>Where and when we deliver</h2>
      <p>
        {/* TODO(legal): confirm delivery areas and typical timelines. */}
        We deliver within Kenya. After your order is confirmed we will contact you on the phone number you provided to
        arrange delivery. Orders are usually dispatched within a few working days.
      </p>

      <h2>Damaged or incorrect items</h2>
      <p>
        {/* TODO(legal): confirm the reporting window. */}
        If your order arrives damaged, or you received the wrong item, contact us within 7 days of delivery with your
        order number and a photo. We will send a replacement or refund the affected items.
      </p>

      <h2>Returns</h2>
      <p>
        For hygiene and food-safety reasons we can only accept returns of unopened products in their original packaging.
        Opened products can only be returned if they are faulty.
      </p>

      <h2>Refunds</h2>
      <p>
        Approved refunds are made to your original payment method (M-Pesa, card or bank). See also our{" "}
        <Link href="/terms">Terms &amp; Conditions</Link>.
      </p>

      <h2>Need help?</h2>
      <p>
        Email <a href={`mailto:${email}`}>{email}</a> or call <a href={`tel:${phone}`}>{phone}</a>.
      </p>
    </ContentPage>
  );
}
