import Link from "next/link";
import Image from "next/image";
import styles from "./Hero.module.css";
import Button from "@/components/ui/button/Button";
import { getCompany } from "@/lib/company";

export default function Hero() {
  const company = getCompany();

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.imageWrapper}>
          <Image
            src="/images/hero-home.png"
            alt={`${company.brand.primaryBrand} Tea Plantation`}
            fill
            className={styles.image}
            priority
            quality={90}
            sizes="(max-width: 900px) 100vw, 100vw"
          />
          <div className={styles.overlay}></div>
        </div>

        <div className={styles.content}>
          <h1 className={styles.title}>
            {company.brand.taglines[1]}
            {/* Elevate Your Tea Experience */}
          </h1>

          <p className={styles.subtitle}>
            {company.company.summary}
          </p>

          <div className={styles.actions}>
            <Link href="/products">
              <Button variant="primary" className={styles.cta}>
                Shop Collection
              </Button>
            </Link>

            <Link href="/about">
              <Button variant="secondary" className={styles.cta}>
                Our Story
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
