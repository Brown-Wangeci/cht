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

  return (
    <div className={styles.item}>
      <Link href={`/products/${item.slug}`} className={styles.imageWrap}>
        <Image src={item.images[0]} alt={item.name} fill className={styles.image} sizes="56px" />
      </Link>

      <div className={styles.info}>
        <Link href={`/products/${item.slug}`} className={styles.name}>
          {item.name}
        </Link>

        <p className={styles.meta}>
          {item.category}
        </p>
      </div>

      <div className={styles.controls}>
        <div className={styles.qty}>
          <button
            type="button"
            className={styles.qtyBtn}
            onClick={() => decreaseItemQuantity(item.id)}
            aria-label="Decrease quantity"
          >
            −
          </button>

          <span className={styles.qtyVal}>{item.quantity}</span>

          <button
            type="button"
            className={styles.qtyBtn}
            onClick={() => addItem(item)}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          type="button"
          className={styles.remove}
          onClick={() => removeItem(item.id)}
          aria-label="Remove item"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
