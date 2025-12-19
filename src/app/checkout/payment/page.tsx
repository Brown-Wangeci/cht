import styles from "./PaymentPage.module.css";
import Container from "@/components/common/container/Container";

export default async function PaymentPage() {
  return (
    <main className={styles.page}>
      <Container>
        <div>Payment Page</div>
      </Container>
    </main>
  );
}
