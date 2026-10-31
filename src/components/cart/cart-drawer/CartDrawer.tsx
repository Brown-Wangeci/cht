"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./CartDrawer.module.css";
import { useCartStore } from "@/lib/stores/cart";
import CartDrawerItem from "./CartDrawerItem";
import useLockBodyScroll from "@/lib/hooks/useLockBodyScroll";
import CustomLink from "@/components/ui/custom-link/CustomLink";
import ChangeItemsButton from "@/components/checkout/change-items-button/ChangeItemsButton";
import { calcShippingFee, deliveryPromo, formatKES, roundMoney } from "@/lib/pricing";

/** Mounted by CartDrawerGate, which already excludes checkout routes. */
export default function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const clearCart = useCartStore((s) => s.clearCart);
  const rehydrateCart = useCartStore((s) => s.rehydrateCart);
  const locked = useCartStore((s) => s.locked);

  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);

  const syncing = useCartStore((s) => s.syncing);
  const dirty = useCartStore((s) => s.dirty);
  const error = useCartStore((s) => s.error);

  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    void rehydrateCart();
  }, [isOpen, rehydrateCart]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeCart]);

  const shippingFee = calcShippingFee(subtotal);
  const total = roundMoney(subtotal + shippingFee);
  const canCheckout = items.length > 0 && !syncing && !dirty;

  // A locked cart is mid-checkout: send the shopper back to payment rather than re-entering details.
  const checkoutHref = locked ? "/checkout/payment" : "/checkout/shipping";
  const checkoutLabel = syncing || dirty ? "Updating cart…" : locked ? "Return to payment" : "Continue to shipping";

  return (
    <div className={`${styles.root} ${isOpen ? styles.open : ""}`} aria-hidden={!isOpen} inert={!isOpen}>
      <button type="button" className={styles.backdrop} onClick={closeCart} aria-label="Close cart" tabIndex={-1} />

      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Cart">
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <h2 className={styles.title}>Your Cart</h2>

            <button type="button" className={styles.closeBtn} onClick={closeCart} aria-label="Close">
              ✕
            </button>
          </div>
          <div className={styles.headerBottom}>

          {items.length > 0 && !locked && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={clearCart}
              disabled={syncing}
              aria-disabled={syncing}
            >
              Clear cart
            </button>
          )}

          { locked &&
            <div style={{ justifyContent: "flex-end", display: "flex"}}>
              <ChangeItemsButton />
            </div>
          }
          </div>

          {error ? (
            <p role="status" style={{ marginTop: "var(--space-sm)", fontSize: 12, opacity: 0.8 }}>
              {error} {dirty ? "— Changes will sync when the connection is back." : null}
            </p>
          ) : null}
        </header>

        <div className={styles.body}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Cart is empty</p>
              <p className={styles.emptyText}>Add a few teas and they’ll show up here.</p>

              <CustomLink href="/products" text="Browse products →" align="left" onClick={closeCart} size="medium" />
            </div>
          ) : (
            <div className={styles.items}>
              {items.map((item) => (
                <CartDrawerItem key={item.variantId} item={item} />
              ))}
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <div className={styles.summary}>
            <div className={styles.row}>
              <span className={styles.label}>Subtotal</span>
              <span className={styles.value}>{formatKES(subtotal)}</span>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Delivery</span>
              <span className={styles.valueMuted}>
                {items.length === 0 ? "—" : shippingFee > 0 ? formatKES(shippingFee) : "Free"}
              </span>
            </div>

            {shippingFee > 0 && (
              <div className={styles.row}>
                <span className={styles.valueMuted}>{deliveryPromo()}</span>
              </div>
            )}

            <div className={styles.divider} />

            <div className={styles.rowTotal}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalValue}>{formatKES(total)}</span>
            </div>
          </div>

          <div className={styles.actions}>
            <Link
              href={checkoutHref}
              className={`${styles.actionBtn} ${styles.primary}`}
              aria-disabled={!canCheckout}
              tabIndex={!canCheckout ? -1 : 0}
              onClick={(e) => {
                if (!canCheckout) {
                  e.preventDefault();
                  return;
                }
                closeCart();
              }}
              style={!canCheckout ? { opacity: 0.6, pointerEvents: "none" } : undefined}
            >
              {checkoutLabel}
            </Link>

            <CustomLink href="/products" text="Continue shopping →" align="center" onClick={closeCart} size="small" />
          </div>
        </footer>
      </aside>
    </div>
  );
}
