import Image from "next/image";
import Link from "next/link";
import styles from "./OrderSummary.module.css";
import CustomLink from "@/components/ui/custom-link/CustomLink";
import { getCheckoutCartSnapshot } from "@/lib/actions/checkout";
import ChangeItemsButton from "../change-items-button/ChangeItemsButton";


type OrderSummaryProps = {
  hideEditLink?: boolean;
  showChangeItemsButton?: boolean;
};

export default async function OrderSummary( { hideEditLink = false, showChangeItemsButton = false }: OrderSummaryProps) {
  const { items, totals } = await getCheckoutCartSnapshot();
  const hasItems = items.length > 0;

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Order summary</h2>
        { !hideEditLink && (
          <Link className={styles.editLink} href="/products">
            Edit
          </Link>
        )}
        { showChangeItemsButton && <ChangeItemsButton /> }
      </div>

      {!hasItems ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Your cart is empty</p>
          <p className={styles.emptyText}>Add items to continue checkout.</p>
          <CustomLink href="/products" text="Browse products →" align="left" size="medium" />
        </div>
      ) : (
        <>
          <div className={styles.items}>
            {items.map((item) => (
              <div key={item.variantId} className={styles.item}>
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

                  <span className={styles.qtyBadge} aria-label={`Quantity ${item.quantity}`}>
                    {item.quantity}
                  </span>
                </div>

                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{item.name}</p>
                  <p className={styles.itemMeta}>
                    {item.category} • {item.weightGrams}g
                  </p>
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
        </>
      )}
    </section>
  );
}
