"use client";

import { ShoppingCart, Check } from "lucide-react";
import styles from "./ProductCardCartButton.module.css";
import { useCartStore } from "@/lib/stores/cart";
import type { Product } from "@/lib/products";

type Props = {
  product: Product;
};

export default function ProductCardCartButton({ product }: Props) {
  const inCart = useCartStore((s) => s.items.some((i) => i.id === product.id));
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);

  const syncing = useCartStore((s) => s.syncing);
  const pending = useCartStore((s) => !!s.pendingById[product.id]);
  const dirty = useCartStore((s) => s.dirty);

  const disabled = syncing || dirty || pending;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (disabled) return;

    if (inCart) removeItem(product.id);
    else addItem(product);
  };

  return (
    <button
      type="button"
      className={`${styles.cartButton} ${inCart ? styles.cartButtonActive : ""}`}
      onClick={handleClick}
      aria-label={inCart ? "Remove from cart" : "Add to cart"}
      disabled={disabled}
      aria-disabled={disabled}
      style={disabled ? { opacity: 0.7, cursor: "not-allowed" } : undefined}
    >
      {inCart ? <Check size={20} strokeWidth={2} /> : <ShoppingCart size={20} strokeWidth={2} />}
    </button>
  );
}
