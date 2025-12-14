"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./OrderSummary.module.css";
import { useCartStore } from "@/lib/stores/cart";
import { useEffect, useState } from "react";

export default function OrderSummaryLive() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);

  // ✅ avoid any hydration mismatch warnings
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const hasItems = items.length > 0;

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Order summary</h2>
        <Link className={styles.editLink} href="/products">
          Edit
        </Link>
      </div>

      {!hasItems ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Your cart is empty</p>
          <p className={styles.emptyText}>Add items to continue checkout.</p>
          <Link className={styles.emptyCta} href="/products">
            Browse products →
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.items}>
            {items.map((item) => {
              const thumbSrc = item.images?.[0] ?? "";

              return (
                <div key={item.id} className={styles.item}>
                  <div className={styles.thumb}>
                    {thumbSrc ? (
                      <Image
                        src={thumbSrc}
                        alt={item.name}
                        fill
                        className={styles.thumbImg}
                        sizes="56px"
                      />
                    ) : null}

                    <span
                      className={styles.qtyBadge}
                      aria-label={`Quantity ${item.quantity}`}
                    >
                      {item.quantity}
                    </span>
                  </div>

                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{item.name}</p>
                    {item.category && <p className={styles.itemMeta}>{item.category}</p>}
                  </div>

                  <div className={styles.itemTotal}>
                    KSH {(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.divider} />

          <div className={styles.row}>
            <span className={styles.label}>Subtotal</span>
            <span className={styles.value}>KSH {subtotal.toFixed(2)}</span>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Shipping</span>
            <span className={styles.valueMuted}>Calculated at checkout</span>
          </div>

          <div className={styles.divider} />

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total</span>
            <span className={styles.totalValue}>KSH {subtotal.toFixed(2)}</span>
          </div>

          <p className={styles.note}>Free shipping is applied automatically when eligible.</p>
        </>
      )}
    </section>
  );
}
