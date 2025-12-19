import styles from "./Footer.module.css";
import Container from "@/components/common/container/Container";
import Link from "next/link";
import { getCompany } from "@/lib/company";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const company = getCompany();
  const brandName = company.brand.primaryBrand;
  const summary = company.company.summary;

  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.content}>
          <div className={styles.column}>
            <h3 className={styles.brand}>{brandName}</h3>
            <p className={styles.description}>{summary}</p>
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
            <h4 className={styles.heading}>Newsletter</h4>
            <p className={styles.description}>Stay updated with our latest offerings.</p>
            <div className={styles.newsletter}>
              <input type="email" placeholder="Your email" className={styles.input} />
              <button className={styles.button} disabled type="button">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>
            &copy; {currentYear} {brandName}. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
