"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./PayNowButton.module.css";

type Props = {
  disabled?: boolean;
};

export default function PayNowButton({ disabled = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data: { checkoutUrl?: string; error?: string; redirectTo?: string } = await res
        .json()
        .catch(() => ({}));

      if (!res.ok) {
        if (data.redirectTo) {
          router.push(data.redirectTo);
          return;
        }
        throw new Error(data.error ?? "Failed to start payment");
      }

      if (!data.checkoutUrl) throw new Error("Missing checkout URL");

      window.location.assign(data.checkoutUrl);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className={styles.buttonWrapper}>
      <button
        type="button"
        onClick={startPayment}
        disabled={loading || disabled}
        className={styles.payButton}
      >
        {loading ? "Redirecting…" : "Pay now"}
      </button>

      {error && (
        <p className={styles.errorMessage} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
