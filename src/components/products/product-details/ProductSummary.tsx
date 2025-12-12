"use client";

import { useMemo } from "react";
import type { Product } from "@/lib/products";
import styles from "./ProductSummary.module.css";
import Button from "@/components/ui/button/Button";
import { Truck, ShieldCheck } from "lucide-react";
import QuantitySelector from "./QuantitySelector";
import { useCartStore } from "@/lib/stores/cart";

type Props = {
  product: Product & { soldOut?: boolean };
};

export default function ProductSummary({ product }: Props) {
  const { name, price, originalPrice, origin } = product;
  const soldOut = product.soldOut ?? false;

  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const decreaseItemQuantity = useCartStore((s) => s.decreaseItemQuantity);
  const openCart = useCartStore((s) => s.openCart);

  const cartItem = useMemo(
    () => items.find((i) => i.id === product.id),
    [items, product.id]
  );

  const isInCart = !!cartItem;

  // Reads directly from cart if present, else defaults to 1
  const quantity = cartItem?.quantity ?? 1;

  const { hasDiscount, discountPercent } = useMemo(() => {
    const has = !!originalPrice && originalPrice > price && !soldOut;
    return {
      hasDiscount: has,
      discountPercent: has
        ? Math.round(((originalPrice! - price) / originalPrice!) * 100)
        : null,
    };
  }, [originalPrice, price, soldOut]);

  const handleIncrement = () => {
    if (soldOut) return;
    // Works for both: not-in-cart (adds) and in-cart (increments)
    addItem(product);
  };

  const handleDecrement = () => {
    if (soldOut) return;
    if (!isInCart) return; // not in cart -> do nothing
    decreaseItemQuantity(product.id);
  };

  const handlePrimaryClick = () => {
    if (soldOut) return;

    if (isInCart) {
      openCart(); // ✅ open drawer if already added
      return;
    }

    addItem(product); // ✅ add if not in cart
    openCart(); // optional: comment out if you don't want auto-open on first add
  };

  return (
    <section className={styles.summary}>
      <h1 className={styles.title}>{name}</h1>

      <p className={styles.subtitle}>
        An exquisite, full-bodied tea from the heart of {origin}.
      </p>

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

      {!soldOut && (
        <div className={styles.controlsRow}>
          <QuantitySelector
            value={quantity}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            min={1}
            max={99}
            disableDecrement={!isInCart}
          />
        </div>
      )}

      <div className={styles.actionsRow}>
        <Button
          variant="primary"
          className={styles.primaryButton}
          disabled={soldOut}
          onClick={handlePrimaryClick}
        >
          {soldOut ? "Sold Out" : isInCart ? "Added to Cart" : "Add to Cart"}
        </Button>

        {!soldOut && (
          <Button variant="secondary" className={styles.secondaryButton}>
            Buy Now
          </Button>
        )}
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
