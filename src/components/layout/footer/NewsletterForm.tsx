"use client";

import { useActionState } from "react";
import styles from "./Footer.module.css";
import { subscribeNewsletter, type NewsletterState } from "@/lib/actions/newsletter";

export default function NewsletterForm() {
  const [state, formAction, pending] = useActionState<NewsletterState, FormData>(subscribeNewsletter, null);

  return (
    <form action={formAction} className={styles.newsletterForm}>
      <div className={styles.newsletter}>
        <label htmlFor="newsletter-email" className={styles.srOnly}>
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          placeholder="Your email"
          className={styles.input}
          autoComplete="email"
          required
          maxLength={254}
          defaultValue={state && !state.ok ? state.email : ""}
        />
        {/* Honeypot (hidden from people, tempting to bots) */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className={styles.honeypot} aria-hidden />
        <button className={styles.button} type="submit" disabled={pending}>
          {pending ? "…" : "Subscribe"}
        </button>
      </div>
      {state && (
        <p role="status" className={state.ok ? styles.formSuccess : styles.formError}>
          {state.message}
        </p>
      )}
    </form>
  );
}
