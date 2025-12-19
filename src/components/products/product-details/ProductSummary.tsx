"use client";

import { useMemo, useState, useEffect } from "react";
import type { ProductWithVariants } from "@/lib/products";
import styles from "./ProductSummary.module.css";
import Button from "@/components/ui/button/Button";
import { Truck, ShieldCheck, ClockFading } from "lucide-react";
import QuantitySelector from "./QuantitySelector";
import { useCartStore } from "@/lib/stores/cart";

type Props = {
  product: ProductWithVariants;
};

export default function ProductSummary({ product }: Props) {
  const { name, variants } = product;

  const [selectedVariantId, setSelectedVariantId] = useState<string>(() => variants?.[0]?.id ?? "");

  useEffect(() => {
    setSelectedVariantId(variants?.[0]?.id ?? "");
  }, [product.id, variants]);

  const selectedVariant = useMemo(() => {
    if (!variants?.length) return undefined;
    return variants.find((v) => v.id === selectedVariantId) ?? variants[0];
  }, [variants, selectedVariantId]);

  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const decreaseItemQuantity = useCartStore((s) => s.decreaseItemQuantity);
  const openCart = useCartStore((s) => s.openCart);

  const syncing = useCartStore((s) => s.syncing);
  const dirty = useCartStore((s) => s.dirty);

  const variantInCart = selectedVariant ? items.find((i) => i.variantId === selectedVariant.id) : undefined;

  const quantity = variantInCart?.quantity ?? 0;

  const stockOnHand = selectedVariant?.stockOnHand ?? 0;
  const soldOut = !selectedVariant || stockOnHand <= 0;

  const disabled = soldOut || syncing || dirty;

  const price: number = selectedVariant?.price ?? 0;

  const handleIncrement = () => {
    if (!selectedVariant || disabled) return;

    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      image: product.images?.[0] ?? "",
      weightGrams: selectedVariant.weightGrams,
      price: selectedVariant.price,
      stockOnHand: selectedVariant.stockOnHand ?? 0,
    });
  };

  const handleDecrement = () => {
    if (!selectedVariant || disabled) return;
    if (!variantInCart) return;
    decreaseItemQuantity(selectedVariant.id);
  };

  const handlePrimaryClick = () => {
    if (!selectedVariant || disabled) return;

    if (variantInCart) {
      openCart();
      return;
    }

    handleIncrement();
    openCart();
  };

  const handleBuyNow = () => {
    if (!selectedVariant || disabled) return;

    // If item is not yet in cart, add 1
    if (!variantInCart) {
      addItem({
        variantId: selectedVariant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        image: product.images?.[0] ?? "",
        weightGrams: selectedVariant.weightGrams,
        price: selectedVariant.price,
        stockOnHand: selectedVariant.stockOnHand ?? 0,
      });
    }

    // Go straight to cart / checkout
    openCart();
  };

  const MAX_PER_ORDER = 99;
  const maxQty = Math.min(MAX_PER_ORDER, stockOnHand);

  return (
    <section className={styles.summary}>
      <h1 className={styles.title}>{name}</h1>

      <p className={styles.subtitle}>Premium Kenyan tea—crafted for a clean cup and a bold finish.</p>

      {/* Variant Picker */}
      {variants?.length ? (
        <div className={styles.variantPicker} aria-label="Choose size">
          <p className={styles.variantLabel}>Size</p>

          <div className={styles.variantChips} role="radiogroup" aria-label="Select grams">
            {variants.map((v) => {
              const out = (v.stockOnHand ?? 0) <= 0;
              const active = v.id === selectedVariantId;

              return (
                <button
                  key={v.id}
                  type="button"
                  className={[
                    styles.variantChip,
                    active ? styles.variantChipActive : "",
                    out ? styles.variantChipDisabled : "",
                  ].join(" ")}
                  onClick={() => setSelectedVariantId(v.id)}
                  disabled={syncing || dirty}
                  aria-disabled={syncing || dirty}
                  aria-pressed={active}
                  role="radio"
                  aria-checked={active}
                  title={out ? "Out of stock" : undefined}
                >
                  <span className={styles.variantChipText}>{v.weightGrams}g</span>
                  {out ? <span className={styles.variantChipMeta}>Sold out</span> : null}
                </button>
              );
            })}
          </div>

          {selectedVariant ? (
            <p className={styles.variantHint}>
              {selectedVariant.stockOnHand != null && selectedVariant.stockOnHand > 0 ? (
                <>
                  {/* {selectedVariant.stockOnHand} left */}
                  {selectedVariant.stockOnHand <= 5 && (
                    <span className={styles.lowStockAlert}>
                      <ClockFading size={12} /> Only {selectedVariant.stockOnHand} left !!
                    </span>
                  )}
                </>
              ) : (
                "Currently unavailable"
              )}
            </p>
          ) : null}

        </div>
      ) : null}

      <div className={styles.priceBlock}>
        <div className={styles.priceRow}>
          <span className={styles.currentPrice}>KSH {price.toFixed(2)}</span>
        </div>
      </div>

      {!soldOut && (
        <div className={styles.controlsRow}>
          <QuantitySelector
            value={quantity}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            min={0}
            max={maxQty}
            disableDecrement={!variantInCart || disabled}
            disableIncrement={disabled || quantity >= maxQty}
          />
        </div>
      )}

      <div className={styles.actionsRow}>
        <Button variant="primary" className={styles.primaryButton} disabled={disabled} onClick={handlePrimaryClick}>
          {soldOut ? "Sold Out" : syncing || dirty ? "Updating…" : variantInCart ? "View in Cart" : "Add to Cart"}
        </Button>

        {!soldOut && (
          <Button variant="secondary" className={styles.secondaryButton} disabled={disabled} onClick={handleBuyNow}>
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
