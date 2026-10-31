import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import styles from "./ShippingPage.module.css";
import Container from "@/components/common/container/Container";
import ShippingForm from "@/components/checkout/shipping/ShippingForm";
import OrderSummary from "@/components/checkout/order-summary/OrderSummary";
import { db } from "@/db";
import { checkoutSessions } from "@/db/schema";
import { CHECKOUT_SESSION_COOKIE, asUuid } from "@/lib/server/cookies";
import type { ShippingValues } from "@/lib/actions/checkout";

export const metadata: Metadata = {
  title: "Shipping",
  robots: { index: false },
};

export default async function ShippingPage() {
  const store = await cookies();
  const checkoutSessionId = asUuid(store.get(CHECKOUT_SESSION_COOKIE)?.value);

  let initialValues: Partial<ShippingValues> | null = null;

  if (checkoutSessionId) {
    const [session] = await db
      .select()
      .from(checkoutSessions)
      .where(eq(checkoutSessions.id, checkoutSessionId))
      .limit(1);

    if (session?.status === "paid") redirect(`/checkout/success?ref=${session.id}`);

    // Only prefill if session exists AND is still editable
    if (session && (session.status === "pending" || session.status === "failed")) {
      initialValues = {
        firstName: session.firstName ?? "",
        lastName: session.lastName ?? "",
        email: session.email ?? "",
        phone: session.phone ?? "",
        address1: session.addressLine1 ?? "",
        address2: session.addressLine2 ?? "",
        city: session.city ?? "",
        country: session.country ?? "Kenya",
        notes: session.notes ?? "",
      };
    }
  }

  return (
    <div className={styles.page}>
      <Container>
        <header className={styles.header}>
          <h1 className={styles.title}>Shipping</h1>
          <p className={styles.subtitle}>
            Provide your delivery details. Your order summary updates automatically.
          </p>
        </header>

        <section className={styles.grid}>
          <div className={styles.left}>
            <ShippingForm initialValues={initialValues} />
          </div>

          <aside className={styles.right} aria-label="Order summary">
            <OrderSummary />
          </aside>
        </section>
      </Container>
    </div>
  );
}
