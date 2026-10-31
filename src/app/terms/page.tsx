/**
 * DRAFT — requires legal review before launch.
 * Update `updated` once approved.
 */
import type { Metadata } from "next";
import Link from "next/link";
import ContentPage from "@/components/common/content-page/ContentPage";
import { getCompany } from "@/lib/company";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms that apply when you shop with us.",
};

export default function TermsPage() {
  const { company, contacts } = getCompany();
  const email = contacts.support.email ?? contacts.primary.email;

  return (
    <ContentPage title="Terms & Conditions" updated="30 October 2026">
      <p>
        These terms apply to purchases made on this website, operated by {company.legalName}. By placing an order you
        agree to them.
      </p>

      <h2>Products and prices</h2>
      <p>
        All prices are in Kenyan Shillings (KES) and include applicable taxes unless stated otherwise. Product images are
        for illustration; packaging may vary. We may change prices or withdraw products at any time, but the price you
        pay is the one shown at checkout.
      </p>

      <h2>Orders and payment</h2>
      <p>
        Payment is taken at checkout through our payment provider, IntaSend (M-Pesa, card or bank). Your order is
        confirmed once payment has been verified and we send you a confirmation. If a product becomes unavailable after
        you have paid, we will contact you and offer an alternative or a full refund for that item.
      </p>

      <h2>Delivery</h2>
      <p>
        Delivery fees, areas and timelines are described in our <Link href="/delivery-returns">Delivery &amp; Returns</Link>{" "}
        policy. Please make sure your delivery details and phone number are correct.
      </p>

      <h2>Returns and refunds</h2>
      <p>
        Because our products are food items, returns are handled as set out in our{" "}
        <Link href="/delivery-returns">Delivery &amp; Returns</Link> policy. Approved refunds are made to the original
        payment method.
      </p>

      <h2>Liability</h2>
      <p>
        Nothing in these terms limits rights you have under the Consumer Protection Act, 2012. To the extent permitted by
        law, our liability for any order is limited to the amount you paid for it.
      </p>

      <h2>Privacy</h2>
      <p>
        We handle your personal data as described in our <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of Kenya, and the courts of Kenya have jurisdiction.</p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Email <a href={`mailto:${email}`}>{email}</a>.
      </p>
    </ContentPage>
  );
}
