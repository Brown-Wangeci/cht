import styles from "./Footer.module.css";
import Container from "@/components/common/container/Container";
import Link from "next/link";
import { getCompany } from "@/lib/company";
import NewsletterForm from "./NewsletterForm";

const SOCIAL_LABELS = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X",
  youtube: "YouTube",
} as const;

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const company = getCompany();
  const brandName = company.brand.primaryBrand;
  const summary = company.company.summary;
  const contact = company.contacts.primary;
  const socials = (Object.keys(SOCIAL_LABELS) as (keyof typeof SOCIAL_LABELS)[]).filter((k) => company.social[k]);

  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.content}>
          <div className={styles.column}>
            <h3 className={styles.brand}>{brandName}</h3>
            <p className={styles.description}>{summary}</p>
            <p className={styles.description}>
              <a href={`mailto:${contact.email}`} className={styles.link}>{contact.email}</a>
              <br />
              <a href={`tel:${contact.phone}`} className={styles.link}>{contact.phone}</a>
            </p>
          </div>

          <div className={styles.column}>
            <h4 className={styles.heading}>Quick Links</h4>
            <div className={styles.links}>
              <Link href="/" className={styles.link}>
                Home
              </Link>
              <Link href="/products" className={styles.link}>
                Shop
              </Link>
              <Link href="/about" className={styles.link}>
                Our Story
              </Link>
              <Link href="/contact" className={styles.link}>
                Contact
              </Link>
            </div>
          </div>

          <div className={styles.column}>
            <h4 className={styles.heading}>Help</h4>
            <div className={styles.links}>
              <Link href="/delivery-returns" className={styles.link}>
                Delivery &amp; Returns
              </Link>
              <Link href="/terms" className={styles.link}>
                Terms &amp; Conditions
              </Link>
              <Link href="/privacy" className={styles.link}>
                Privacy Policy
              </Link>
            </div>
          </div>

          <div className={styles.column}>
            <h4 className={styles.heading}>Newsletter</h4>
            <p className={styles.description}>Stay updated with our latest offerings.</p>
            <NewsletterForm />
            {socials.length > 0 && (
              <div className={styles.links}>
                {socials.map((k) => (
                  <a key={k} href={company.social[k]!} className={styles.link} target="_blank" rel="noopener noreferrer">
                    {SOCIAL_LABELS[k]}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.bottom}>
          <p>
            &copy; {currentYear} {company.company.legalName}. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
