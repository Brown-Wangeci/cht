import type { ProductWithVariants } from "@/types/product";
import styles from './ProductGrid.module.css';
import ProductCard from '../product-card/ProductCard';
import Container from '@/components/common/container/Container';

type ProductGridProps = {
  products: ProductWithVariants[];
};

export default function ProductGrid({ products }: ProductGridProps) {
  return (
    <Container>
      <div className={styles.grid}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Container>
  );
}
