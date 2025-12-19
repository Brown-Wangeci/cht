"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./CartDrawerItem.module.css";
import type { CartItem } from "@/lib/stores/cart";
import { useCartStore } from "@/lib/stores/cart";

type Props = {
  item: CartItem;
};

export default function CartDrawerItem({ item }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const decreaseItemQuantity = useCartStore((s) => s.decreaseItemQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const syncing = useCartStore((s) => s.syncing);
  const dirty = useCartStore((s) => s.dirty);
  const pending = useCartStore((s) => !!s.pendingByVariantId[item.variantId]);

  const disabled = syncing || dirty || pending;

  return (
    <div className={styles.item} aria-busy={disabled}>
      <Link href={`/products/${item.slug}`} className={styles.imageWrap}>
        <Image src={item.image} alt={item.name} fill className={styles.image} sizes="56px" />
      </Link>

      <div className={styles.info}>
        <Link href={`/products/${item.slug}`} className={styles.name}>
          {item.name}
        </Link>
        <p className={styles.meta}>
          {item.category} • {item.weightGrams}g
        </p>
      </div>

      <div className={styles.controls}>
        <div className={styles.qty}>
          <button
            type="button"
            className={styles.qtyBtn}
            onClick={() => decreaseItemQuantity(item.variantId)}
            disabled={disabled}
            aria-label="Decrease quantity"
          >
            −
          </button>

          <span className={styles.qtyVal}>{item.quantity}</span>

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
                stockOnHand: item.stockOnHand ?? 0,
              })
            }
            disabled={disabled}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          type="button"
          className={styles.remove}
          onClick={() => removeItem(item.variantId)}
          disabled={disabled}
          aria-label="Remove item"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
