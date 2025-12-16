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

  const syncing = useCartStore((s) => s.syncing);
  const pending = useCartStore((s) => !!s.pendingById[product.id]);
  const dirty = useCartStore((s) => s.dirty);

  const disabled = soldOut || syncing || dirty || pending;

  const cartItem = useMemo(
    () => items.find((i) => i.id === product.id),
    [items, product.id]
  );

  const isInCart = !!cartItem;
  const quantity = cartItem?.quantity ?? 1;

  const { hasDiscount, discountPercent } = useMemo(() => {
    const has = !!originalPrice && originalPrice > price && !soldOut;
    return {
      hasDiscount: has,
      discountPercent: has ? Math.round(((originalPrice! - price) / originalPrice!) * 100) : null,
    };
  }, [originalPrice, price, soldOut]);

  const handleIncrement = () => {
    if (disabled) return;
    addItem(product);
  };

  const handleDecrement = () => {
    if (disabled) return;
    if (!isInCart) return;
    decreaseItemQuantity(product.id);
  };

  const handlePrimaryClick = () => {
    if (disabled) return;

    if (isInCart) {
      openCart();
      return;
    }

    addItem(product);

    openCart();
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
              <span className={styles.originalPrice}>KSH {originalPrice.toFixed(2)}</span>
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
            disableDecrement={!isInCart || disabled}
            disableIncrement={disabled}
          />
        </div>
      )}

      <div className={styles.actionsRow}>
        <Button
          variant="primary"
          className={styles.primaryButton}
          disabled={disabled}
          onClick={handlePrimaryClick}
        >
          {soldOut
            ? "Sold Out"
            : syncing || pending || dirty
              ? "Updating…"
              : isInCart
                ? "View in Cart"
                : "Add to Cart"}
        </Button>

        {!soldOut && (
          <Button variant="secondary" className={styles.secondaryButton} disabled={disabled}>
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
