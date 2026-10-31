import Link from "next/link";
import { cookies } from "next/headers";
import styles from "./OrderSummary.module.css";
import CustomLink from "@/components/ui/custom-link/CustomLink";
import ProductImage from "@/components/ui/product-image/ProductImage";
import ChangeItemsButton from "../change-items-button/ChangeItemsButton";
import { getCartSnapshot } from "@/lib/server/cart";
import { CART_SESSION_COOKIE, asUuid } from "@/lib/server/cookies";
import { DELIVERY_FEE, deliveryPromo, formatKES } from "@/lib/pricing";

type OrderSummaryProps = {
  hideEditLink?: boolean;
  showChangeItemsButton?: boolean;
  /** Read a specific cart (e.g. the one a checkout session belongs to) instead of the cookie's. */
  cartId?: string;
};

export default async function OrderSummary({
  hideEditLink = false,
  showChangeItemsButton = false,
  cartId,
}: OrderSummaryProps) {
  const store = await cookies();
  const { items, totals } = await getCartSnapshot(cartId ?? asUuid(store.get(CART_SESSION_COOKIE)?.value));
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
        { showChangeItemsButton && hasItems && <ChangeItemsButton alwaysVisible /> }
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
                  <ProductImage
                    src={item.image}
                    alt={item.name}
                    fill
                    className={styles.thumbImg}
                    sizes="56px"
                  />

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
                  {formatKES(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.divider} />

          <div className={styles.row}>
            <span className={styles.label}>Subtotal</span>
            <span className={styles.value}>{formatKES(totals.subtotal)}</span>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Delivery</span>
            <span className={totals.shippingFee > 0 ? styles.value : styles.valueMuted}>
              {totals.shippingFee > 0 ? formatKES(totals.shippingFee) : "Free"}
            </span>
          </div>

          <div className={styles.divider} />

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total</span>
            <span className={styles.totalValue}>{formatKES(totals.total)}</span>
          </div>

          {DELIVERY_FEE > 0 && <p className={styles.note}>{deliveryPromo()}.</p>}
        </>
      )}
    </section>
  );
}
