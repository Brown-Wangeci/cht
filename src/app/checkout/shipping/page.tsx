import styles from "./ShippingPage.module.css";
import Container from "@/components/common/container/Container";
import ShippingForm from "@/components/checkout/shipping/ShippingForm";
import OrderSummary from "@/components/checkout/order-summary/OrderSummary";

export default async function ShippingPage() {
  return (
    <main className={styles.page}>
      <Container>
        <header className={styles.header}>
          <h1 className={styles.title}>Shipping</h1>
          <p className={styles.subtitle}>
            Provide your delivery details. Review your order below — to edit items, go back to Shop.
          </p>
        </header>

        <section className={styles.grid}>
          <div className={styles.left}>
            <ShippingForm />
          </div>

          <aside className={styles.right} aria-label="Order summary">
            <OrderSummary />
          </aside>
        </section>
      </Container>
    </main>
  );
}
