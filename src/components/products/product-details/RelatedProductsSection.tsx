// components/products/product-details/RelatedProductsSection.tsx
import { Product } from "@/lib/products";
import ProductCard from "@/components/products/product-card/ProductCard";
import Section from "@/components/ui/section/Section";
import Container from "@/components/common/container/Container";
import styles from "./RelatedProductsSection.module.css";

type Props = {
  products: Product[];
};

export default function RelatedProductsSection({ products }: Props) {
  if (!products.length) return null;

  return (
    <Section
    //   eyebrow="Related"
      title="You Might Also Like"
      align="center"
    >
      <div className={styles.grid}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </Section>
  );
}
