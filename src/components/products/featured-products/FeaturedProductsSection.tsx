import Container from "@/components/common/container/Container";
import ProductCard from "@/components/products/product-card/ProductCard";
import { getFeaturedProducts } from "@/lib/products";
import styles from "./FeaturedProductsSection.module.css";
import CustomLink from "@/components/ui/custom-link/CustomLink";
import Section from "@/components/ui/section/Section";

export default async function FeaturedProductsSection() {
  const products = await getFeaturedProducts();

  if (!products.length) return null;

  return (
        <Container>
            <Section
                eyebrow="Featured"
                title="Best-selling teas"
                subtitle="A curated selection of our most loved teas, crafted for daily ritual and slow moments."
                align="left"
                paddingBlock="var(--space-2xl)"
                >
                <div className={styles.productsGrid}>
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                {/* Desktop version (aligned right) */}
                <div className={styles.desktopLink}>
                    <CustomLink href="/products" text="More products..." align="right" />
                </div>

                {/* Mobile version (centered) */}
                <div className={styles.mobileLink}>
                    <CustomLink href="/products" text="More products..." align="center" />
                </div>
            </Section>
        </Container>
  );
}
