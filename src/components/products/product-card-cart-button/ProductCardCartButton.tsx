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

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault(); // important if button sits inside a Link card
    if (inCart) removeItem(product.id);
    else addItem(product);
  };

  return (
    <button
      type="button"
      className={`${styles.cartButton} ${inCart ? styles.cartButtonActive : ""}`}
      onClick={handleClick}
      aria-label={inCart ? "Remove from cart" : "Add to cart"}
    >
      {inCart ? <Check size={20} strokeWidth={2} /> : <ShoppingCart size={20} strokeWidth={2} />}
    </button>
  );
}
