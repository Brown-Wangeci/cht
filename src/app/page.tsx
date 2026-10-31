import styles from "./page.module.css";
import Hero from "@/components/landing-page/hero/Hero";
import Container from "@/components/common/container/Container";
import FeaturedProductsSection from "@/components/products/featured-products/FeaturedProductsSection";

// Featured products show stock badges; refresh at most every minute (the webhook also revalidates).
export const revalidate = 60;

export default function Home() {
  return (
    <div className={styles.page}>
      <Hero />

      <Container>
        {/* Featured Products */}
        <FeaturedProductsSection />
      </Container>
    </div>
  );
}
