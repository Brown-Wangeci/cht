"use client";

import Link from "next/link";
import styles from "./CartDrawerItem.module.css";
import type { CartItem } from "@/lib/stores/cart";
import { useCartStore } from "@/lib/stores/cart";
import ProductImage from "@/components/ui/product-image/ProductImage";
import { formatKES } from "@/lib/pricing";

type Props = {
  item: CartItem;
};

export default function CartDrawerItem({ item }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const decreaseItemQuantity = useCartStore((s) => s.decreaseItemQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const closeCart = useCartStore((s) => s.closeCart);

  const syncing = useCartStore((s) => s.syncing);
  const dirty = useCartStore((s) => s.dirty);
  const locked = useCartStore((s) => s.locked);
  const pending = useCartStore((s) => !!s.pendingByVariantId[item.variantId]);

  const disabled = syncing || dirty || pending || locked;
  const maxQty = Math.min(99, item.stockOnHand ?? 99);

  return (
    <div className={styles.item} aria-busy={syncing || pending}>
      <Link href={`/products/${item.slug}`} className={styles.imageWrap} onClick={closeCart}>
        <ProductImage src={item.image} alt={item.name} fill className={styles.image} sizes="56px" />
      </Link>

      <div className={styles.info}>
        <Link href={`/products/${item.slug}`} className={styles.name} onClick={closeCart}>
          {item.name}
        </Link>
        <p className={styles.meta}>
          {item.category} • {item.weightGrams}g • {formatKES(item.price)}
        </p>
      </div>

      <div className={styles.controls}>
        <div className={styles.qty}>
          <button
            type="button"
            className={styles.qtyBtn}
            onClick={() => decreaseItemQuantity(item.variantId)}
            disabled={disabled}
            aria-label={`Decrease quantity of ${item.name}`}
          >
            −
          </button>

          <span className={styles.qtyVal} aria-live="polite">{item.quantity}</span>

          <button
            type="button"
            className={styles.qtyBtn}
            onClick={() =>
              addItem({
                variantId: item.variantId,
                productId: item.productId,
                slug: item.slug,
                name: item.name,
                category: item.category,
                image: item.image,
                weightGrams: item.weightGrams,
                price: item.price,
                stockOnHand: item.stockOnHand,
              })
            }
            disabled={disabled || item.quantity >= maxQty}
            aria-label={`Increase quantity of ${item.name}`}
          >
            +
          </button>
        </div>

        <button
          type="button"
          className={styles.remove}
          onClick={() => removeItem(item.variantId)}
          disabled={disabled}
          aria-label={`Remove ${item.name}`}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
