import styles from "./ShippingPage.module.css";
import Container from "@/components/common/container/Container";
import ShippingForm from "@/components/checkout/shipping/ShippingForm";
import OrderSummary from "@/components/checkout/order-summary/OrderSummary";
import { cookies } from "next/headers";
import { db } from "@/db";
import { checkoutSessions } from "@/db/schema";
import { eq } from "drizzle-orm";

const CHECKOUT_COOKIE = "checkout_session";

export default async function ShippingPage() {
  const store = await cookies();
  const checkoutSessionId = store.get(CHECKOUT_COOKIE)?.value?.trim();

  let initialValues: Record<string, string> | null = null;

  if (checkoutSessionId) {
    const [session] = await db
      .select()
      .from(checkoutSessions)
      .where(eq(checkoutSessions.id, checkoutSessionId))
      .limit(1);

    // Only prefill if session exists AND still pending (editable)
    if (session && session.status === "pending") {
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
    <main className={styles.page}>
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
    </main>
  );
}
