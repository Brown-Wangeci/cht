"use client";

import { useState } from "react";
import styles from "./PayNowButton.module.css";

export default function PayNowButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error ?? "Failed to start payment");
      if (!data?.checkoutUrl) throw new Error("Missing checkout URL");

      window.location.href = data.checkoutUrl;
    } catch (e: any) {
        const msg = e?.message ?? "Something went wrong";
        setError(
          msg.includes("CART_NOT_LOCKED")
            ? "Your checkout is no longer active. Please review shipping again."
            : msg
        );
        setLoading(false);
    }
  };

  return (
    <div className={styles.buttonWrapper}>
      <button
        type="button"
        onClick={startPayment}
        disabled={loading}
        className={styles.payButton}
      >
        {loading ? "Redirecting…" : "Pay now"}
      </button>

      {error && (
        <p className={styles.errorMessage}>
          {error}
        </p>
      )}
    </div>
  );
}