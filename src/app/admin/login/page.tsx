import { redirect } from "next/navigation";
import { isAdmin, isAdminConfigured } from "@/lib/server/admin-auth";
import LoginForm from "./LoginForm";
import styles from "../Admin.module.css";

export const metadata = { title: "Sign in" };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <div className={styles.loginCard}>
      <h1 className={styles.title}>Store admin</h1>
      {isAdminConfigured() ? (
        <LoginForm />
      ) : (
        <p className={styles.error}>Admin access is disabled. Set ADMIN_PASSWORD in the environment to enable it.</p>
      )}
    </div>
  );
}
