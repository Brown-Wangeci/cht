// components/checkout/order-summary/OrderSummaryServer.tsx
import Image from "next/image";
import Link from "next/link";
import styles from "./OrderSummary.module.css";
import { getCheckoutCartSnapshot } from "@/lib/actions/checkout";

export default async function OrderSummaryServer() {
  // Try to render real SSR summary when possible
  const { items, totals } = await getCheckoutCartSnapshot();
  const hasItems = items.length > 0;

  if (!hasItems) {
    // Fallback to your skeleton exactly as you had it
    return (
      <section className={styles.card} aria-label="Order summary loading">
        <h2 className={styles.title}>Order summary</h2>

        <div className={styles.skeletonBlock}>
          <div className={styles.skeletonRow} />
          <div className={styles.skeletonRow} />
          <div className={styles.skeletonRow} />
        </div>

        <div className={styles.divider} />

        <div className={styles.row}>
          <span className={styles.label}>Subtotal</span>
          <span className={styles.valueMuted}>Loading…</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Shipping</span>
          <span className={styles.valueMuted}>Calculated at checkout</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalValueMuted}>Loading…</span>
        </div>
      </section>
    );
  }

  // Real SSR summary (better than skeleton)
  return (
    <section className={styles.card} aria-label="Order summary">
      <div className={styles.header}>
        <h2 className={styles.title}>Order summary</h2>
        <Link className={styles.editLink} href="/products">
          Edit
        </Link>
      </div>

      <div className={styles.items}>
        {items.map((item) => (
          <div key={item.id} className={styles.item}>
            <div className={styles.thumb}>
              {item.image ? (
                <Image
                  src={item.image}
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
              {item.category ? (
                <p className={styles.itemMeta}>{item.category}</p>
              ) : null}
            </div>

            <div className={styles.itemTotal}>
              KSH {(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.divider} />

      <div className={styles.row}>
        <span className={styles.label}>Subtotal</span>
        <span className={styles.value}>KSH {totals.subtotal.toFixed(2)}</span>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Shipping</span>
        <span className={styles.valueMuted}>Calculated at checkout</span>
      </div>

      <div className={styles.divider} />

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Total</span>
        <span className={styles.totalValue}>KSH {totals.subtotal.toFixed(2)}</span>
      </div>

      <p className={styles.note}>Free shipping is applied automatically when eligible.</p>
    </section>
  );
}
