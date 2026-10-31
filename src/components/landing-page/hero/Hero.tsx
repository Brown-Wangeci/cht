import Link from "next/link";
import Image from "next/image";
import styles from "./Hero.module.css";
import { ArrowRight } from "lucide-react"
import { getCompany } from "@/lib/company";

export default function Hero() {
  const company = getCompany();

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.imageWrapper}>
          <div className={styles.drift}>
            <Image
              src="/images/hero-home-1.png"
              alt={`${company.brand.primaryBrand} Tea Plantation`}
              fill
              className={styles.image}
              priority
              quality={90}
              sizes="(max-width: 900px) 100vw, 100vw"
            />
          </div>
        </div>

        <div className={styles.content}>
          <h1 className={styles.title}>
            {company.company.tradeNames[1]}
          </h1>

          <p className={styles.subtitle}>
            {company.brand.taglines[1]}
          </p>

          <div className={styles.actions}>
            <Link href="/products" className={styles.cta}>
              <span>Shop Now</span>
              <ArrowRight className={styles.ctaIcon} size={16} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
