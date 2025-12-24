import Container from "@/components/common/container/Container";
import styles from "./PaymentPage.module.css";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { checkoutSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import OrderSummary from "@/components/checkout/order-summary/OrderSummary";
import ShippingSummary from "@/components/checkout/payment/ShippingSummary";
import PayNowButton from "@/components/checkout/payment/PayNowButton";

const CHECKOUT_COOKIE = "checkout_session";

export default async function PaymentPage() {
  const store = await cookies();
  const checkoutSessionId = store.get(CHECKOUT_COOKIE)?.value?.trim();

  if (!checkoutSessionId) redirect("/checkout/shipping");

  const [session] = await db
    .select()
    .from(checkoutSessions)
    .where(eq(checkoutSessions.id, checkoutSessionId))
    .limit(1);

  if (!session) redirect("/checkout/shipping");

  return (
    <main className={styles.page}>
      <Container>
        <header className={styles.header}>
          <h1 className={styles.title}>Payment</h1>
          <p className={styles.subtitle}>
            Review your order and complete payment securely.
          </p>
        </header>

        <section className={styles.grid}>
          <div className={styles.left}>
            <ShippingSummary session={session} />
            <div className={styles.payCard}>
              <h2 className={styles.cardTitle}>Pay securely</h2>
              <p className={styles.cardText}>
                Pay via M-Pesa, Card, or Bank transfer using IntaSend.
              </p>

              <PayNowButton />
              <p className={styles.note}>
                By continuing, you agree to complete payment for this order.
              </p>
            </div>
          </div>

          <aside className={styles.right} aria-label="Order summary">
            {/* ✅ server-rendered summary, no live cart updates */}
            <OrderSummary hideEditLink={true} showChangeItemsButton={true} />
          </aside>
        </section>
      </Container>
    </main>
  );
}
