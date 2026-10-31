import Link from "next/link";
import type { ProductWithVariants } from "@/types/product";
import Badge, { BadgeVariant } from "../badge/Badge";
import ProductCardCartButton from "../product-card-cart-button/ProductCardCartButton";
import styles from "./ProductCard.module.css";
import RunningLowBadge from "../running-low-badge/RunningLowBadge";
import ProductImage from "@/components/ui/product-image/ProductImage";
import { formatKES } from "@/lib/pricing";

type ProductCardProps = {
  product: ProductWithVariants;
};

export default function ProductCard({ product }: ProductCardProps) {
  const { name, images = [], isBestSeller, isNew, slug, variants } = product;

  const minPrice =
    variants?.length ? Math.min(...variants.map((v) => v.price)) : 0;

  const anyInStock = variants?.some((v) => (v.stockOnHand ?? 0) > 0) ?? false;

  let badgeLabel: string = "SHOP";
  let badgeVariant: BadgeVariant = "shop";

  if (!anyInStock) {
    badgeLabel = "SOLD OUT";
    badgeVariant = "soldOut";
  } else if (isBestSeller) {
    badgeLabel = "SHOP";
    badgeVariant = "shop";
  } else if (isNew) {
    badgeLabel = "NEW";
    badgeVariant = "new";
  }

  const runningLow = variants?.some(
    (v) => (v.stockOnHand ?? 0) > 0 && (v.stockOnHand ?? 0) <= 5
  );

  const from = variants?.length && variants.length > 1;

  return (
    <article className={`${styles.card} ${!anyInStock ? styles.soldOut : ""}`}>
      <Link href={`/products/${slug}`} className={styles.clickArea}>
        <div className={styles.imageWrapper}>
          {badgeLabel && (
            <div className={styles.badgeWrapper}>
              <Badge label={badgeLabel} variant={badgeVariant} />
            </div>
          )}
          {runningLow && (
            <div className={styles.runningLowBadgeWrapper}>
              <RunningLowBadge />
            </div>
          )}

          <ProductImage
            src={images[0]}
            alt={name}
            fill
            className={styles.image}
            sizes="(min-width: 1024px) 300px, 50vw"
          />
        </div>

        <div className={styles.info}>
          <h3 className={styles.name}>{name}</h3>

          <div className={styles.priceRow}>
            <span className={styles.currentPrice}> {from && <span className={styles.from} >From</span>}{formatKES(minPrice)}</span>
          </div>
        </div>
      </Link>

      {anyInStock && <ProductCardCartButton product={product} />}
    </article>
  );
}
