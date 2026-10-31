"use client";

import { ShoppingCart, Check } from "lucide-react";
import styles from "./ProductCardCartButton.module.css";
import { useCartStore } from "@/lib/stores/cart";
import type { ProductWithVariants } from "@/types/product";

type Props = {
  product: ProductWithVariants;
};

export default function ProductCardCartButton({ product }: Props) {
  const openCart = useCartStore((s) => s.openCart);
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);

  const syncing = useCartStore((s) => s.syncing);
  const dirty = useCartStore((s) => s.dirty);

  const pendingByVariantId = useCartStore((s) => s.pendingByVariantId ?? {});

  const inCart = items.some((i) => i.productId === product.id);

  const variants = product.variants ?? [];
  const defaultVariant = variants.find((v) => (v.stockOnHand ?? 0) > 0) ?? variants[0];

  const isSoldOut = !defaultVariant || (defaultVariant.stockOnHand ?? 0) <= 0;
  const pending = defaultVariant ? !!pendingByVariantId[defaultVariant.id] : false;

  const disabled = syncing || dirty || pending || isSoldOut;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (disabled) return;

    if (inCart) {
      openCart();
      return;
    }

    if (!defaultVariant) return;

    addItem({
      variantId: defaultVariant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      image: product.images?.[0] ?? "",
      weightGrams: defaultVariant.weightGrams,
      price: defaultVariant.price,
      stockOnHand: defaultVariant.stockOnHand ?? 0,
    });
  };

  return (
    <button
      type="button"
      className={`${styles.cartButton} ${inCart ? styles.cartButtonActive : ""}`}
      onClick={handleClick}
      aria-label={
        isSoldOut ? "Sold out" : inCart ? "View cart" : "Add to cart"
      }
      disabled={disabled}
      aria-disabled={disabled}
      style={disabled ? { opacity: 0.7, cursor: "not-allowed" } : undefined}
    >
      {inCart ? <Check size={20} strokeWidth={2} /> : <ShoppingCart size={20} strokeWidth={2} />}
    </button>
  );
}
