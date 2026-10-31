import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/common/container/Container";
import { isAdmin } from "@/lib/server/admin-auth";
import { logoutAdmin } from "@/lib/actions/admin";
import styles from "./Admin.module.css";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const signedIn = await isAdmin();

  return (
    <div className={styles.page}>
      <Container>
        {signedIn && (
          <div className={styles.topbar}>
            <nav className={styles.nav} aria-label="Admin">
              <span className={styles.brand}>Store admin</span>
              <Link href="/admin">Orders</Link>
              <Link href="/admin/products">Products &amp; stock</Link>
              <Link href="/admin/subscribers">Subscribers</Link>
            </nav>
            <form action={logoutAdmin}>
              <button type="submit" className={styles.buttonSecondary}>
                Sign out
              </button>
            </form>
          </div>
        )}
        {children}
      </Container>
    </div>
  );
}
