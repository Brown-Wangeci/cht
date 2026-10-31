import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/common/container/Container";
import styles from "./SuccessPage.module.css";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { checkoutSessions, orders, orderItems } from "@/db/schema";
import { CHECKOUT_SESSION_COOKIE, LAST_ORDER_COOKIE, asUuid } from "@/lib/server/cookies";
import { getCompany } from "@/lib/company";
import { formatKES, toMoney } from "@/lib/pricing";
import CheckoutCompleteClient from "./_components/CheckoutCompleteClient";
import PaymentStatusPoller from "./_components/PaymentStatusPoller";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false },
};

type Props = {
  searchParams: Promise<{ ref?: string | string[] }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { ref } = await searchParams;
  const store = await cookies();

  const checkoutCookie = asUuid(store.get(CHECKOUT_SESSION_COOKIE)?.value);
  const lastOrderCookie = asUuid(store.get(LAST_ORDER_COOKIE)?.value);
  const checkoutSessionId = asUuid(Array.isArray(ref) ? ref[0] : ref) ?? checkoutCookie ?? lastOrderCookie;

  // If we have no way to identify the checkout, send user back
  if (!checkoutSessionId) redirect("/products");

  // Order details are only shown to the browser that placed the order.
  const isOwner = checkoutSessionId === checkoutCookie || checkoutSessionId === lastOrderCookie;

  const [session] = await db
    .select({ id: checkoutSessions.id, status: checkoutSessions.status })
    .from(checkoutSessions)
    .where(eq(checkoutSessions.id, checkoutSessionId))
    .limit(1);

  if (!session) redirect("/products");

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.checkoutSessionId, checkoutSessionId))
    .limit(1);

  const company = getCompany();
  const contact = company.contacts.primary;

  if (!order) {
    if (session.status === "failed") {
      return (
        <div className={styles.page}>
          <Container>
            <header className={styles.header}>
              <h1 className={styles.title}>Payment not completed</h1>
              <p className={styles.subtitle}>
                Your payment didn’t go through and no order was placed. You can try again — your cart and
                delivery details are saved.
              </p>
            </header>
            {isOwner && (
              <div className={styles.actions}>
                <Link href="/checkout/payment" className={styles.button}>
                  Try payment again
                </Link>
                <Link href="/products" className={styles.buttonSecondary}>
                  Back to shop
                </Link>
              </div>
            )}
          </Container>
        </div>
      );
    }

    // Webhook hasn't confirmed the payment yet: keep checking for a while.
    return (
      <div className={styles.page}>
        <Container>
          <header className={styles.header}>
            <h1 className={styles.title}>Processing payment…</h1>
            <p className={styles.subtitle}>
              We’re confirming your payment. This usually takes a few seconds — please keep this page open.
            </p>
          </header>

          <div className={styles.card}>
            <div className={styles.processingText}>
              <PaymentStatusPoller
                timeoutMessage={
                  <p>
                    This is taking longer than usual. If you completed payment, your order will be confirmed by
                    email shortly. Questions? Contact us at <a href={`mailto:${contact.email}`}>{contact.email}</a> or{" "}
                    <a href={`tel:${contact.phone}`}>{contact.phone}</a>.
                  </p>
                }
              />
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className={styles.page}>
        <Container>
          <header className={styles.header}>
            <h1 className={styles.title}>Order confirmed</h1>
            <p className={styles.subtitle}>
              This order has been paid. A confirmation with the full details was sent to the email address used at
              checkout.
            </p>
          </header>
          <div className={styles.actions}>
            <Link href="/products" className={styles.button}>
              Continue shopping
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  // Load order items for receipt
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  const shippingFee = toMoney(order.shippingFee);
  const subtotal = order.subtotal != null ? toMoney(order.subtotal) : toMoney(order.totalAmount);

  return (
    <div className={styles.page}>
      <Container>
        {/* client helper: empties the cart and ends the checkout session */}
        <CheckoutCompleteClient />

        <header className={styles.header}>
          <h1 className={styles.title}>Payment confirmed ✅</h1>
          <p className={styles.subtitle}>
            Thank you! Your order has been placed successfully. A confirmation has been sent to {order.email}.
          </p>
        </header>

        <section className={styles.grid}>
          <div className={styles.left}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Order details</h2>

              <div className={styles.row}>
                <span className={styles.label}>Order number</span>
                <span className={styles.valueMono}>#{order.id.slice(0, 8).toUpperCase()}</span>
              </div>

              <div className={styles.row}>
                <span className={styles.label}>Email</span>
                <span className={styles.value}>{order.email}</span>
              </div>

              <div className={styles.row}>
                <span className={styles.label}>Total paid</span>
                <span className={styles.value}>{formatKES(order.totalAmount)}</span>
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

            <div className={styles.actions}>
              <Link href="/products" className={styles.button}>
                Continue shopping
              </Link>
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
                      {formatKES(toMoney(i.price) * i.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.divider} />

              <div className={styles.row}>
                <span className={styles.label}>Subtotal</span>
                <span className={styles.value}>{formatKES(subtotal)}</span>
              </div>

              <div className={styles.row}>
                <span className={styles.label}>Delivery</span>
                <span className={styles.value}>{shippingFee > 0 ? formatKES(shippingFee) : "Free"}</span>
              </div>

              <div className={styles.row}>
                <span className={styles.label}>Total</span>
                <span className={styles.value}>{formatKES(order.totalAmount)}</span>
              </div>
            </div>
          </aside>
        </section>
      </Container>
    </div>
  );
}
