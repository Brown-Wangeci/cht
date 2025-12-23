// app/checkout/success/page.tsx
import Container from "@/components/common/container/Container";
import styles from "./SuccessPage.module.css";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import ClearCheckoutClient from "./_components/ClearCheckoutClient";

const CHECKOUT_COOKIE = "checkout_session";

type Props = {
  searchParams?: { ref?: string };
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const store = await cookies();

  const refFromUrl = String(searchParams?.ref ?? "").trim();
  const refFromCookie = store.get(CHECKOUT_COOKIE)?.value?.trim() ?? "";
  const checkoutSessionId = refFromUrl || refFromCookie;

  // If we have no way to identify the checkout, send user back
  if (!checkoutSessionId) redirect("/checkout/shipping");

  // Try to find the order created by the webhook
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.checkoutSessionId, checkoutSessionId))
    .limit(1);

  // If webhook hasn't created the order yet, show "processing" + auto refresh
  if (!order) {
    return (
      <main className={styles.page}>
        <Container>
          <header className={styles.header}>
            <h1 className={styles.title}>Processing payment…</h1>
            <p className={styles.subtitle}>
              We’re confirming your payment. This usually takes a few seconds.
            </p>
          </header>

          <div className={styles.card}>
            <p className={styles.processingText}>
              If you’re not redirected automatically, refresh the page in a moment.
            </p>
          </div>

          {/* simple server-side auto refresh */}
          <meta httpEquiv="refresh" content="3" />
        </Container>
      </main>
    );
  }

  // Load order items for receipt
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  // Clear checkout cookie (we're done with the checkout session now)
  store.delete(CHECKOUT_COOKIE);

  return (
    <main className={styles.page}>
      <Container>
        {/* client helper: clears local cart storage so UI doesn't show old cart */}
        <ClearCheckoutClient />

        <header className={styles.header}>
          <h1 className={styles.title}>Payment confirmed ✅</h1>
          <p className={styles.subtitle}>
            Thank you! Your order has been placed successfully.
          </p>
        </header>

        <section className={styles.grid}>
          <div className={styles.left}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Order details</h2>

              <div className={styles.row}>
                <span className={styles.label}>Order ID</span>
                <span className={styles.valueMono}>{order.id}</span>
              </div>

              <div className={styles.row}>
                <span className={styles.label}>Email</span>
                <span className={styles.value}>{order.email}</span>
              </div>

              <div className={styles.row}>
                <span className={styles.label}>Total</span>
                <span className={styles.value}>
                  KSH {Number(order.totalAmount).toFixed(2)}
                </span>
              </div>

              <div className={styles.divider} />

              <h3 className={styles.sectionTitle}>Shipping</h3>
              <p className={styles.text}>
                {order.firstName} {order.lastName}
                <br />
                {order.phone}
                <br />
                {order.addressLine1}
                {order.addressLine2 ? `, ${order.addressLine2}` : ""}
                <br />
                {order.city}
                {order.country ? `, ${order.country}` : ""}
              </p>

              {order.notes ? (
                <>
                  <div className={styles.divider} />
                  <h3 className={styles.sectionTitle}>Note</h3>
                  <p className={styles.text}>{order.notes}</p>
                </>
              ) : null}
            </div>
          </div>

          <aside className={styles.right} aria-label="Order items">
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Items</h2>

              <div className={styles.items}>
                {items.map((i) => (
                  <div key={i.id} className={styles.itemRow}>
                    <div className={styles.itemLeft}>
                      <p className={styles.itemName}>{i.name}</p>
                      <p className={styles.itemMeta}>
                        {i.category} • {i.weightGrams}g • Qty {i.quantity}
                      </p>
                    </div>
                    <div className={styles.itemTotal}>
                      KSH {(Number(i.price) * Number(i.quantity)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.divider} />

              <div className={styles.row}>
                <span className={styles.label}>Total</span>
                <span className={styles.value}>
                  KSH {Number(order.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>
          </aside>
        </section>
      </Container>
    </main>
  );
}
