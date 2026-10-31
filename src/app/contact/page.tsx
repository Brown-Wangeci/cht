import type { Metadata } from "next";
import ContentPage from "@/components/common/content-page/ContentPage";
import styles from "@/components/common/content-page/ContentPage.module.css";
import { getCompany } from "@/lib/company";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Kiriti Tea team about orders, wholesale or anything else.",
};

const whatsappNumber = (phone: string) => phone.replace(/\D/g, "");

export default function ContactPage() {
  const { contacts, location, company } = getCompany();
  const email = contacts.support.email ?? contacts.primary.email;
  const phone = contacts.support.phone ?? contacts.primary.phone;

  return (
    <ContentPage
      eyebrow="Contact"
      title="We’d love to hear from you"
      intro="Questions about an order, our teas, or wholesale? Reach us by email, phone or WhatsApp."
    >
      <div className={styles.grid}>
        <div className={styles.card}>
          <h2>Email</h2>
          <p>
            <a href={`mailto:${email}`}>{email}</a>
          </p>
        </div>

        <div className={styles.card}>
          <h2>Phone &amp; WhatsApp</h2>
          <p>
            <a href={`tel:${phone}`}>{phone}</a>
            <br />
            <a href={`https://wa.me/${whatsappNumber(phone)}`} target="_blank" rel="noopener noreferrer">
              Message us on WhatsApp
            </a>
          </p>
        </div>

        <div className={styles.card}>
          <h2>{location.label}</h2>
          <address style={{ fontStyle: "normal" }}>
            {company.legalName}
            <br />
            {location.addressLine1}
            <br />
            {location.addressLine2}
            <br />
            {location.city} {location.postalCode}, {location.country}
            <br />
            {location.poBox}
          </address>
        </div>
      </div>

      <p>
        Have a question about an existing order? Include your order number (from your confirmation email) so we can
        help you faster.
      </p>
    </ContentPage>
  );
}
