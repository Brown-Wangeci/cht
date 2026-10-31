/**
 * DRAFT — requires legal review before launch.
 * Written against the Kenya Data Protection Act, 2019; confirm with counsel and update `updated` when approved.
 */
import type { Metadata } from "next";
import Link from "next/link";
import ContentPage from "@/components/common/content-page/ContentPage";
import { getCompany } from "@/lib/company";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How we collect, use and protect your personal data.",
};

export default function PrivacyPage() {
  const { company, contacts, location } = getCompany();
  const email = contacts.support.email ?? contacts.primary.email;

  return (
    <ContentPage title="Privacy Policy" updated="30 October 2026">
      <p>
        {company.legalName} (“we”, “us”) operates this online shop. This policy explains what personal data we collect
        when you browse or buy from us, why we collect it, and the rights you have under the Kenya Data Protection Act,
        2019.
      </p>

      <h2>Data we collect</h2>
      <ul>
        <li>
          <strong>Order and delivery details</strong> — your name, email address, phone number, delivery address and any
          delivery notes you provide at checkout.
        </li>
        <li>
          <strong>Order history</strong> — the products, quantities and amounts of your purchases.
        </li>
        <li>
          <strong>Payment information</strong> — payments are processed by our payment provider, IntaSend. We receive a
          payment reference and status; we never see or store your full card or M-Pesa PIN details.
        </li>
        <li>
          <strong>Newsletter</strong> — your email address, if you subscribe.
        </li>
        <li>
          <strong>Technical data</strong> — essential cookies that keep your cart and checkout working (see below).
        </li>
      </ul>

      <h2>How we use your data</h2>
      <ul>
        <li>To process, deliver and support your orders (performance of a contract).</li>
        <li>To send order confirmations and service messages about your purchase.</li>
        <li>To send our newsletter, only if you subscribed (consent). You can unsubscribe at any time.</li>
        <li>To meet legal, tax and accounting obligations.</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>We share only what is needed with service providers acting on our behalf:</p>
      <ul>
        <li>IntaSend — payment processing.</li>
        <li>Our delivery partners — to deliver your order.</li>
        <li>Our email provider — to send order confirmations.</li>
        <li>Our hosting and database providers — to run this website.</li>
      </ul>
      <p>We do not sell your personal data.</p>

      <h2>Cookies</h2>
      <p>
        We use only essential cookies: one that remembers your cart, one that keeps your checkout session, and one that
        lets you view your order confirmation after payment. Your cart contents are also saved in your browser’s local
        storage. We do not use advertising or tracking cookies.
      </p>

      <h2>How long we keep it</h2>
      <p>
        {/* TODO(legal): confirm retention periods. */}
        Order records are kept for as long as required for tax and accounting purposes. Abandoned checkout details and
        newsletter subscriptions are deleted on request or when no longer needed.
      </p>

      <h2>Your rights</h2>
      <p>
        You have the right to be informed about, access, correct, and request deletion of your personal data, to object
        to its processing, and to withdraw consent at any time. To exercise these rights, email{" "}
        <a href={`mailto:${email}`}>{email}</a>. You may also lodge a complaint with the Office of the Data Protection
        Commissioner (ODPC) of Kenya.
      </p>

      <h2>Contact</h2>
      <p>
        {company.legalName}, {location.addressLine1}, {location.addressLine2}, {location.city}, {location.country}.
        Email: <a href={`mailto:${email}`}>{email}</a>. See also our <Link href="/terms">Terms &amp; Conditions</Link>.
      </p>
    </ContentPage>
  );
}
