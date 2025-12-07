import Image from "next/image";
import { Product } from "@/lib/products";
import styles from "./ProductCard.module.css";
import Badge from "../badge/Badge";
import ProductCardCartButton from "../product-card-cart-button/ProductCardCartButton";
import Link from "next/link";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const {
    id,
    name,
    image,
    price,
    originalPrice,
    isBestSeller,
    isNew,
  } = product;

  const hasDiscount = originalPrice && originalPrice > price;

  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

  let badgeLabel: string | null = null;
  let badgeVariant: any = "default";

  if (isBestSeller) {
    badgeLabel = "SHOP";
    badgeVariant = "shop";
  } else if (isNew) {
    badgeLabel = "NEW";
    badgeVariant = "new";
  }

  return (
    <Link href={`/products/${product.slug}`} passHref>
      <article className={styles.card}>
        <div className={styles.imageWrapper}>
          {badgeLabel && (
            <div className={styles.badgeWrapper}>
              <Badge label={badgeLabel} variant={badgeVariant} />
            </div>
          )}

          {/* Client-side cart button */}
          <ProductCardCartButton productId={id} />

          <Image
            src={image}
            alt={name}
            fill
            className={styles.image}
            sizes="(min-width: 1024px) 300px, 50vw"
          />
        </div>

        <div className={styles.info}>
          <h3 className={styles.name}>{name}</h3>

          <div className={styles.priceRow}>
            {hasDiscount && originalPrice && (
              <span className={styles.originalPrice}>
                KSH {originalPrice.toFixed(2)}
              </span>
            )}
            <span className={styles.currentPrice}>
              KSH {price.toFixed(2)}
            </span>

            {hasDiscount && discountPercent !== null && (
              <span className={styles.discount}>{discountPercent}% off</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
