"use client";

import { useActionState } from "react";
import { loginAdmin, type AdminLoginState } from "@/lib/actions/admin";
import styles from "../Admin.module.css";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<AdminLoginState, FormData>(loginAdmin, null);

  return (
    <form action={formAction}>
      <label htmlFor="password" className={styles.muted}>
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className={styles.input}
      />
      {state?.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className={styles.button} disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
