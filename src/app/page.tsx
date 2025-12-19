import styles from "./page.module.css";
import Hero from "@/components/landing-page/hero/Hero";
import Container from "@/components/common/container/Container";
import FeaturedProductsSection from "@/components/products/featured-products/FeaturedProductsSection";

export default async function Home() {


  return (
    <div className={styles.page}>
      {/* <ProductGrid products={products} /> */}
      <Hero />

      <Container>
        {/* Featured Products */}
        <FeaturedProductsSection />
      </Container>
    </div>
  );
}
