import Link from "next/link";
import Image from "next/image";
import styles from "./Hero.module.css";
import Button from "@/components/ui/button/Button";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.imageWrapper}>
          <Image
            src="/images/hero-home.png"
            alt="Tea Plantation"
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
            Elevate Your Tea Experience
          </h1>
          <p className={styles.subtitle}>
            Discover our curated collection of premium teas, sourced from the
            world&apos;s finest gardens. Crafted for moments of tranquility.
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
