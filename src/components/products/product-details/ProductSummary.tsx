"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductWithVariants } from "@/types/product";
import styles from "./ProductSummary.module.css";
import Button from "@/components/ui/button/Button";
import { Truck, ShieldCheck, ClockFading } from "lucide-react";
import QuantitySelector from "./QuantitySelector";
import { useCartStore } from "@/lib/stores/cart";
import { deliveryPromo, formatKES } from "@/lib/pricing";

type Props = {
  product: ProductWithVariants;
};

/** Rendered with `key={product.id}` so variant selection resets when navigating between products. */
export default function ProductSummary({ product }: Props) {
  const router = useRouter();
  const { name, variants } = product;

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    () => variants.find((v) => (v.stockOnHand ?? 0) > 0)?.id ?? variants[0]?.id ?? ""
  );
  const [buying, setBuying] = useState(false);

  const selectedVariant = useMemo(() => {
    if (!variants?.length) return undefined;
    return variants.find((v) => v.id === selectedVariantId) ?? variants[0];
  }, [variants, selectedVariantId]);

  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const decreaseItemQuantity = useCartStore((s) => s.decreaseItemQuantity);
  const openCart = useCartStore((s) => s.openCart);
  const syncNow = useCartStore((s) => s.syncNow);

  const syncing = useCartStore((s) => s.syncing);
  const dirty = useCartStore((s) => s.dirty);
  const locked = useCartStore((s) => s.locked);
  const cartError = useCartStore((s) => s.error);

  const variantInCart = selectedVariant ? items.find((i) => i.variantId === selectedVariant.id) : undefined;

  const quantity = variantInCart?.quantity ?? 0;

  const stockOnHand = selectedVariant?.stockOnHand ?? 0;
  const soldOut = !selectedVariant || stockOnHand <= 0;

  const disabled = soldOut || syncing || dirty || buying;

  const price: number = selectedVariant?.price ?? 0;

  const toCartItem = () =>
    selectedVariant && {
      variantId: selectedVariant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      image: product.images?.[0] ?? "",
      weightGrams: selectedVariant.weightGrams,
      price: selectedVariant.price,
      stockOnHand: selectedVariant.stockOnHand ?? 0,
    };

  const handleIncrement = () => {
    const item = toCartItem();
    if (!item || disabled) return;
    addItem(item);
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

  const handleBuyNow = async () => {
    const item = toCartItem();
    if (!item || disabled) return;

    // A cart mid-checkout can't change: take the shopper back to payment instead.
    if (locked) {
      router.push("/checkout/payment");
      return;
    }

    setBuying(true);
    if (!variantInCart) addItem(item);

    // Make sure the server has the cart before the (server-rendered) checkout reads it.
    const synced = await syncNow();
    setBuying(false);

    if (synced) router.push("/checkout/shipping");
    else openCart();
  };

  const MAX_PER_ORDER = 99;
  const maxQty = Math.min(MAX_PER_ORDER, stockOnHand);

  const tagline = product.tastingNotes?.length
    ? product.tastingNotes.join(" · ")
    : product.category;

  return (
    <section className={styles.summary}>
      <h1 className={styles.title}>{name}</h1>

      <p className={styles.subtitle}>{tagline}</p>

      {/* Variant Picker */}
      {variants?.length ? (
        <div className={styles.variantPicker}>
          <p className={styles.variantLabel} id="variant-label">Size</p>

          <div className={styles.variantChips} role="radiogroup" aria-labelledby="variant-label">
            {variants.map((v) => {
              const out = (v.stockOnHand ?? 0) <= 0;
              const active = v.id === selectedVariant?.id;

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
                  {selectedVariant.stockOnHand <= 5 && (
                    <span className={styles.lowStockAlert}>
                      <ClockFading size={12} /> Only {selectedVariant.stockOnHand} left
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
          <span className={styles.currentPrice}>{formatKES(price)}</span>
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
            disableDecrement={!variantInCart || disabled || locked}
            disableIncrement={disabled || locked || quantity >= maxQty}
          />
        </div>
      )}

      <div className={styles.actionsRow}>
        <Button variant="primary" className={styles.primaryButton} disabled={disabled} onClick={handlePrimaryClick}>
          {soldOut ? "Sold Out" : syncing || dirty ? "Updating…" : variantInCart ? "View in Cart" : "Add to Cart"}
        </Button>

        {!soldOut && (
          <Button variant="secondary" className={styles.secondaryButton} disabled={disabled} onClick={handleBuyNow}>
            {buying ? "Preparing checkout…" : "Buy Now"}
          </Button>
        )}
      </div>

      {cartError && (
        <p role="status" className={styles.variantHint}>
          {cartError}
        </p>
      )}

      <div className={styles.trustRow}>
        <div className={styles.trustItem}>
          <Truck size={16} />
          <span>{deliveryPromo()}</span>
        </div>
        <div className={styles.trustItem}>
          <ShieldCheck size={16} />
          <span>Secure payments via M-Pesa &amp; card</span>
        </div>
      </div>
    </section>
  );
}
