// components/products/product-details/ProductSummary.tsx
import { Product } from "@/lib/products";
import styles from "./ProductSummary.module.css";
import Button from "@/components/ui/button/Button";
import { Star, Truck, ShieldCheck } from "lucide-react";
import QuantitySelector from "./QuantitySelector";

type Props = {
  product: Product;
};

export default function ProductSummary({ product }: Props) {
  const { name, price, originalPrice, rating, reviewCount, origin } = product;

  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

  return (
    <section className={styles.summary}>
      <h1 className={styles.title}>{name}</h1>

      <p className={styles.subtitle}>
        An exquisite, full-bodied tea from the heart of {origin}.
      </p>

      <div className={styles.ratingRow}>
        <div className={styles.stars}>
          {Array.from({ length: 5 }).map((_, idx) => (
            <Star
              key={idx}
              size={16}
              className={idx < Math.round(rating) ? styles.starFilled : styles.starEmpty}
            />
          ))}
        </div>
        <span className={styles.ratingValue}>{rating.toFixed(1)}</span>
        <span className={styles.reviewCount}>({reviewCount} reviews)</span>
      </div>

      <div className={styles.priceBlock}>
        <div className={styles.priceRow}>
          <span className={styles.currentPrice}>KSH {price.toFixed(2)}</span>
          {hasDiscount && originalPrice && (
            <>
              <span className={styles.originalPrice}>
                KSH {originalPrice.toFixed(2)}
              </span>
              {discountPercent !== null && (
                <span className={styles.discount}>{discountPercent}% off</span>
              )}
            </>
          )}
        </div>
      </div>

      <div className={styles.controlsRow}>
        <QuantitySelector />
      </div>

      <div className={styles.actionsRow}>
        <Button variant="primary" className={styles.primaryButton}>
          Add to Cart
        </Button>
        <Button variant="secondary" className={styles.secondaryButton}>
          Buy Now
        </Button>
      </div>

      <div className={styles.trustRow}>
        <div className={styles.trustItem}>
          <Truck size={16} />
          <span>Free shipping over KSH 5,000</span>
        </div>
        <div className={styles.trustItem}>
          <ShieldCheck size={16} />
          <span>Secure payments</span>
        </div>
      </div>
    </section>
  );
}
