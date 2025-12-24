"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./ChangeItemsButton.module.css";

export default function ChangeItemsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCancelCheckout = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/checkout/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to cancel checkout");
      }

      /**
       * ✅ Cart is now unlocked
       * ✅ Checkout session is cancelled
       * User can safely modify cart
       */
      router.push("/products"); // or "/checkout/shipping"
      router.refresh();
    } catch (err: any) {
      setLoading(false);
      alert(err.message || "An unexpected error occurred");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCancelCheckout}
      disabled={loading}
      className={styles.changeItemsButton}
    >
        {loading ? "Cancelling…" : "Change Items"}
    </button>
  );
}
