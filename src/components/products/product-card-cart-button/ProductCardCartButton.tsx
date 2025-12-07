"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import styles from "./ProductCardCartButton.module.css";

type ProductCardCartButtonProps = {
  productId: string;
};

export default function ProductCardCartButton({
  productId,
}: ProductCardCartButtonProps) {
  const [inCart, setInCart] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setInCart((prev) => !prev);

    // later: plug into real cart store using productId
  };

  return (
    <button
      type="button"
      className={`${styles.cartButton} ${
        inCart ? styles.cartButtonActive : ""
      }`}
      onClick={handleClick}
      aria-label={inCart ? "Remove from cart" : "Add to cart"}
    >
      {inCart ? (
        <Check size={20} strokeWidth={2} />
      ) : (
        <ShoppingCart size={20} strokeWidth={2} />
      )}
    </button>
  );
}
