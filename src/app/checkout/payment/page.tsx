import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/common/container/Container";
import styles from "./PaymentPage.module.css";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { carts, checkoutSessions } from "@/db/schema";
import OrderSummary from "@/components/checkout/order-summary/OrderSummary";
import ShippingSummary from "@/components/checkout/payment/ShippingSummary";
import PayNowButton from "@/components/checkout/payment/PayNowButton";
import { CHECKOUT_SESSION_COOKIE, asUuid } from "@/lib/server/cookies";

export const metadata: Metadata = {
  title: "Payment",
  robots: { index: false },
};

export default async function PaymentPage() {
  const store = await cookies();
  const checkoutSessionId = asUuid(store.get(CHECKOUT_SESSION_COOKIE)?.value);

  if (!checkoutSessionId) redirect("/checkout/shipping");

  const [session] = await db
    .select()
    .from(checkoutSessions)
    .where(eq(checkoutSessions.id, checkoutSessionId))
    .limit(1);

  if (!session) redirect("/checkout/shipping");
  if (session.status === "paid") redirect(`/checkout/success?ref=${session.id}`);
  if (session.status !== "pending" && session.status !== "failed") redirect("/checkout/shipping");

  // The cart must still be locked for this checkout (unlocked by "Change items" → re-confirm details).
  const [cart] = await db
    .select({ status: carts.status })
    .from(carts)
    .where(eq(carts.id, session.cartSessionId))
    .limit(1);

  if (cart?.status !== "locked") redirect("/checkout/shipping");

  return (
    <div className={styles.page}>
      <Container>
        <header className={styles.header}>
          <h1 className={styles.title}>Payment</h1>
          <p className={styles.subtitle}>
            Review your order and complete payment securely.
          </p>
        </header>

        {session.status === "failed" && (
          <p className={styles.notice} role="alert">
            Your last payment attempt didn’t go through. No money was taken — you can try again below.
          </p>
        )}

        <section className={styles.grid}>
          <div className={styles.left}>
            <ShippingSummary session={session} />
            <div className={styles.payCard}>
              <h2 className={styles.cardTitle}>Pay securely</h2>
              <p className={styles.cardText}>
                Pay via M-Pesa, card, or bank transfer using IntaSend.
              </p>

              <PayNowButton />
              <p className={styles.note}>
                By continuing, you agree to our <Link href="/terms">Terms</Link> and complete payment for this order.
              </p>
            </div>
          </div>

          <aside className={styles.right} aria-label="Order summary">
            <OrderSummary cartId={session.cartSessionId} hideEditLink showChangeItemsButton />
          </aside>
        </section>
      </Container>
    </div>
  );
}
