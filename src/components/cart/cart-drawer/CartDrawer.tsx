"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./CartDrawer.module.css";
import { useCartStore } from "@/lib/stores/cart";
import CartDrawerItem from "./CartDrawerItem";
import useLockBodyScroll from "@/lib/hooks/useLockBodyScroll";

export default function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const clearCart = useCartStore((s) => s.clearCart);
  const rehydrateCart = useCartStore((s) => s.rehydrateCart);

  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);

  const syncing = useCartStore((s) => s.syncing);
  const dirty = useCartStore((s) => s.dirty);
  const error = useCartStore((s) => s.error);

  useLockBodyScroll(isOpen);

    // ESC to close
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeCart]);

  // Only rehydrate if the cart is settled and not currently being synced/modified
  useEffect(() => {
    if (!isOpen || syncing || dirty ) return;

    // If the cart is open and in a stable state, refresh from server
    // This will catch changes made on other devices/tabs.
    void rehydrateCart();
  }, [isOpen, rehydrateCart]);


  const canCheckout = items.length > 0 && !syncing && !dirty;

  return (
    <div className={`${styles.root} ${isOpen ? styles.open : ""}`} aria-hidden={!isOpen}>
      <button
        type="button"
        className={styles.backdrop}
        onClick={closeCart}
        aria-label="Close cart"
      />

      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Cart">
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <h2 className={styles.title}>Your Cart</h2>

            <button
              type="button"
              className={styles.closeBtn}
              onClick={closeCart}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {items.length > 0 && (
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

          {/* Minimal feedback for dev/json-server */}
          {error ? (
            <p style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
              {error} {dirty ? "— Changes will sync when server is back." : null}
            </p>
          ) : null}
        </header>

        <div className={styles.body}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Cart is empty</p>
              <p className={styles.emptyText}>Add a few teas and they’ll show up here.</p>

              <Link href="/products" className={styles.emptyCta} onClick={closeCart}>
                Browse products →
              </Link>
            </div>
          ) : (
            <div className={styles.items}>
              {items.map((item) => (
                <CartDrawerItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <div className={styles.summary}>
            <div className={styles.row}>
              <span className={styles.label}>Subtotal</span>
              <span className={styles.value}>KSH {subtotal.toFixed(2)}</span>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Shipping</span>
              <span className={styles.valueMuted}>Calculated at checkout</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.rowTotal}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalValue}>KSH {subtotal.toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.actions}>
            <Link
              href="/checkout/shipping"
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
              {syncing || dirty ? "Updating cart…" : "Continue to shipping"}
            </Link>

            <Link href="/products" className={styles.continue} onClick={closeCart}>
              Continue shopping →
            </Link>
          </div>
        </footer>
      </aside>
    </div>
  );
}
